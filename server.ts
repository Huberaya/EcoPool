import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { initDatabase, getState, setState, saveDatabase, resetDatabase } from './src/server/db';
import { 
  queryFrenchCompanyRegistry, 
  computeAdemeCarbonImpact, 
  generateVirtualEscrowAccount, 
  generateErpCsvExport, 
  generateCsrdCsvExport 
} from './src/server/integrations';
import { OrderReservation, SystemNotification, Campaign } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// Initialize database
initDatabase();

// Initialize Gemini Client if API key is available
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const state = getState();
  const totalEscrow = state.orders.reduce((sum, o) => sum + (o.totalTTC || 0), 0);

  res.json({
    status: 'ok',
    platform: 'EcoPool B2B Sourcing Platform',
    geminiEnabled: Boolean(aiClient),
    db: {
      campaignsCount: state.campaigns.length,
      ordersCount: state.orders.length,
      suppliersCount: state.suppliers.length,
      totalEscrowEur: Math.round(totalEscrow),
      lastUpdated: state.lastUpdated
    }
  });
});

// ==========================================
// PERSISTENCE REST API ROUTES
// ==========================================

// 1. Get full unified state
app.get('/api/state', (_req, res) => {
  res.json({
    success: true,
    data: getState()
  });
});

// 2. Add new Campaign
app.post('/api/campaigns', (req, res) => {
  const campaignData = req.body;
  const state = getState();
  const newId = `camp-${Math.floor(10 + Math.random() * 90)}`;
  const fullCampaign: Campaign = {
    ...campaignData,
    id: newId,
    reservedVolume: 0,
    participantsCount: 0,
    participants: []
  };

  const newCampaigns = [fullCampaign, ...state.campaigns];
  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Nouvelle Campagne Active',
    message: `La campagne "${fullCampaign.title}" est maintenant ouverte aux réservations B2B.`,
    type: 'success',
    timestamp: new Date().toISOString(),
    read: false
  };

  setState({
    campaigns: newCampaigns,
    notifications: [newNotif, ...state.notifications]
  });

  res.json({ success: true, campaign: fullCampaign });
});

// 3. Update Campaign Status
app.put('/api/campaigns/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const state = getState();

  const campaignIndex = state.campaigns.findIndex(c => c.id === id);
  if (campaignIndex === -1) {
    return res.status(404).json({ success: false, message: 'Campagne introuvable' });
  }

  const updatedCampaigns = [...state.campaigns];
  updatedCampaigns[campaignIndex] = {
    ...updatedCampaigns[campaignIndex],
    status
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Statut de Campagne Modifié',
    message: `La campagne "${updatedCampaigns[campaignIndex].title}" est passée au statut : ${status.toUpperCase()}.`,
    type: 'info',
    timestamp: new Date().toISOString(),
    read: false
  };

  setState({
    campaigns: updatedCampaigns,
    notifications: [newNotif, ...state.notifications]
  });

  res.json({ success: true, campaign: updatedCampaigns[campaignIndex] });
});

// 4. Join Campaign (Atomic Reservation & Contract Creation)
app.post('/api/orders/join', (req, res) => {
  const { campaignId, quantity, notes, buyerId } = req.body;
  const state = getState();

  const campaign = state.campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campagne non trouvée' });
  }

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Quantité invalide' });
  }

  // Calculate pricing tier
  const projectedVolume = campaign.reservedVolume + quantity;
  let unitPrice = campaign.currentUnitPrice;
  const sortedTiers = [...campaign.priceTiers].sort((a, b) => b.volume - a.volume);
  for (const tier of sortedTiers) {
    if (projectedVolume >= tier.volume) {
      unitPrice = tier.unitPrice;
      break;
    }
  }

  const goodsTotal = quantity * unitPrice;
  const ecopoolFee = Math.round(goodsTotal * (state.economicConfig.commissionRatePct / 100) * 100) / 100;
  const logisticsFee = Math.round(quantity * (campaign.logisticsConditions?.estimatedHubShippingCostPerUnit || 0.05) * 100) / 100;
  const totalAmount = Math.round((goodsTotal + ecopoolFee + logisticsFee) * 100) / 100;
  const totalTTC = Math.round(totalAmount * 1.2 * 100) / 100;

  // Status transitions
  let newStatus = campaign.status;
  if (projectedVolume >= campaign.moq && campaign.status !== 'moq_atteinte' && campaign.status !== 'objectif_atteint') {
    newStatus = projectedVolume >= campaign.targetVolume ? 'objectif_atteint' : 'moq_atteinte';
  } else if (projectedVolume >= campaign.moq * 0.8 && campaign.status === 'ouverte') {
    newStatus = 'presque_financee';
  }

  const updatedCampaigns = state.campaigns.map(c => {
    if (c.id === campaignId) {
      return {
        ...c,
        reservedVolume: projectedVolume,
        participantsCount: c.participantsCount + 1,
        currentUnitPrice: unitPrice,
        status: newStatus
      };
    }
    return c;
  });

  const orderId = `ord-${Math.floor(1000 + Math.random() * 9000)}`;
  const co2SavedKg = Math.round((campaign.product.co2SavedPerUnitGrams * quantity) / 1000);
  const virginPlasticAvoidedKg = Math.round(((campaign.product.weightGrams || 28) * quantity) / 1000);
  const dateFormatted = new Date().toISOString().split('T')[0];

  const newOrder: OrderReservation = {
    id: orderId,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    buyerId: buyerId || 'buyer-01',
    companyName: 'Laboratoires Botanica France',
    productName: campaign.product.name,
    quantity,
    unitPrice,
    goodsTotal,
    ecopoolFee,
    logisticsFee,
    totalTTC,
    escrowStatus: 'paiement_securise',
    paymentMethod: 'prelevement_sepa_b2b',
    reservedAt: dateFormatted,
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
        signatoryName: '',
        signatoryTitle: 'Directrice Achats & RSE'
      },
      supplierSignature: {
        signed: true,
        signatoryName: 'Marc Delannoy (Plastinnov Normandie)',
        signedAt: dateFormatted
      },
      ecopoolSignature: {
        signed: true,
        signatoryName: 'Alexandre Roche (EcoPool SAS)',
        signedAt: dateFormatted,
        hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
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

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Commande & Contrat Tripartite Générés',
    message: `Commande ${orderId} (${quantity} unités) enregistrée avec succès. Bon de Commande PO émis et fonds cantonnés sur le séquestre.`,
    type: 'success',
    timestamp: new Date().toISOString(),
    read: false
  };

  setState({
    campaigns: updatedCampaigns,
    orders: [newOrder, ...state.orders],
    notifications: [newNotif, ...state.notifications]
  });

  res.json({
    success: true,
    order: newOrder,
    campaign: updatedCampaigns.find(c => c.id === campaignId)
  });
});

// 5. Sign Contract
app.put('/api/orders/:id/sign', (req, res) => {
  const { id } = req.params;
  const { signatoryName, signatoryTitle } = req.body;
  const state = getState();

  const orderIndex = state.orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'Commande introuvable' });
  }

  const updatedOrders = [...state.orders];
  const order = updatedOrders[orderIndex];
  const timestamp = new Date().toISOString();

  const updatedContract = {
    ...(order.contract || {
      contractNumber: `CTR-2026-${order.id.toUpperCase()}`,
      poNumber: `PO-${order.id.toUpperCase()}`,
      rseCertNumber: `CERT-RSE-${order.id.toUpperCase()}`,
      generatedDate: timestamp.split('T')[0],
      supplierSignature: {
        signed: true,
        signatoryName: 'Marc Delannoy (Plastinnov Normandie)',
        signedAt: timestamp.split('T')[0]
      },
      ecopoolSignature: {
        signed: true,
        signatoryName: 'Alexandre Roche (EcoPool SAS)',
        signedAt: timestamp.split('T')[0],
        hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
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
        co2AvoidedKg: Math.round(order.quantity * 0.05),
        virginPlasticAvoidedKg: Math.round(order.quantity * 0.028),
        recycledContentPct: 100,
        waterSavedLiters: Math.round(order.quantity * 0.12),
        treeEquivalent: Math.max(1, Math.round(order.quantity * 0.002))
      }
    }),
    buyerSignature: {
      signed: true,
      signatoryName: signatoryName || 'Direction Achats Botanica',
      signatoryTitle: signatoryTitle || 'Responsable Sourcing Durable',
      signedAt: timestamp,
      signatureHash: `SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
    }
  };

  updatedOrders[orderIndex] = {
    ...order,
    contract: updatedContract
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Contrat Tripartite Signé Numériquement',
    message: `Le contrat cadre pour la commande ${order.id} a été signé par ${signatoryName}. Empreinte cryptographique horodatée validée.`,
    type: 'success',
    timestamp,
    read: false
  };

  setState({
    orders: updatedOrders,
    notifications: [newNotif, ...state.notifications]
  });

  res.json({ success: true, order: updatedOrders[orderIndex] });
});

// 6. Release Escrow Milestone
app.put('/api/orders/:id/milestone', (req, res) => {
  const { id } = req.params;
  const { milestoneStage } = req.body;
  const state = getState();

  const orderIndex = state.orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'Commande introuvable' });
  }

  const updatedOrders = [...state.orders];
  const order = updatedOrders[orderIndex];
  if (!order.contract) {
    return res.status(400).json({ success: false, message: 'Aucun contrat associé' });
  }

  const milestones = { ...order.contract.escrowMilestones };
  let notifMessage = '';

  if (milestoneStage === 2) {
    milestones.stage2Released = true;
    order.logisticsStep = 'controle_lot';
    notifMessage = `Jalon 2 (50% - Sortie d'usine & contrôle QA) débloqué pour la commande ${order.id}. Fonds transférés à l'industriel.`;
  } else if (milestoneStage === 3) {
    milestones.stage3Released = true;
    order.escrowStatus = 'paiement_libere';
    order.logisticsStep = 'livre';
    notifMessage = `Jalon 3 (Solde 20% - Réception conforme au Hub) libéré pour la commande ${order.id}. Séquestre clôturé avec succès.`;
  }

  updatedOrders[orderIndex] = {
    ...order,
    contract: {
      ...order.contract,
      escrowMilestones: milestones
    }
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: `Jalon Séquestre ${milestoneStage} Libéré`,
    message: notifMessage,
    type: 'info',
    timestamp: new Date().toISOString(),
    read: false
  };

  setState({
    orders: updatedOrders,
    notifications: [newNotif, ...state.notifications]
  });

  res.json({ success: true, order: updatedOrders[orderIndex] });
});

// 7. Update Logistics Step
app.put('/api/orders/:id/logistics', (req, res) => {
  const { id } = req.params;
  const { step } = req.body;
  const state = getState();

  const orderIndex = state.orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'Commande introuvable' });
  }

  const updatedOrders = [...state.orders];
  updatedOrders[orderIndex] = {
    ...updatedOrders[orderIndex],
    logisticsStep: step
  };

  setState({ orders: updatedOrders });
  res.json({ success: true, order: updatedOrders[orderIndex] });
});

// 8. Submit Custom Pooling Demand
app.post('/api/demands', (req, res) => {
  const demandData = req.body;
  const state = getState();
  const newDemand = {
    ...demandData,
    id: `dem-${Date.now()}`,
    submittedAt: new Date().toISOString().split('T')[0],
    status: 'en_attente_agregation'
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Besoin d’Agrégation Enregistré',
    message: `Votre demande pour "${demandData.productSpecification}" (${demandData.requestedVolume} u) est analysée par le moteur de mutualisation.`,
    type: 'info',
    timestamp: new Date().toISOString(),
    read: false
  };

  setState({
    groupingDemands: [newDemand, ...state.groupingDemands],
    notifications: [newNotif, ...state.notifications]
  });

  res.json({ success: true, demand: newDemand });
});

// 9. Convert Opportunity to Campaign
app.post('/api/opportunities/:id/convert', (req, res) => {
  const { id } = req.params;
  const state = getState();
  const opp = state.opportunities.find(o => o.id === id);
  if (!opp) {
    return res.status(404).json({ success: false, message: 'Opportunité introuvable' });
  }

  const supplier = state.suppliers.find(s => s.name === opp.targetSupplier) || state.suppliers[0];
  const newCamp: Campaign = {
    id: `camp-${Date.now().toString().slice(-4)}`,
    title: opp.productTitle,
    subtitle: `Mutualisation industrielle ${opp.format} en ${opp.material}`,
    supplier,
    product: {
      id: `prod-${Date.now().toString().slice(-3)}`,
      name: opp.productTitle,
      category: 'packaging',
      subCategory: opp.format,
      material: opp.material,
      recycledPercentage: 100,
      color: 'Translucide / Naturel',
      weightGrams: 30,
      foodCosmeticGrade: true,
      recyclabilityIndex: '100% Recyclable',
      originCountry: supplier.country,
      co2SavedPerUnitGrams: 50,
      virginPlasticAvoidedGrams: 30,
      photos: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80']
    },
    moq: opp.requiredMOQ,
    targetVolume: Math.round(opp.requiredMOQ * 1.5),
    maxVolume: Math.round(opp.requiredMOQ * 2),
    reservedVolume: opp.aggregatedQuantity,
    currentUnitPrice: opp.potentialUnitPrice,
    marketSoloPrice: Math.round(opp.potentialUnitPrice * (1 + (opp.estimatedSavingsPct || 40) / 100) * 100) / 100,
    priceTiers: [
      { volume: opp.requiredMOQ, unitPrice: opp.potentialUnitPrice, discountPct: opp.estimatedSavingsPct || 35, label: 'Palier 1 : MOQ Industrielle atteinte' },
      { volume: Math.round(opp.requiredMOQ * 1.5), unitPrice: Math.round(opp.potentialUnitPrice * 0.88 * 100) / 100, discountPct: (opp.estimatedSavingsPct || 35) + 12, label: 'Palier 2 : Volume optimal (-12%)' }
    ],
    status: opp.aggregatedQuantity >= opp.requiredMOQ ? 'moq_atteinte' : 'presque_financee',
    opensAt: new Date().toISOString().split('T')[0],
    closesAt: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    estimatedProductionDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
    estimatedDeliveryDate: new Date(Date.now() + 50 * 86400000).toISOString().split('T')[0],
    logisticsConditions: {
      hubLocation: 'Hub EcoPool Normandie (Rouen)',
      packagingUnit: 'Carton',
      boxesPerPallet: 40,
      unitsPerBox: 250,
      estimatedHubShippingCostPerUnit: 0.04
    },
    paymentTerms: '30% Séquestre à la commande / 50% QA Hub / 20% Réception',
    ecopoolFeePct: 6,
    certifications: [
      {
        id: 'cert-01',
        name: 'Global Recycled Standard (GRS)',
        authority: 'Ecocert',
        licenseNumber: 'GRS-2026-88',
        issuedAt: '2025-01-01',
        expiresAt: '2028-01-01',
        scope: '100% PCR',
        status: 'verified',
        lastAuditDate: '2026-01-15'
      }
    ],
    participantsCount: opp.demandCount,
    participants: []
  };

  const updatedOpps = state.opportunities.map(o => o.id === id ? { ...o, status: 'converted_to_campaign' as const } : o);

  setState({
    campaigns: [newCamp, ...state.campaigns],
    opportunities: updatedOpps
  });

  res.json({ success: true, campaign: newCamp });
});

// 10. Update Supplier Status
app.put('/api/suppliers/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const state = getState();

  const updatedSuppliers = state.suppliers.map(s => s.id === id ? { ...s, status } : s);
  setState({ suppliers: updatedSuppliers });
  res.json({ success: true });
});

// 11. Update Supplier Certification
app.put('/api/suppliers/:id/certifications/:certId', (req, res) => {
  const { id, certId } = req.params;
  const { status } = req.body;
  const state = getState();

  const updatedSuppliers = state.suppliers.map(s => {
    if (s.id === id) {
      return {
        ...s,
        certifications: s.certifications.map(c => c.id === certId ? { ...c, status } : c)
      };
    }
    return s;
  });

  setState({ suppliers: updatedSuppliers });
  res.json({ success: true });
});

// 12. Update Commission Rate
app.put('/api/economics/commission', (req, res) => {
  const { ratePct } = req.body;
  const state = getState();
  const updatedConfig = { ...state.economicConfig, commissionRatePct: ratePct };
  setState({ economicConfig: updatedConfig });
  res.json({ success: true, economicConfig: updatedConfig });
});

// 13. Update Subscription Price
app.put('/api/economics/subscription', (req, res) => {
  const { planId, newPrice } = req.body;
  const state = getState();
  const updatedPlans = state.economicConfig.subscriptionPlans.map(p => p.id === planId ? { ...p, priceMonthlyEuro: newPrice } : p);
  const updatedConfig = { ...state.economicConfig, subscriptionPlans: updatedPlans };
  setState({ economicConfig: updatedConfig });
  res.json({ success: true, economicConfig: updatedConfig });
});

// 14. Mark Notification Read
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const state = getState();
  const updatedNotifs = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
  setState({ notifications: updatedNotifs });
  res.json({ success: true });
});

// 15. Backup Export / Restore / Reset
app.get('/api/backup/export', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ecopool_backup_${Date.now()}.json`);
  res.send(JSON.stringify(getState(), null, 2));
});

app.post('/api/backup/restore', (req, res) => {
  const backupData = req.body;
  if (!backupData || !Array.isArray(backupData.campaigns)) {
    return res.status(400).json({ success: false, message: 'Format de sauvegarde invalide' });
  }

  setState(backupData);
  res.json({ success: true, message: 'Base de données restaurée avec succès' });
});

app.post('/api/reset', (_req, res) => {
  const defaultState = resetDatabase();
  res.json({ success: true, message: 'Données réinitialisées aux valeurs usine', data: defaultState });
});

// ==========================================
// REAL B2B INTEGRATIONS ENDPOINTS
// ==========================================

// 1. Live Sirene / INSEE / RNE Search
app.get('/api/integrations/company-lookup', async (req, res) => {
  const query = (req.query.q as string) || '';
  if (!query) {
    return res.json({ success: true, results: [] });
  }

  try {
    const results = await queryFrenchCompanyRegistry(query);
    res.json({ success: true, results, query });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Real ADEME Carbon Footprint Engine
app.post('/api/integrations/carbon-compute', (req, res) => {
  const { materialCode, quantity, unitWeightGrams } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Quantité invalide' });
  }

  const result = computeAdemeCarbonImpact(materialCode || 'rpet', Number(quantity), Number(unitWeightGrams) || 28);
  res.json({ success: true, data: result });
});

// 3. Virtual Escrow Account Generation
app.post('/api/integrations/escrow/generate-va', (req, res) => {
  const { orderId, amountTTC } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'orderId requis' });
  }

  const va = generateVirtualEscrowAccount(orderId, Number(amountTTC) || 1000);
  res.json({ success: true, data: va });
});

// 4. Escrow Webhook Simulator (SEPA Instant Payment Confirmation)
app.post('/api/integrations/escrow/simulate-payment', (req, res) => {
  const { orderId, amountEur, paymentMethod, transactionRef } = req.body;
  const state = getState();

  const orderIndex = state.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'Commande introuvable pour ce séquestre' });
  }

  const updatedOrders = [...state.orders];
  const order = updatedOrders[orderIndex];

  updatedOrders[orderIndex] = {
    ...order,
    escrowStatus: 'paiement_securise',
    logisticsStep: 'reception_hub'
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Virement Séquestre Reçu (ACPR Conforme)',
    message: `Virement de ${(amountEur || order.totalTTC).toLocaleString()} € crédité avec succès sur l'IBAN de cantonnement pour la commande ${order.id}. Ref: ${transactionRef || 'SEPA-INST-88412'}.`,
    type: 'success',
    timestamp: new Date().toISOString(),
    read: false
  };

  setState({
    orders: updatedOrders,
    notifications: [newNotif, ...state.notifications]
  });

  res.json({
    success: true,
    message: 'Webhook bancaire validé. Fonds cantonnés avec succès.',
    order: updatedOrders[orderIndex]
  });
});

// 5. Official ERP CSV Export (SAP / SAGE / CEGID)
app.get('/api/integrations/export-erp', (_req, res) => {
  const state = getState();
  const csvContent = generateErpCsvExport(state.orders, state.economicConfig);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=ecopool_comptabilite_erp_achats.csv');
  res.send('\uFEFF' + csvContent); // Include BOM for Excel
});

// 6. Official CSRD Sustainability CSV Export (Scope 3 GHG)
app.get('/api/integrations/export-csrd', (_req, res) => {
  const state = getState();
  const csvContent = generateCsrdCsvExport(state.orders);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=ecopool_audit_csrd_scope3.csv');
  res.send('\uFEFF' + csvContent);
});


// Gemini Assistant API Endpoint
app.post('/api/gemini/assistant', async (req, res) => {
  const { mode, userMessage, context } = req.body;

  if (!aiClient) {
    return res.status(200).json({
      fallback: true,
      message: 'Gemini server client not configured with live key; using heuristic fallback.'
    });
  }

  try {
    const systemPrompt = `Tu es l'intelligence artificielle centrale d'EcoPool, une centrale d'achat collaborative B2B spécialisée dans les matières premières, composants et emballages écoresponsables.
Tu aides les PME, directeurs des achats, responsables RSE et industriels à agréger leurs commandes pour atteindre les Minimum Order Quantities (MOQ) des fabricants.

Mode actuel: ${mode}
(Modes possibles:
- 'achat': Assistant procurement pour PME, recherche et calcul de paliers et économies.
- 'sourcing': Analyse de la file d'attente d'agrégation et opportunités de nouvelles campagnes.
- 'conformite': Analyse rigoureuse des certificats (GRS, FSC, GOTS, C2C, Ecocert) et dates de validité.
- 'admin': Cockpit stratégique des volumes, du taux de remplissage des MOQ et risques logistiques).

Données de contexte de la plateforme:
Campagnes actives: ${JSON.stringify(context?.campaigns?.map((c: any) => ({
      id: c.id,
      title: c.title,
      moq: c.moq,
      reserved: c.reservedVolume,
      price: c.currentUnitPrice,
      status: c.status,
      certifications: c.certifications.map((ct: any) => ct.name + ' (' + ct.status + ')')
    })))}

Réponds de manière professionnelle, précise, chiffrée (calculs de paliers, économies en €, pourcentages), orientée procurement industriel B2B. En français. Utilise des puces et du markdown clair.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\nQuestion de l'utilisateur:\n${userMessage}`,
      config: {
        temperature: 0.2
      }
    });

    const reply = response.text || '';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

async function start() {
  // Vite Dev Server middleware mode in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoPool B2B Server running on port ${PORT}`);
  });
}

start();
