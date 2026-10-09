import crypto from 'crypto';
import { getState, setState } from './db';
import { SystemNotification } from '../types';
import { sseBroker } from './sse';

// ============================================================================
// PHASE 2.1 : MOTEUR DE SÉQUESTRE FINANCIER B2B & RÉCONCILIATION BANCAIRE (ACPR)
// ============================================================================

export interface EscrowAccountEntry {
  orderId: string;
  virtualIban: string;
  beneficiary: string;
  bankName: string;
  buyerName: string;
  supplierName: string;
  totalOrderAmountTTC: number;
  fundsHeldEur: number;
  fundsReleasedEur: number;
  fundsDisputedEur: number;
  commissionEarnedEur: number;
  logisticsAllocatedEur: number;
  supplierPendingEur: number;
  status: 'pending_deposit' | 'secured_in_escrow' | 'milestone_partial_released' | 'fully_settled' | 'frozen_dispute' | 'refunded';
  currentMilestoneStage: 1 | 2 | 3;
  milestones: {
    stage1Pct: number; // 30% commande
    stage1Released: boolean;
    stage1ReleasedAt?: string;
    stage2Pct: number; // 50% sortie usine / contrôle QA Hub
    stage2Released: boolean;
    stage2ReleasedAt?: string;
    stage3Pct: number; // 20% réception finale conforme
    stage3Released: boolean;
    stage3ReleasedAt?: string;
  };
  disputeInfo?: {
    openedAt: string;
    reason: string;
    reportedBy: string;
    claimAmountEur: number;
    status: 'investigating' | 'arbitration' | 'resolved';
    resolution?: string;
  };
  lastTransactionAt: string;
}

export interface EscrowAuditRecord {
  id: string;
  timestamp: string;
  orderId: string;
  type: 'DEPOSIT_CONFIRMED' | 'MILESTONE_RELEASE' | 'DISPUTE_FROZEN' | 'DISPUTE_RESOLVED' | 'REFUND_EXECUTED';
  amountEur: number;
  authorizedBy: string;
  reference: string;
  sha256Proof: string;
  details: string;
}

export interface EscrowLedgerSummary {
  totalHeldEur: number;
  totalReleasedEur: number;
  totalDisputedEur: number;
  totalCommissionEarnedEur: number;
  totalLogisticsAllocatedEur: number;
  activeAccountsCount: number;
  complianceCertification: string;
  regulatoryJurisdiction: string;
}

// In-memory persistent audit log for escrow
const escrowAuditRecords: EscrowAuditRecord[] = [];

// Helper: Calculate SHA-256 integrity hash
function calculateSha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Calcul du grand livre et état global de tous les comptes cantonnés
 */
export function getEscrowLedger(): { summary: EscrowLedgerSummary; accounts: EscrowAccountEntry[]; auditLog: EscrowAuditRecord[] } {
  const state = getState();
  const accounts: EscrowAccountEntry[] = [];

  let totalHeldEur = 0;
  let totalReleasedEur = 0;
  let totalDisputedEur = 0;
  let totalCommissionEarnedEur = 0;
  let totalLogisticsAllocatedEur = 0;

  state.orders.forEach(order => {
    const totalTTC = order.totalTTC || 0;
    const goodsTotal = order.goodsTotal || (totalTTC * 0.85);
    const ecopoolFee = order.ecopoolFee || (totalTTC * (state.economicConfig.commissionRatePct / 100));
    const logisticsFee = order.logisticsFee || 0;

    const milestones = order.contract?.escrowMilestones || {
      stage1Pct: 30,
      stage1Released: order.escrowStatus === 'paiement_securise' || order.escrowStatus === 'paiement_libere',
      stage2Pct: 50,
      stage2Released: order.escrowStatus === 'paiement_libere',
      stage3Pct: 20,
      stage3Released: order.escrowStatus === 'paiement_libere'
    };

    let stage1Amount = (goodsTotal * (milestones.stage1Pct / 100));
    let stage2Amount = (goodsTotal * (milestones.stage2Pct / 100));
    let stage3Amount = (goodsTotal * (milestones.stage3Pct / 100));

    let releasedAmount = 0;
    if (milestones.stage1Released) releasedAmount += stage1Amount;
    if (milestones.stage2Released) releasedAmount += stage2Amount;
    if (milestones.stage3Released) releasedAmount += stage3Amount;

    let heldAmount = totalTTC - releasedAmount;
    let disputedAmount = 0;

    let accountStatus: EscrowAccountEntry['status'] = 'secured_in_escrow';
    if (order.escrowStatus === 'bloque_litige') {
      accountStatus = 'frozen_dispute';
      disputedAmount = heldAmount;
      heldAmount = 0;
    } else if (order.escrowStatus === 'paiement_libere' || (milestones.stage1Released && milestones.stage2Released && milestones.stage3Released)) {
      accountStatus = 'fully_settled';
      heldAmount = 0;
    } else if (milestones.stage1Released || milestones.stage2Released) {
      accountStatus = 'milestone_partial_released';
    } else if (order.escrowStatus === 'paiement_en_attente') {
      accountStatus = 'pending_deposit';
    }

    if (accountStatus === 'fully_settled') {
      totalCommissionEarnedEur += ecopoolFee;
      totalLogisticsAllocatedEur += logisticsFee;
    }

    totalHeldEur += heldAmount;
    totalReleasedEur += releasedAmount;
    totalDisputedEur += disputedAmount;

    // Détermination de l'étape actuelle
    let currentStage: 1 | 2 | 3 = 1;
    if (milestones.stage2Released) {
      currentStage = 3;
    } else if (milestones.stage1Released) {
      currentStage = 2;
    }

    // Reconstruction du compte virtuel
    const cleanId = order.id.replace(/\D/g, '').padEnd(6, '9').slice(0, 6);
    const virtualIban = `FR76 3000 4001 2345 ${cleanId.slice(0, 4)} ${cleanId.slice(4, 6)}89 42`;

    accounts.push({
      orderId: order.id,
      virtualIban,
      beneficiary: 'EcoPool SAS — Compte de Cantonnement Séquestre B2B (ACPR)',
      bankName: 'Crédit Coopératif / Groupe BPCE',
      buyerName: order.companyName || 'Acheteur Partenaire',
      supplierName: 'Plastinnov Normandie SAS',
      totalOrderAmountTTC: Math.round(totalTTC * 100) / 100,
      fundsHeldEur: Math.round(heldAmount * 100) / 100,
      fundsReleasedEur: Math.round(releasedAmount * 100) / 100,
      fundsDisputedEur: Math.round(disputedAmount * 100) / 100,
      commissionEarnedEur: Math.round(ecopoolFee * 100) / 100,
      logisticsAllocatedEur: Math.round(logisticsFee * 100) / 100,
      supplierPendingEur: Math.round(Math.max(0, goodsTotal - releasedAmount) * 100) / 100,
      status: accountStatus,
      currentMilestoneStage: currentStage,
      milestones: {
        stage1Pct: milestones.stage1Pct,
        stage1Released: Boolean(milestones.stage1Released),
        stage1ReleasedAt: milestones.stage1Released ? '2026-03-01T10:00:00.000Z' : undefined,
        stage2Pct: milestones.stage2Pct,
        stage2Released: Boolean(milestones.stage2Released),
        stage2ReleasedAt: milestones.stage2Released ? '2026-03-15T14:30:00.000Z' : undefined,
        stage3Pct: milestones.stage3Pct,
        stage3Released: Boolean(milestones.stage3Released),
        stage3ReleasedAt: milestones.stage3Released ? '2026-03-28T09:15:00.000Z' : undefined,
      },
      disputeInfo: order.escrowStatus === 'bloque_litige' ? {
        openedAt: '2026-03-20T11:00:00.000Z',
        reason: order.notes || 'Écart dimensionnel constaté lors du contrôle qualité Hub.',
        reportedBy: 'Contrôleur Hub Qualité Rouen',
        claimAmountEur: Math.round(totalTTC * 100) / 100,
        status: 'arbitration'
      } : undefined,
      lastTransactionAt: order.reservedAt || new Date().toISOString()
    });
  });

  const summary: EscrowLedgerSummary = {
    totalHeldEur: Math.round(totalHeldEur * 100) / 100,
    totalReleasedEur: Math.round(totalReleasedEur * 100) / 100,
    totalDisputedEur: Math.round(totalDisputedEur * 100) / 100,
    totalCommissionEarnedEur: Math.round(totalCommissionEarnedEur * 100) / 100,
    totalLogisticsAllocatedEur: Math.round(totalLogisticsAllocatedEur * 100) / 100,
    activeAccountsCount: accounts.length,
    complianceCertification: 'ACPR / Art. L. 522-1 du Code Monétaire et Financier',
    regulatoryJurisdiction: 'Banque de France / ACPR France'
  };

  return { summary, accounts, auditLog: escrowAuditRecords };
}

/**
 * Traitement d'un Webhook Bancaire de Virement SEPA Entrant (Réconciliation automatique)
 */
export async function processBankTransferWebhook(params: {
  orderId: string;
  amountEur: number;
  senderIban?: string;
  senderName?: string;
  bankReference?: string;
  hmacSignature?: string;
}): Promise<{ success: boolean; message: string; transaction: any; updatedOrder: any }> {
  const { orderId, amountEur, senderIban, senderName, bankReference } = params;
  const state = getState();

  const orderIndex = state.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error(`Commande ${orderId} introuvable pour réconciliation.`);
  }

  const order = state.orders[orderIndex];
  const timestamp = new Date().toISOString();
  const txRef = bankReference || `SEPA-INST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Enregistrement d'audit cryptographique
  const auditProof = calculateSha256(`${orderId}:${amountEur}:${txRef}:${timestamp}`);
  const auditRecord: EscrowAuditRecord = {
    id: `audit-esc-${Date.now()}`,
    timestamp,
    orderId,
    type: 'DEPOSIT_CONFIRMED',
    amountEur,
    authorizedBy: 'Webhook Bancaire Crédit Coopératif (Automatique)',
    reference: txRef,
    sha256Proof: auditProof,
    details: `Crédit de ${amountEur.toLocaleString()} € reçu depuis ${senderIban || 'Compte SEPA'} (${senderName || order.companyName}). Fonds cantonnés conformément aux règles ACPR.`
  };
  escrowAuditRecords.unshift(auditRecord);

  // Mise à jour de la commande
  const updatedOrders = [...state.orders];
  updatedOrders[orderIndex] = {
    ...order,
    escrowStatus: 'paiement_securise',
    logisticsStep: order.logisticsStep || 'reception_hub',
    notes: (order.notes || '') + `\n[${timestamp.split('T')[0]}] Virement SEPA confirmé (${amountEur} €) - Ref: ${txRef}`
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Virement Séquestre Réconcilié & Cantonné',
    message: `Le virement de ${amountEur.toLocaleString()} € pour la commande #${order.id} a été réconcilié. Fonds cantonnés sous séquestre ACPR.`,
    type: 'success',
    timestamp,
    read: false
  };

  setState({
    orders: updatedOrders,
    notifications: [newNotif, ...state.notifications]
  });

  // Diffusion temps réel SSE
  sseBroker.broadcast('ESCROW_FUNDS_LOCKED', {
    orderId,
    amountEur,
    bankReference: txRef,
    escrowStatus: 'paiement_securise',
    timestamp
  });

  return {
    success: true,
    message: `Réconciliation bancaire réussie. ${amountEur.toLocaleString()} € cantonnés sur le sous-compte de la commande #${orderId}.`,
    transaction: {
      reference: txRef,
      amountEur,
      timestamp,
      proof: auditProof
    },
    updatedOrder: updatedOrders[orderIndex]
  };
}

/**
 * Libération conditionnelle d'un Jalon de Séquestre (30% commande / 50% contrôle Hub QA / 20% réception)
 */
export async function releaseEscrowMilestone(
  orderId: string,
  milestoneStage: 1 | 2 | 3,
  authorizedBy: string = 'Superviseur EcoPool Hub',
  notes?: string
): Promise<{ success: boolean; message: string; order: any }> {
  const state = getState();
  const orderIndex = state.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error(`Commande ${orderId} introuvable.`);
  }

  const order = state.orders[orderIndex];
  const timestamp = new Date().toISOString();

  const contract = order.contract || {
    contractNumber: `CTR-2026-${order.id.toUpperCase()}`,
    poNumber: `PO-${order.id.toUpperCase()}`,
    rseCertNumber: `CERT-RSE-${order.id.toUpperCase()}`,
    generatedDate: timestamp.split('T')[0],
    buyerSignature: {
      signed: true,
      signatoryName: order.companyName || 'Direction Achats Botanica',
      signatoryTitle: 'Responsable Sourcing Durable',
      signedAt: '2026-03-01'
    },
    supplierSignature: { signed: true, signatoryName: 'Plastinnov Usine', signedAt: '2026-03-01' },
    ecopoolSignature: { signed: true, signatoryName: 'Alexandre Roche', signedAt: '2026-03-01', hashSha256: '9f86d081...' },
    escrowMilestones: {
      stage1Pct: 30,
      stage1Released: false,
      stage2Pct: 50,
      stage2Released: false,
      stage3Pct: 20,
      stage3Released: false
    },
    carbonMetrics: {
      co2AvoidedKg: Math.round(order.quantity * 0.05),
      virginPlasticAvoidedKg: Math.round(order.quantity * 0.028),
      recycledContentPct: 100,
      waterSavedLiters: Math.round(order.quantity * 0.12),
      treeEquivalent: Math.max(1, Math.round(order.quantity * 0.002))
    }
  };

  const milestones = { ...contract.escrowMilestones };
  let releaseAmountEur = 0;
  let logStep = order.logisticsStep;
  let newEscrowStatus = order.escrowStatus;
  let stageDescription = '';

  const goodsTotal = order.goodsTotal || (order.totalTTC * 0.85);

  if (milestoneStage === 1) {
    milestones.stage1Released = true;
    releaseAmountEur = goodsTotal * (milestones.stage1Pct / 100);
    stageDescription = `Jalon 1 (Acompte ${milestones.stage1Pct}% lancement usine)`;
  } else if (milestoneStage === 2) {
    milestones.stage1Released = true;
    milestones.stage2Released = true;
    releaseAmountEur = goodsTotal * (milestones.stage2Pct / 100);
    logStep = 'controle_lot';
    stageDescription = `Jalon 2 (${milestones.stage2Pct}% Sortie usine & Contrôle Qualité Hub Rouen conforme)`;
  } else if (milestoneStage === 3) {
    milestones.stage1Released = true;
    milestones.stage2Released = true;
    milestones.stage3Released = true;
    releaseAmountEur = goodsTotal * (milestones.stage3Pct / 100);
    newEscrowStatus = 'paiement_libere';
    logStep = 'livre';
    stageDescription = `Jalon 3 (Solde ${milestones.stage3Pct}% Livraison finale & clôture du séquestre)`;
  }

  // Enregistrement d'audit cryptographique
  const auditProof = calculateSha256(`RELEASE:${orderId}:STAGE_${milestoneStage}:${releaseAmountEur}:${timestamp}`);
  const auditRecord: EscrowAuditRecord = {
    id: `audit-rel-${Date.now()}`,
    timestamp,
    orderId,
    type: 'MILESTONE_RELEASE',
    amountEur: releaseAmountEur,
    authorizedBy,
    reference: `REL-STG${milestoneStage}-${Date.now().toString().slice(-6)}`,
    sha256Proof: auditProof,
    details: `${stageDescription} libéré. Virement de ${releaseAmountEur.toFixed(2)} € vers le compte industriel. ${notes || ''}`
  };
  escrowAuditRecords.unshift(auditRecord);

  const updatedOrders = [...state.orders];
  updatedOrders[orderIndex] = {
    ...order,
    escrowStatus: newEscrowStatus,
    logisticsStep: logStep,
    contract: {
      ...contract,
      escrowMilestones: milestones
    }
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: `Jalon ${milestoneStage} Séquestre Libéré`,
    message: `${stageDescription} débloqué pour la commande #${order.id}. ${releaseAmountEur.toFixed(2)} € transférés à l'industriel.`,
    type: 'info',
    timestamp,
    read: false
  };

  setState({
    orders: updatedOrders,
    notifications: [newNotif, ...state.notifications]
  });

  // SSE broadcast
  sseBroker.broadcast('ESCROW_RELEASED', {
    orderId,
    milestoneStage,
    releaseAmountEur,
    authorizedBy,
    timestamp
  });

  return {
    success: true,
    message: `${stageDescription} validé avec succès. Virement de ${releaseAmountEur.toFixed(2)} € exécuté.`,
    order: updatedOrders[orderIndex]
  };
}

/**
 * Gel conservatoire immédiat en cas de litige qualité ou défaut documentaire
 */
export async function freezeEscrowDispute(
  orderId: string,
  reason: string,
  reportedBy: string,
  claimAmountEur?: number
): Promise<{ success: boolean; message: string; order: any }> {
  const state = getState();
  const orderIndex = state.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error(`Commande ${orderId} introuvable.`);
  }

  const order = state.orders[orderIndex];
  const timestamp = new Date().toISOString();
  const amountToFreeze = claimAmountEur || order.totalTTC;

  const auditProof = calculateSha256(`FREEZE:${orderId}:${amountToFreeze}:${timestamp}`);
  const auditRecord: EscrowAuditRecord = {
    id: `audit-frz-${Date.now()}`,
    timestamp,
    orderId,
    type: 'DISPUTE_FROZEN',
    amountEur: amountToFreeze,
    authorizedBy: reportedBy,
    reference: `DISPUTE-${orderId.toUpperCase()}`,
    sha256Proof: auditProof,
    details: `Gel conservatoire du compte séquestre activé. Motif : ${reason}. Tous les virements vers l'industriel sont suspendus jusqu'à arbitrage.`
  };
  escrowAuditRecords.unshift(auditRecord);

  const updatedOrders = [...state.orders];
  updatedOrders[orderIndex] = {
    ...order,
    escrowStatus: 'bloque_litige',
    notes: (order.notes || '') + `\n[${timestamp.split('T')[0]} LITIGE GELÉ] ${reason} (Signalé par: ${reportedBy})`
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Gel Conservatoire Séquestre Activé',
    message: `Les fonds de la commande #${order.id} (${amountToFreeze.toLocaleString()} €) ont été gelés suite à un signalement de litige.`,
    type: 'warning',
    timestamp,
    read: false
  };

  setState({
    orders: updatedOrders,
    notifications: [newNotif, ...state.notifications]
  });

  // SSE broadcast
  sseBroker.broadcast('DISPUTE_FROZEN', {
    orderId,
    reason,
    reportedBy,
    frozenAmount: amountToFreeze,
    timestamp
  });

  return {
    success: true,
    message: `Gel conservatoire exécuté. Fonds de ${amountToFreeze.toLocaleString()} € bloqués sur le compte de cantonnement.`,
    order: updatedOrders[orderIndex]
  };
}

/**
 * Arbitrage et Résolution de litige (remboursement partiel, total ou levée du litige)
 */
export async function resolveEscrowDispute(
  orderId: string,
  resolution: 'refund_buyer_full' | 'refund_partial_proceed' | 'dismiss_dispute_release',
  terms: { refundPct: number; notes: string; resolvedBy: string }
): Promise<{ success: boolean; message: string; order: any }> {
  const state = getState();
  const orderIndex = state.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error(`Commande ${orderId} introuvable.`);
  }

  const order = state.orders[orderIndex];
  const timestamp = new Date().toISOString();
  let updatedEscrowStatus = order.escrowStatus;
  let message = '';

  const totalTTC = order.totalTTC;
  let refundAmount = 0;

  if (resolution === 'refund_buyer_full') {
    updatedEscrowStatus = 'remboursement';
    refundAmount = totalTTC;
    message = `Arbitrage rendu : Remboursement intégral de ${totalTTC.toLocaleString()} € vers l'acheteur. Séquestre clos.`;
  } else if (resolution === 'refund_partial_proceed') {
    updatedEscrowStatus = 'paiement_securise';
    refundAmount = (totalTTC * (terms.refundPct / 100));
    message = `Arbitrage rendu : Avoir commercial et remboursement partiel de ${refundAmount.toFixed(2)} € (${terms.refundPct}%). Reprise du calendrier de commande.`;
  } else if (resolution === 'dismiss_dispute_release') {
    updatedEscrowStatus = 'paiement_securise';
    message = `Arbitrage rendu : Litige classé sans suite après contre-expertise. Fonds dégelés et remis en circulation normale.`;
  }

  const auditProof = calculateSha256(`RESOLVE:${orderId}:${resolution}:${refundAmount}:${timestamp}`);
  const auditRecord: EscrowAuditRecord = {
    id: `audit-res-${Date.now()}`,
    timestamp,
    orderId,
    type: 'DISPUTE_RESOLVED',
    amountEur: refundAmount,
    authorizedBy: terms.resolvedBy || 'Comité d’Arbitrage EcoPool',
    reference: `ARB-RES-${orderId.toUpperCase()}`,
    sha256Proof: auditProof,
    details: `${message} Décision : ${terms.notes}`
  };
  escrowAuditRecords.unshift(auditRecord);

  const updatedOrders = [...state.orders];
  updatedOrders[orderIndex] = {
    ...order,
    escrowStatus: updatedEscrowStatus,
    notes: (order.notes || '') + `\n[${timestamp.split('T')[0]} LITIGE RÉSOLU] ${message}`
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Litige Séquestre Arbitré & Résolu',
    message,
    type: 'success',
    timestamp,
    read: false
  };

  setState({
    orders: updatedOrders,
    notifications: [newNotif, ...state.notifications]
  });

  sseBroker.broadcast('DISPUTE_RESOLVED', {
    orderId,
    resolution,
    refundAmount,
    timestamp
  });

  return {
    success: true,
    message,
    order: updatedOrders[orderIndex]
  };
}
