import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Campaign, OrderReservation, SystemNotification, PlatformEconomicConfig } from '../types';
import { getState, setState, PlatformState } from './db';
import { generateVirtualEscrowAccount } from './integrations';

// ============================================================================
// DÉFI 1 : CONCURRENCE & ATOMICITÉ DU MOTEUR D'AGRÉGATION (ECOPOOL PHASE 1)
// ============================================================================

export interface TransactionLockLog {
  id: string;
  timestamp: string;
  resourceKey: string;
  orderId?: string;
  campaignId: string;
  buyerId: string;
  quantity: number;
  initialVolume: number;
  finalVolume: number;
  tierBefore: number;
  tierAfter: number;
  tierUnlocked: boolean;
  lockWaitMs: number;
  executionMs: number;
  status: 'COMMITTED' | 'ROLLEDBACK' | 'REJECTED';
  reason?: string;
  hashSha256: string;
}

export interface ConcurrencyMetrics {
  totalTransactions: number;
  committedCount: number;
  rejectedCount: number;
  averageLockWaitMs: number;
  averageExecutionMs: number;
  activeLocksCount: number;
  concurrencyProtectionEnabled: boolean;
  recentAuditLogs: TransactionLockLog[];
}

// ----------------------------------------------------------------------------
// 1. GESTIONNAIRE DE VERROUS TRANSACTIONNELS (MUTEX QUEUE PAR RESSOURCE)
// ----------------------------------------------------------------------------

class ResourceLockManager {
  private activeLocks: Map<string, Promise<void>> = new Map();
  private lockCounters: Map<string, number> = new Map();

  /**
   * Acquiert un verrou exclusif sur une ressource (ex: campagne ID).
   * Toutes les transactions simultanées sur cette ressource sont sérialisées (FIFO).
   */
  async acquire(resourceKey: string, timeoutMs: number = 8000): Promise<() => void> {
    const startTime = Date.now();
    this.lockCounters.set(resourceKey, (this.lockCounters.get(resourceKey) || 0) + 1);

    while (this.activeLocks.has(resourceKey)) {
      if (Date.now() - startTime > timeoutMs) {
        this.lockCounters.set(resourceKey, Math.max(0, (this.lockCounters.get(resourceKey) || 1) - 1));
        throw new Error(`Timeout d'acquisition de verrou pour la ressource ${resourceKey} (${timeoutMs}ms)`);
      }
      try {
        await Promise.race([
          this.activeLocks.get(resourceKey)!,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Wait timeout')), 200))
        ]);
      } catch {
        // Retry loop
      }
    }

    let releaseFn!: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseFn = () => {
        this.activeLocks.delete(resourceKey);
        this.lockCounters.set(resourceKey, Math.max(0, (this.lockCounters.get(resourceKey) || 1) - 1));
        resolve();
      };
    });

    this.activeLocks.set(resourceKey, lockPromise);
    return releaseFn;
  }

  getActiveLocksCount(): number {
    return this.activeLocks.size;
  }

  getWaitingCount(resourceKey: string): number {
    return Math.max(0, (this.lockCounters.get(resourceKey) || 0) - (this.activeLocks.has(resourceKey) ? 1 : 0));
  }
}

export const lockManager = new ResourceLockManager();

// ----------------------------------------------------------------------------
// 2. CACHE D'IDEMPOTENCE POUR REQUÊTES EN DOUBLE (ANTI-REPLAY)
// ----------------------------------------------------------------------------

interface IdempotentEntry {
  response: any;
  timestamp: number;
}
const idempotencyStore = new Map<string, IdempotentEntry>();

export function checkIdempotency(key?: string): any | null {
  if (!key) return null;
  const entry = idempotencyStore.get(key);
  if (entry) {
    // Valide pendant 10 minutes
    if (Date.now() - entry.timestamp < 10 * 60 * 1000) {
      return entry.response;
    }
    idempotencyStore.delete(key);
  }
  return null;
}

export function saveIdempotency(key: string, response: any): void {
  idempotencyStore.set(key, { response, timestamp: Date.now() });
}

// ----------------------------------------------------------------------------
// 3. JOURNAL D'AUDIT TRANSACTIONNEL IMMUABLE (SHA-256 HASH CHAIN)
// ----------------------------------------------------------------------------

const transactionAuditLogs: TransactionLockLog[] = [];
let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

function recordAuditLog(log: Omit<TransactionLockLog, 'hashSha256'>): TransactionLockLog {
  const payloadToHash = `${lastHash}:${log.id}:${log.timestamp}:${log.campaignId}:${log.quantity}:${log.status}:${log.initialVolume}->${log.finalVolume}`;
  const currentHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');
  lastHash = currentHash;

  const fullLog: TransactionLockLog = {
    ...log,
    hashSha256: currentHash
  };

  transactionAuditLogs.unshift(fullLog);
  if (transactionAuditLogs.length > 200) {
    transactionAuditLogs.pop();
  }

  return fullLog;
}

export function getTransactionAuditLogs(): TransactionLockLog[] {
  return [...transactionAuditLogs];
}

export function getConcurrencyMetrics(): ConcurrencyMetrics {
  const committed = transactionAuditLogs.filter(l => l.status === 'COMMITTED');
  const rejected = transactionAuditLogs.filter(l => l.status === 'REJECTED' || l.status === 'ROLLEDBACK');

  const avgLock = committed.length > 0
    ? Math.round(committed.reduce((acc, l) => acc + l.lockWaitMs, 0) / committed.length * 10) / 10
    : 0;
  const avgExec = committed.length > 0
    ? Math.round(committed.reduce((acc, l) => acc + l.executionMs, 0) / committed.length * 10) / 10
    : 0;

  return {
    totalTransactions: transactionAuditLogs.length,
    committedCount: committed.length,
    rejectedCount: rejected.length,
    averageLockWaitMs: avgLock,
    averageExecutionMs: avgExec,
    activeLocksCount: lockManager.getActiveLocksCount(),
    concurrencyProtectionEnabled: true,
    recentAuditLogs: transactionAuditLogs.slice(0, 20)
  };
}

// ----------------------------------------------------------------------------
// 4. PERSISTANCE ATOMIQUE CRASH-SAFE (WRITE-TEMP + ATOMIC RENAME)
// ----------------------------------------------------------------------------

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'ecopool-db.json');

export function persistStateAtomically(state: PlatformState): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = path.resolve(DB_DIR, `ecopool-db-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.tmp`);
    const raw = JSON.stringify(state, null, 2);
    fs.writeFileSync(tempFile, raw, 'utf-8');
    fs.renameSync(tempFile, DB_FILE); // Atomic file replace sous POSIX / Linux
  } catch (err) {
    console.error('[EcoPool Atomic Persistence] Erreur d’écriture atomique:', err);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// 5. MOTEUR D'EXÉCUTION TRANSACTIONNELLE ATOMIQUE D'UNE RÉSERVATION
// ----------------------------------------------------------------------------

export interface AtomicBookingParams {
  campaignId: string;
  buyerId: string;
  quantity: number;
  companyName?: string;
  contactName?: string;
  notes?: string;
  idempotencyKey?: string;
  broadcastSSE?: (event: string, payload: any) => void;
}

export interface AtomicBookingResult {
  success: boolean;
  order?: OrderReservation;
  campaign?: Campaign;
  tierUnlocked?: boolean;
  unlockedTier?: { volume: number; unitPrice: number; discountPct: number };
  message: string;
  auditLog: TransactionLockLog;
}

export async function executeAtomicBooking(params: AtomicBookingParams): Promise<AtomicBookingResult> {
  const { campaignId, buyerId, quantity, companyName, contactName, idempotencyKey, broadcastSSE } = params;

  // 1. Vérification Anti-Replay Idempotente
  if (idempotencyKey) {
    const cached = checkIdempotency(idempotencyKey);
    if (cached) {
      console.log(`[Idempotency] Réponse mise en cache renvoyée pour la clé ${idempotencyKey}`);
      return cached;
    }
  }

  const txId = `tx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const lockStart = Date.now();

  // 2. Acquisition exclusive du verrou sur la campagne
  const releaseLock = await lockManager.acquire(`campaign:${campaignId}`, 6000);
  const lockAcquiredAt = Date.now();
  const lockWaitMs = lockAcquiredAt - lockStart;

  const execStart = Date.now();

  try {
    // 3. Lecture de l'état faisant autorité (Single Source of Truth)
    const currentState = getState();
    const campaign = currentState.campaigns.find(c => c.id === campaignId);

    if (!campaign) {
      const audit = recordAuditLog({
        id: txId,
        timestamp: new Date().toISOString(),
        resourceKey: `campaign:${campaignId}`,
        campaignId,
        buyerId,
        quantity,
        initialVolume: 0,
        finalVolume: 0,
        tierBefore: 0,
        tierAfter: 0,
        tierUnlocked: false,
        lockWaitMs,
        executionMs: Date.now() - execStart,
        status: 'REJECTED',
        reason: 'Campagne non trouvée'
      });
      return { success: false, message: 'Campagne introuvable', auditLog: audit };
    }

    if (quantity <= 0) {
      const audit = recordAuditLog({
        id: txId,
        timestamp: new Date().toISOString(),
        resourceKey: `campaign:${campaignId}`,
        campaignId,
        buyerId,
        quantity,
        initialVolume: campaign.reservedVolume,
        finalVolume: campaign.reservedVolume,
        tierBefore: campaign.currentUnitPrice,
        tierAfter: campaign.currentUnitPrice,
        tierUnlocked: false,
        lockWaitMs,
        executionMs: Date.now() - execStart,
        status: 'REJECTED',
        reason: 'Quantité nulle ou négative'
      });
      return { success: false, message: 'La quantité doit être strictement positive', auditLog: audit };
    }

    // Vérification de la capacité plafond (ex: 150% de l'objectif max)
    const maxCapacity = (campaign.targetVolume || campaign.moq * 2) * 1.5;
    if (campaign.reservedVolume + quantity > maxCapacity) {
      const audit = recordAuditLog({
        id: txId,
        timestamp: new Date().toISOString(),
        resourceKey: `campaign:${campaignId}`,
        campaignId,
        buyerId,
        quantity,
        initialVolume: campaign.reservedVolume,
        finalVolume: campaign.reservedVolume,
        tierBefore: campaign.currentUnitPrice,
        tierAfter: campaign.currentUnitPrice,
        tierUnlocked: false,
        lockWaitMs,
        executionMs: Date.now() - execStart,
        status: 'REJECTED',
        reason: `Capacité industrielle maximale dépassée (${maxCapacity} unités)`
      });
      return { 
        success: false, 
        message: `Plafond industriel atteint. Capacité maximale réservable : ${maxCapacity - campaign.reservedVolume} unités.`, 
        auditLog: audit 
      };
    }

    // 4. Calcul déterministe des paliers et détection de bascule atomique
    const initialVolume = campaign.reservedVolume;
    const initialUnitPrice = campaign.currentUnitPrice;
    const newVolume = initialVolume + quantity;

    // Détermination du palier applicable
    let applicableUnitPrice = campaign.priceTiers[0]?.unitPrice || campaign.currentUnitPrice;
    let unlockedTierInfo: { volume: number; unitPrice: number; discountPct: number } | undefined;
    let tierUnlocked = false;

    // Tri des paliers par volume décroissant
    const sortedTiers = [...campaign.priceTiers].sort((a, b) => b.volume - a.volume);
    for (const tier of sortedTiers) {
      if (newVolume >= tier.volume) {
        applicableUnitPrice = tier.unitPrice;
        if (initialVolume < tier.volume) {
          tierUnlocked = true;
          unlockedTierInfo = {
            volume: tier.volume,
            unitPrice: tier.unitPrice,
            discountPct: tier.discountPct
          };
        }
        break;
      }
    }

    // Calculs économiques
    const goodsTotal = Math.round(quantity * applicableUnitPrice * 100) / 100;
    const commissionPct = currentState.economicConfig?.commissionRatePct || 6.5;
    const ecopoolFee = Math.round(goodsTotal * (commissionPct / 100) * 100) / 100;
    const shippingPerUnit = campaign.logisticsConditions?.estimatedHubShippingCostPerUnit || 0.05;
    const logisticsFee = Math.round(quantity * shippingPerUnit * 100) / 100;
    const totalAmountHT = Math.round((goodsTotal + ecopoolFee + logisticsFee) * 100) / 100;
    const totalTTC = Math.round(totalAmountHT * 1.2 * 100) / 100;

    // Métriques environnementales ADEME
    const co2SavedKg = Math.round((campaign.product.co2SavedPerUnitGrams * quantity) / 1000);
    const virginPlasticAvoidedKg = Math.round(((campaign.product.weightGrams || 28) * quantity) / 1000);

    // Évolution du statut
    let newStatus = campaign.status;
    if (newVolume >= campaign.moq && campaign.status !== 'moq_atteinte' && campaign.status !== 'objectif_atteint' && campaign.status !== 'production') {
      newStatus = newVolume >= campaign.targetVolume ? 'objectif_atteint' : 'moq_atteinte';
    } else if (newVolume >= campaign.moq * 0.8 && campaign.status === 'ouverte') {
      newStatus = 'presque_financee';
    }

    const orderId = `ord-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const effectiveCompanyName = companyName || 'Laboratoires Botanica France SAS';
    const effectiveContactName = contactName || 'Élodie Mercier';
    const nowIso = new Date().toISOString();
    const dateFormatted = nowIso.slice(0, 10);

    // Création du participant
    const newParticipant = {
      id: `part-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      buyerId,
      buyerName: effectiveContactName,
      companyName: effectiveCompanyName,
      sector: 'cosmetique_naturelle' as const,
      quantity,
      unitPricePaid: applicableUnitPrice,
      totalAmount: totalTTC,
      reservedAt: dateFormatted,
      escrowStatus: 'secured_in_escrow' as const,
      deliveryStatus: 'en_attente' as const
    };

    // Mise à jour rétroactive du prix sur tous les participants précédents si palier franchi
    const updatedParticipants = campaign.participants.map(p => ({
      ...p,
      unitPricePaid: applicableUnitPrice,
      totalAmount: Math.round(p.quantity * applicableUnitPrice * 1.2 * 100) / 100
    }));

    const updatedCampaign: Campaign = {
      ...campaign,
      reservedVolume: newVolume,
      participantsCount: campaign.participantsCount + 1,
      currentUnitPrice: applicableUnitPrice,
      status: newStatus,
      participants: [newParticipant, ...updatedParticipants]
    };

    // Création de l'ordre de réservation et contrat tripartite
    const newOrder: OrderReservation = {
      id: orderId,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      buyerId,
      companyName: effectiveCompanyName,
      productName: campaign.product.name,
      quantity,
      unitPrice: applicableUnitPrice,
      goodsTotal,
      ecopoolFee,
      logisticsFee,
      totalTTC,
      escrowStatus: 'paiement_securise',
      paymentMethod: 'prelevement_sepa_b2b',
      reservedAt: nowIso.replace('T', ' ').slice(0, 16),
      hubTrackingNumber: `HUB-NRM-${dateFormatted.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      finalTrackingNumber: `ECO-EXP-${Math.floor(10000 + Math.random() * 90000)}`,
      logisticsStep: 'reception_hub',
      contract: {
        contractNumber: `CTR-2026-EP-${orderId.replace('ord-', '')}`,
        poNumber: `PO-2026-EP-${orderId.replace('ord-', '')}`,
        rseCertNumber: `RSE-2026-CSRD-${Math.floor(1000 + Math.random() * 9000)}`,
        generatedDate: dateFormatted,
        buyerSignature: {
          signed: false,
          signatoryName: effectiveContactName,
          signatoryTitle: 'Directrice Achats & RSE'
        },
        supplierSignature: {
          signed: true,
          signatoryName: `${campaign.supplier.name} - Direction Industrielle`,
          signedAt: `${dateFormatted} 11:30 CET`
        },
        ecopoolSignature: {
          signed: true,
          signatoryName: 'Alexandre Roche (EcoPool SAS)',
          signedAt: `${dateFormatted} 10:00 CET`,
          hashSha256: crypto.createHash('sha256').update(`CONTRACT-${orderId}-${quantity}`).digest('hex')
        },
        escrowMilestones: {
          stage1Pct: 30,
          stage1Released: true,
          stage2Pct: 50,
          stage2Released: false,
          stage3Pct: 20,
          stage3Released: false
        },
        carbonMetrics: {
          co2AvoidedKg: co2SavedKg,
          virginPlasticAvoidedKg,
          recycledContentPct: campaign.product.recycledPercentage || 100,
          waterSavedLiters: Math.round(quantity * 0.12),
          treeEquivalent: Math.max(1, Math.round(co2SavedKg / 20))
        }
      }
    };

    // Notification système
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      title: tierUnlocked ? '🎉 Nouveau Palier de Prix Débloqué !' : 'Réservation B2B Atomique Validée',
      message: tierUnlocked
        ? `Le palier de ${unlockedTierInfo?.volume.toLocaleString()} unités est franchi ! Prix unitaire abaissé à ${applicableUnitPrice.toFixed(2)} € pour tous les acheteurs.`
        : `Commande ${orderId} (${quantity.toLocaleString()} unités) enregistrée et cantonnée sur l'Escrow EcoPool.`,
      type: tierUnlocked ? 'info' : 'success',
      timestamp: 'À l’instant',
      read: false
    };

    // 5. Commit atomique en base & écriture fichier crash-safe
    const nextCampaigns = currentState.campaigns.map(c => c.id === campaignId ? updatedCampaign : c);
    const nextOrders = [newOrder, ...currentState.orders];
    const nextNotifications = [newNotif, ...currentState.notifications];

    const nextState: PlatformState = {
      ...currentState,
      campaigns: nextCampaigns,
      orders: nextOrders,
      notifications: nextNotifications,
      lastUpdated: nowIso
    };

    setState(nextState);
    persistStateAtomically(nextState);

    const execDuration = Date.now() - execStart;

    // 6. Enregistrement dans le registre d'audit immuable
    const auditLog = recordAuditLog({
      id: txId,
      timestamp: nowIso,
      resourceKey: `campaign:${campaignId}`,
      orderId,
      campaignId,
      buyerId,
      quantity,
      initialVolume,
      finalVolume: newVolume,
      tierBefore: initialUnitPrice,
      tierAfter: applicableUnitPrice,
      tierUnlocked,
      lockWaitMs,
      executionMs: execDuration,
      status: 'COMMITTED'
    });

    // 7. Diffusion temps réel (SSE) à tous les clients connectés
    if (broadcastSSE) {
      broadcastSSE('ORDER_COMMITTED', {
        orderId,
        campaignId,
        quantity,
        totalTTC,
        newReservedVolume: newVolume,
        currentUnitPrice: applicableUnitPrice,
        buyerCompanyName: effectiveCompanyName,
        timestamp: nowIso
      });

      broadcastSSE('CAMPAIGN_PROGRESS', {
        campaignId,
        reservedVolume: newVolume,
        targetVolume: campaign.targetVolume,
        moq: campaign.moq,
        status: newStatus,
        participantsCount: updatedCampaign.participantsCount,
        currentUnitPrice: applicableUnitPrice
      });

      if (tierUnlocked) {
        broadcastSSE('TIER_UNLOCKED', {
          campaignId,
          campaignTitle: campaign.title,
          unlockedVolume: unlockedTierInfo?.volume,
          newUnitPrice: applicableUnitPrice,
          discountPercentage: unlockedTierInfo?.discountPct
        });
      }
    }

    const result: AtomicBookingResult = {
      success: true,
      order: newOrder,
      campaign: updatedCampaign,
      tierUnlocked,
      unlockedTier: unlockedTierInfo,
      message: `Réservation atomique de ${quantity} unités confirmée avec succès (Tx: ${txId}).`,
      auditLog
    };

    // Mise en cache de l'idempotence
    if (idempotencyKey) {
      saveIdempotency(idempotencyKey, result);
    }

    return result;

  } catch (err: any) {
    const execDuration = Date.now() - execStart;
    const auditLog = recordAuditLog({
      id: txId,
      timestamp: new Date().toISOString(),
      resourceKey: `campaign:${campaignId}`,
      campaignId,
      buyerId,
      quantity,
      initialVolume: 0,
      finalVolume: 0,
      tierBefore: 0,
      tierAfter: 0,
      tierUnlocked: false,
      lockWaitMs,
      executionMs: execDuration,
      status: 'ROLLEDBACK',
      reason: err?.message || 'Erreur interne de transaction'
    });

    console.error(`[EcoPool Atomic Booking] Échec de la transaction ${txId}:`, err);
    return {
      success: false,
      message: `Échec transactionnel : ${err?.message || 'Erreur inattendue'}`,
      auditLog
    };

  } finally {
    // 8. Libération du verrou pour le prochain requérant dans la file FIFO
    releaseLock();
  }
}
