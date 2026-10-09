import crypto from 'crypto';
import { getState, setState } from './db';
import { sseBroker } from './sse';
import { SystemNotification } from '../types';

// ============================================================================
// PHASE 4 : HUB LOGISTIQUE CROSS-DOCKING 3-TIERS, TRAÇABILITÉ SSCC / GS1,
// PASSEPORT NUMÉRIQUE DES PRODUITS (DPP / ESPR) & BOURSE CIRCULAIRE DE RELIQUATS
// ============================================================================

export type HubLocation = 'HUB_NORMANDIE_LE_HAVRE' | 'HUB_SUD_FOS_SUR_MER';

export type LogisticsParcelStatus = 
  | 'USINE_EN_PRODUCTION'
  | 'EXPEDIE_USINE_VERS_HUB'
  | 'RECEPTIONNE_AU_HUB'
  | 'CONTROLE_QUALITE_CONFORME'
  | 'CONTROLE_QUALITE_RESERVE'
  | 'CROSS_DOCKING_ECLATEMENT'
  | 'REEXPEDIE_VERS_ACHETEUR'
  | 'EN_COURS_DE_LIVRAISON'
  | 'LIVRE_EMARGE';

export interface QaInspectionReport {
  inspectionId: string;
  inspectorName: string;
  inspectedAt: string;
  hubLocation: HubLocation;
  spectrometryTest: {
    materialConfirmed: string;
    pcrPurityPct: number;
    passed: boolean;
    spectralHash: string;
  };
  dimensionToleranceTest: {
    neckSpecification: string; // e.g. "24/410"
    measuredDeviationMm: number; // e.g. 0.04
    toleranceMaxMm: number; // 0.10
    passed: boolean;
  };
  vacuumSealTest: {
    pressureMbar: number; // 500
    durationSeconds: number; // 60
    leakageDetected: boolean;
    passed: boolean;
  };
  visualInspection: {
    defectsCountPer1000: number;
    colorConformity: boolean;
    passed: boolean;
  };
  overallPassed: boolean;
  complianceSealSha256: string;
  notes: string;
}

export interface HubLogisticsParcel {
  id: string;
  orderId: string;
  campaignId: string;
  buyerName: string;
  buyerCity: string;
  ssccBarcode: string; // 18 digits GS1-128
  gtin: string; // 14 digits
  batchNumber: string;
  productName: string;
  unitsCount: number;
  grossWeightKg: number;
  carrierName: string;
  trackingNumber: string;
  status: LogisticsParcelStatus;
  hubLocation: HubLocation;
  originFactory: string;
  cmrNumber?: string;
  departureDate?: string;
  hubArrivalDate?: string;
  dispatchDate?: string;
  deliveredDate?: string;
  qaReport?: QaInspectionReport;
}

export interface DigitalProductPassport {
  dppId: string;
  orderId: string;
  gtin: string;
  batchNumber: string;
  gs1DigitalLinkUrl: string;
  esprConformityLevel: 'EU_ESPR_2026_COMPLIANT';
  productIdentification: {
    commercialName: string;
    category: string;
    subCategory: string;
    unitFormat: string;
    manufacturer: string;
    manufacturingCountry: string;
    manufacturingPlant: string;
  };
  materialComposition: {
    primaryResin: string;
    recycledContentPct: number;
    recycledType: 'PCR_POST_CONSUMER' | 'PIR_POST_INDUSTRIAL';
    certifications: string[]; // e.g. ['GRS 4.0', 'EU Ecolabel', 'FSC Mix']
    nonToxicInksGluesCertified: boolean;
    foodGradeCompliant: boolean;
  };
  circularityMetrics: {
    citeoRecyclabilityScore: 'CLASSE_A_EXCELLENTE' | 'CLASSE_B_BONNE' | 'CLASSE_C_MOYENNE';
    recyclingStream: string; // e.g. "Filière Bouteilles & Flacons PE/PP/PET"
    reusePotentialCycles: number;
    recycledResinSourcingOrigin: string; // e.g. "Normandie / France (Rayon 150km)"
  };
  lifeCycleAssessment: {
    lcaStandard: 'ISO 14044 / PEF 3.0';
    carbonPerUnitGramsCO2e: number;
    avoidedCarbonPerUnitGramsCO2e: number;
    waterConsumptionPerUnitLiters: number;
    ademeEmissionFactorRef: string;
  };
  cryptographicVerification: {
    sealedAt: string;
    merkleRootHash: string;
    digitalSignature: string;
    auditorAuthority: string;
  };
}

export interface CircularSurplusListing {
  id: string;
  campaignId: string;
  sellerCompanyName: string;
  sellerSiren: string;
  productName: string;
  materialType: string;
  availableQuantity: number;
  originalUnitPriceEur: number;
  discountedUnitPriceEur: number;
  savingDiscountPct: number;
  minimumPurchaseQuantity: number;
  locationHub: HubLocation;
  batchNumber: string;
  certifications: string[];
  status: 'DISPONIBLE' | 'RESERVE' | 'VENDU' | 'REINTEGRE_PRODUCTION';
  createdAt: string;
}

// ============================================================================
// IN-MEMORY STORAGE & INITIALIZATION
// ============================================================================

let hubParcelsStore: HubLogisticsParcel[] = [];
let dppStore: Record<string, DigitalProductPassport> = {};
let circularSurplusStore: CircularSurplusListing[] = [];

// Helper to calculate GS1 SSCC (18 digits with mod 10 check digit)
export function generateSSCC(counter: number): string {
  // Application Identifier (00) + Extension digit (0) + GS1 Company Prefix (3701234) + Serial reference (9 digits) + Check digit
  const prefix = `03701234${counter.toString().padStart(9, '0')}`;
  // Modulo 10 GS1 algorithm
  let sum = 0;
  for (let i = 0; i < prefix.length; i++) {
    const digit = parseInt(prefix[i], 10);
    sum += (i % 2 === 0) ? digit * 3 : digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `(00)${prefix}${checkDigit}`;
}

export function initPhase4Data() {
  if (hubParcelsStore.length > 0) return;

  const state = getState();
  const sampleOrders = state.orders || [];

  // Generate Parcels for current orders
  sampleOrders.forEach((ord, idx) => {
    const sscc = generateSSCC(idx + 1042);
    const gtin = `370123456${(idx + 100).toString().padStart(5, '0')}`;
    const batch = `LOT-2026-N${(idx + 1).toString().padStart(3, '0')}`;
    const grossWeight = Math.round((ord.quantity * 0.035) + 12); // kg

    const parcel: HubLogisticsParcel = {
      id: `pcl-${ord.id}`,
      orderId: ord.id,
      campaignId: ord.campaignId,
      buyerName: ord.companyName || 'Laboratoires Botanica France SAS',
      buyerCity: ord.buyerId === 'buyer-2' ? 'Bordeaux' : ord.buyerId === 'buyer-3' ? 'Lyon' : 'Rouen',
      ssccBarcode: sscc,
      gtin,
      batchNumber: batch,
      productName: ord.productName || 'Flacon 250ml PEHD 100% PCR',
      unitsCount: ord.quantity,
      grossWeightKg: grossWeight,
      carrierName: idx % 2 === 0 ? 'Geodis Logistique Distribution' : 'Kuehne + Nagel FTL/LTL',
      trackingNumber: `ECO-FR-${Date.now().toString().slice(-6)}-${idx + 1}`,
      status: idx === 0 
        ? 'CONTROLE_QUALITE_CONFORME' 
        : idx === 1 
          ? 'CROSS_DOCKING_ECLATEMENT' 
          : 'EXPEDIE_USINE_VERS_HUB',
      hubLocation: idx % 2 === 0 ? 'HUB_NORMANDIE_LE_HAVRE' : 'HUB_SUD_FOS_SUR_MER',
      originFactory: 'Plastinnov Normandie SAS (Site Dieppe)',
      cmrNumber: `CMR-FR-2026-${(idx + 884).toString()}`,
      departureDate: '2026-03-01',
      hubArrivalDate: '2026-03-03',
      qaReport: {
        inspectionId: `QA-INSP-${ord.id.toUpperCase()}`,
        inspectorName: 'Laurent Vasseur (Directeur QA Hub)',
        inspectedAt: '2026-03-03T14:30:00Z',
        hubLocation: 'HUB_NORMANDIE_LE_HAVRE',
        spectrometryTest: {
          materialConfirmed: 'PEHD 100% PCR Post-Consommation Certifié',
          pcrPurityPct: 99.4,
          passed: true,
          spectralHash: crypto.createHash('sha256').update(`SPECTRO-${ord.id}`).digest('hex')
        },
        dimensionToleranceTest: {
          neckSpecification: 'Col 24/410 standardisé DIN 168',
          measuredDeviationMm: 0.03,
          toleranceMaxMm: 0.10,
          passed: true
        },
        vacuumSealTest: {
          pressureMbar: 500,
          durationSeconds: 60,
          leakageDetected: false,
          passed: true
        },
        visualInspection: {
          defectsCountPer1000: 1,
          colorConformity: true,
          passed: true
        },
        overallPassed: true,
        complianceSealSha256: crypto.createHash('sha256').update(`SEAL-${ord.id}-QA`).digest('hex'),
        notes: 'Lot 100% conforme au cahier des charges cosmétique. Déblocage pour réexpédition validé.'
      }
    };

    hubParcelsStore.push(parcel);

    // Create Digital Product Passport
    const dpp: DigitalProductPassport = {
      dppId: `DPP-2026-${ord.id.toUpperCase()}`,
      orderId: ord.id,
      gtin,
      batchNumber: batch,
      gs1DigitalLinkUrl: `https://dpp.ecopool.eu/id/01/${gtin}/21/${batch}`,
      esprConformityLevel: 'EU_ESPR_2026_COMPLIANT',
      productIdentification: {
        commercialName: parcel.productName,
        category: 'Emballage Primaire Cosmétique & Soin',
        subCategory: 'Flaconnages PCR Circulaires',
        unitFormat: '250 ml standard',
        manufacturer: 'Plastinnov Normandie SAS',
        manufacturingCountry: 'France',
        manufacturingPlant: 'Unité Dieppe (Normandie)'
      },
      materialComposition: {
        primaryResin: 'PEHD PCR (Polyéthylène Haute Densité Recyclé)',
        recycledContentPct: 100,
        recycledType: 'PCR_POST_CONSUMER',
        certifications: ['GRS 4.0 (Global Recycled Standard)', 'EU Ecolabel FR/043/01', 'ISO 14001'],
        nonToxicInksGluesCertified: true,
        foodGradeCompliant: true
      },
      circularityMetrics: {
        citeoRecyclabilityScore: 'CLASSE_A_EXCELLENTE',
        recyclingStream: 'Filière Bouteilles & Flacons Rigides (100% Recyclable)',
        reusePotentialCycles: 8,
        recycledResinSourcingOrigin: 'Normandie / France (Collecte sélective locale - Rayon 120km)'
      },
      lifeCycleAssessment: {
        lcaStandard: 'ISO 14044 / PEF 3.0',
        carbonPerUnitGramsCO2e: 42,
        avoidedCarbonPerUnitGramsCO2e: 68,
        waterConsumptionPerUnitLiters: 0.14,
        ademeEmissionFactorRef: 'ADEME-BE-MAT-2024-PLAST-PEHD-PCR'
      },
      cryptographicVerification: {
        sealedAt: new Date().toISOString(),
        merkleRootHash: crypto.createHash('sha256').update(`MERKLE-${dppIdGenerator(ord.id)}`).digest('hex'),
        digitalSignature: `SIG-ESPR-EU-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        auditorAuthority: 'EcoPool Lead Quality & Bureau Veritas Audité'
      }
    };

    dppStore[ord.id] = dpp;
  });

  // Circular Surplus Listings
  circularSurplusStore = [
    {
      id: 'surplus-01',
      campaignId: 'camp-1',
      sellerCompanyName: 'Laboratoires Botanica France SAS',
      sellerSiren: '428843130',
      productName: 'Flacons 250ml PEHD 100% PCR (Col 24/410)',
      materialType: 'PEHD 100% PCR',
      availableQuantity: 3500,
      originalUnitPriceEur: 0.82,
      discountedUnitPriceEur: 0.59,
      savingDiscountPct: 28,
      minimumPurchaseQuantity: 500,
      locationHub: 'HUB_NORMANDIE_LE_HAVRE',
      batchNumber: 'LOT-2026-N001-SURPLUS',
      certifications: ['GRS 4.0', 'EU Ecolabel'],
      status: 'DISPONIBLE',
      createdAt: '2026-03-02T10:15:00Z'
    },
    {
      id: 'surplus-02',
      campaignId: 'camp-2',
      sellerCompanyName: 'Cosmétiques Océane & Mer',
      sellerSiren: '512984120',
      productName: 'Pots Cosmétiques Verre 85% Recyclé 50ml',
      materialType: 'Verre Flotté Recyclé',
      availableQuantity: 1800,
      originalUnitPriceEur: 0.98,
      discountedUnitPriceEur: 0.68,
      savingDiscountPct: 30.6,
      minimumPurchaseQuantity: 300,
      locationHub: 'HUB_SUD_FOS_SUR_MER',
      batchNumber: 'LOT-2026-S014-SURPLUS',
      certifications: ['Cradle to Cradle Silver', 'CEN/TS 16869'],
      status: 'DISPONIBLE',
      createdAt: '2026-03-03T09:40:00Z'
    },
    {
      id: 'surplus-03',
      campaignId: 'camp-3',
      sellerCompanyName: 'BioProvence Laboratoire',
      sellerSiren: '394812750',
      productName: 'Flacons 500ml RPET Cristal 100% Recyclé',
      materialType: 'RPET 100% PCR',
      availableQuantity: 2400,
      originalUnitPriceEur: 1.15,
      discountedUnitPriceEur: 0.79,
      savingDiscountPct: 31.3,
      minimumPurchaseQuantity: 600,
      locationHub: 'HUB_NORMANDIE_LE_HAVRE',
      batchNumber: 'LOT-2026-N089-SURPLUS',
      certifications: ['GRS 4.0', 'EFSA Food Grade'],
      status: 'DISPONIBLE',
      createdAt: '2026-03-04T11:20:00Z'
    }
  ];
}

function dppIdGenerator(orderId: string) {
  return `DPP-${orderId}-${Date.now().toString(16)}`;
}

// Initial call
initPhase4Data();

// ============================================================================
// SERVICE METHODS
// ============================================================================

export function getHubParcels(): HubLogisticsParcel[] {
  initPhase4Data();
  return hubParcelsStore;
}

export function getParcelById(parcelId: string): HubLogisticsParcel | undefined {
  initPhase4Data();
  return hubParcelsStore.find(p => p.id === parcelId || p.orderId === parcelId);
}

export function performHubQualityInspection(
  orderId: string, 
  inspectorName: string = 'Laurent Vasseur (Directeur QA Hub)',
  notes: string = 'Contrôle qualité 4-points complet validé au Hub.'
): { success: boolean; qaReport: QaInspectionReport; parcel: HubLogisticsParcel } {
  initPhase4Data();
  const parcel = hubParcelsStore.find(p => p.orderId === orderId || p.id === orderId);
  if (!parcel) {
    throw new Error(`Colis/Commande #${orderId} introuvable pour inspection QA`);
  }

  const sealHash = crypto.createHash('sha256').update(`QA-${orderId}-${Date.now()}`).digest('hex');

  const qaReport: QaInspectionReport = {
    inspectionId: `QA-INSP-${orderId.toUpperCase()}-${Date.now().toString(16)}`,
    inspectorName,
    inspectedAt: new Date().toISOString(),
    hubLocation: parcel.hubLocation,
    spectrometryTest: {
      materialConfirmed: 'PEHD 100% PCR Post-Consommation Certifié GRS',
      pcrPurityPct: 99.6,
      passed: true,
      spectralHash: crypto.createHash('sha256').update(`SPECTRO-${orderId}`).digest('hex')
    },
    dimensionToleranceTest: {
      neckSpecification: 'Col standardisé 24/410 DIN 168',
      measuredDeviationMm: 0.02,
      toleranceMaxMm: 0.10,
      passed: true
    },
    vacuumSealTest: {
      pressureMbar: 500,
      durationSeconds: 60,
      leakageDetected: false,
      passed: true
    },
    visualInspection: {
      defectsCountPer1000: 0,
      colorConformity: true,
      passed: true
    },
    overallPassed: true,
    complianceSealSha256: sealHash,
    notes
  };

  parcel.qaReport = qaReport;
  parcel.status = 'CONTROLE_QUALITE_CONFORME';

  // Also update global DB order state
  const state = getState();
  const ordIndex = state.orders.findIndex(o => o.id === parcel.orderId);
  if (ordIndex !== -1) {
    const updated = [...state.orders];
    updated[ordIndex].logisticsStep = 'controle_lot';
    setState({ orders: updated });
  }

  // Real-time broadcast
  sseBroker.broadcast('HUB_QA_INSPECTION_COMPLETED', {
    orderId: parcel.orderId,
    ssccBarcode: parcel.ssccBarcode,
    overallPassed: true,
    sealHash,
    inspectedAt: qaReport.inspectedAt
  });

  return { success: true, qaReport, parcel };
}

export function dispatchCmrAndReexpedite(
  orderId: string, 
  carrierName: string = 'Geodis Distribution Rapide B2B'
): { success: boolean; parcel: HubLogisticsParcel; cmrDocument: any } {
  initPhase4Data();
  const parcel = hubParcelsStore.find(p => p.orderId === orderId || p.id === orderId);
  if (!parcel) {
    throw new Error(`Colis/Commande #${orderId} introuvable pour expédition`);
  }

  const cmrNumber = `eCMR-FR-2026-${Date.now().toString().slice(-6)}`;
  parcel.carrierName = carrierName;
  parcel.cmrNumber = cmrNumber;
  parcel.status = 'CROSS_DOCKING_ECLATEMENT';
  parcel.dispatchDate = new Date().toISOString().split('T')[0];

  const cmrDocument = {
    cmrNumber,
    consignor: parcel.hubLocation === 'HUB_NORMANDIE_LE_HAVRE' 
      ? 'Plateforme Centrale EcoPool Le Havre (Quai 14, 76600 Le Havre)' 
      : 'Plateforme EcoPool Méditerranée (Fos Distriport, 13270 Fos-sur-Mer)',
    consignee: `${parcel.buyerName} - Service Réception (${parcel.buyerCity})`,
    carrier: carrierName,
    carrierSiret: '44218204200021',
    packagesCount: Math.ceil(parcel.unitsCount / 500),
    grossWeightKg: parcel.grossWeightKg,
    goodsDescription: `${parcel.productName} (Code SSCC: ${parcel.ssccBarcode})`,
    unConventionCompliant: true,
    electronicSignatureTimestamp: new Date().toISOString()
  };

  // Update order in state
  const state = getState();
  const ordIndex = state.orders.findIndex(o => o.id === parcel.orderId);
  if (ordIndex !== -1) {
    const updated = [...state.orders];
    updated[ordIndex].logisticsStep = 'expedie';
    setState({ orders: updated });
  }

  // Real-time broadcast
  sseBroker.broadcast('CMR_DISPATCHED', {
    orderId: parcel.orderId,
    cmrNumber,
    ssccBarcode: parcel.ssccBarcode,
    carrierName,
    status: parcel.status
  });

  return { success: true, parcel, cmrDocument };
}

export function updateParcelTrackingStep(
  orderId: string,
  newStatus: LogisticsParcelStatus
): HubLogisticsParcel {
  initPhase4Data();
  const parcel = hubParcelsStore.find(p => p.orderId === orderId || p.id === orderId);
  if (!parcel) {
    throw new Error(`Colis #${orderId} introuvable`);
  }

  parcel.status = newStatus;
  if (newStatus === 'LIVRE_EMARGE') {
    parcel.deliveredDate = new Date().toISOString();
  }

  sseBroker.broadcast('LOGISTICS_STATUS_CHANGED', {
    orderId: parcel.orderId,
    ssccBarcode: parcel.ssccBarcode,
    newStatus,
    timestamp: new Date().toISOString()
  });

  return parcel;
}

// Digital Product Passport methods
export function getDigitalProductPassport(orderId: string): DigitalProductPassport {
  initPhase4Data();
  if (dppStore[orderId]) {
    return dppStore[orderId];
  }

  // If not exist, generate on the fly
  const state = getState();
  const order = state.orders.find(o => o.id === orderId) || state.orders[0];
  const gtin = `370123456000${order ? order.id.slice(-2) : '99'}`;
  const batch = `LOT-2026-N${Date.now().toString().slice(-3)}`;

  const newDpp: DigitalProductPassport = {
    dppId: `DPP-2026-${orderId.toUpperCase()}`,
    orderId,
    gtin,
    batchNumber: batch,
    gs1DigitalLinkUrl: `https://dpp.ecopool.eu/id/01/${gtin}/21/${batch}`,
    esprConformityLevel: 'EU_ESPR_2026_COMPLIANT',
    productIdentification: {
      commercialName: order?.productName || 'Flacon Plastique Éco-Responsable',
      category: 'Emballage Cosmétique Circulaire',
      subCategory: 'Flacons & Pots PCR',
      unitFormat: 'Standard 250ml',
      manufacturer: 'Plastinnov Normandie SAS',
      manufacturingCountry: 'France',
      manufacturingPlant: 'Dieppe Production'
    },
    materialComposition: {
      primaryResin: 'PEHD 100% PCR Post-Consommation',
      recycledContentPct: 100,
      recycledType: 'PCR_POST_CONSUMER',
      certifications: ['GRS 4.0', 'EU Ecolabel'],
      nonToxicInksGluesCertified: true,
      foodGradeCompliant: true
    },
    circularityMetrics: {
      citeoRecyclabilityScore: 'CLASSE_A_EXCELLENTE',
      recyclingStream: 'Filière Bouteilles & Flacons PE/PP',
      reusePotentialCycles: 10,
      recycledResinSourcingOrigin: 'Collecte territoriale Normandie (France)'
    },
    lifeCycleAssessment: {
      lcaStandard: 'ISO 14044 / PEF 3.0',
      carbonPerUnitGramsCO2e: 45,
      avoidedCarbonPerUnitGramsCO2e: 72,
      waterConsumptionPerUnitLiters: 0.16,
      ademeEmissionFactorRef: 'ADEME-BE-MAT-2024-PLAST-PEHD-PCR'
    },
    cryptographicVerification: {
      sealedAt: new Date().toISOString(),
      merkleRootHash: crypto.createHash('sha256').update(`GEN-${orderId}`).digest('hex'),
      digitalSignature: `SIG-ESPR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      auditorAuthority: 'EcoPool Lead Quality & Bureau Veritas'
    }
  };

  dppStore[orderId] = newDpp;
  return newDpp;
}

export function sealDigitalProductPassport(orderId: string): DigitalProductPassport {
  const dpp = getDigitalProductPassport(orderId);
  dpp.cryptographicVerification.sealedAt = new Date().toISOString();
  dpp.cryptographicVerification.merkleRootHash = crypto.createHash('sha256').update(JSON.stringify(dpp.materialComposition)).digest('hex');
  dpp.cryptographicVerification.digitalSignature = `CERT-ESPR-SEALED-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  sseBroker.broadcast('DPP_PASSPORT_SEALED', {
    orderId,
    dppId: dpp.dppId,
    gtin: dpp.gtin,
    gs1DigitalLinkUrl: dpp.gs1DigitalLinkUrl,
    sealedAt: dpp.cryptographicVerification.sealedAt,
    merkleRootHash: dpp.cryptographicVerification.merkleRootHash
  });

  return dpp;
}

// Circular Secondary Market
export function getCircularSurplusListings(): CircularSurplusListing[] {
  initPhase4Data();
  return circularSurplusStore;
}

export function postCircularSurplusListing(listingData: Omit<CircularSurplusListing, 'id' | 'status' | 'createdAt'>): CircularSurplusListing {
  initPhase4Data();
  const newListing: CircularSurplusListing = {
    ...listingData,
    id: `surplus-${Date.now()}`,
    status: 'DISPONIBLE',
    createdAt: new Date().toISOString()
  };

  circularSurplusStore.unshift(newListing);

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Nouveau Reliquat Circulaire Déposé',
    message: `${listingData.availableQuantity} unités de ${listingData.productName} disponibles à -${listingData.savingDiscountPct}% au ${listingData.locationHub}.`,
    type: 'info',
    timestamp: new Date().toISOString(),
    read: false
  };

  const state = getState();
  setState({ notifications: [newNotif, ...state.notifications] });

  sseBroker.broadcast('CIRCULAR_SURPLUS_MATCHED', {
    listingId: newListing.id,
    productName: newListing.productName,
    availableQuantity: newListing.availableQuantity,
    discountedPrice: newListing.discountedUnitPriceEur
  });

  return newListing;
}

export function buyCircularSurplus(
  listingId: string, 
  buyerCompanyName: string = 'Laboratoires Botanica France SAS',
  quantity: number = 1000
): { success: boolean; listing: CircularSurplusListing; transactionProof: string; amountEur: number } {
  initPhase4Data();
  const listing = circularSurplusStore.find(l => l.id === listingId);
  if (!listing) {
    throw new Error(`Offre de reliquat #${listingId} introuvable`);
  }

  if (listing.status !== 'DISPONIBLE') {
    throw new Error(`Ce reliquat n'est plus disponible (Statut: ${listing.status})`);
  }

  const effectiveQty = Math.min(quantity, listing.availableQuantity);
  const totalAmount = parseFloat((effectiveQty * listing.discountedUnitPriceEur).toFixed(2));
  
  if (effectiveQty >= listing.availableQuantity) {
    listing.status = 'VENDU';
    listing.availableQuantity = 0;
  } else {
    listing.availableQuantity -= effectiveQty;
  }

  const proof = `SHA256:CIRCULAR-TX-${crypto.createHash('sha256').update(`${listingId}-${buyerCompanyName}-${Date.now()}`).digest('hex')}`;

  const notif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Rachat de Reliquat Circulaire Effectué',
    message: `Achat de ${effectiveQty} unités de ${listing.productName} pour ${buyerCompanyName}. Séquestre alloué avec économie de ${listing.savingDiscountPct}%.`,
    type: 'success',
    timestamp: new Date().toISOString(),
    read: false
  };

  const state = getState();
  setState({ notifications: [notif, ...state.notifications] });

  return {
    success: true,
    listing,
    transactionProof: proof,
    amountEur: totalAmount
  };
}

// Logistics Optimization & Aggregated Carbon Savings
export function computeHubCarbonSavings(): {
  totalMassifiedParcelsCount: number;
  totalUnitsMassified: number;
  individualLtlKm: number;
  massifiedFtlKm: number;
  kmSaved: number;
  co2AvoidedTransportKg: number;
  transportOptimizationPct: number;
} {
  initPhase4Data();
  const totalUnits = hubParcelsStore.reduce((acc, p) => acc + p.unitsCount, 0);
  const parcelsCount = hubParcelsStore.length;

  // Simulation: Individual fragmented LTL = 680 km per buyer on small vans (0.28 kg CO2e / km)
  // Massified FTL Hub = 1 heavy truck 38t (0.82 kg CO2e / km) for whole batch + short last mile (85 km)
  const individualLtlKm = parcelsCount * 720;
  const massifiedFtlKm = 340 + (parcelsCount * 85);
  const kmSaved = Math.max(0, individualLtlKm - massifiedFtlKm);
  const individualCo2 = individualLtlKm * 0.28;
  const massifiedCo2 = (340 * 0.82) + (parcelsCount * 85 * 0.18);
  const co2Avoided = Math.max(0, Math.round(individualCo2 - massifiedCo2));

  return {
    totalMassifiedParcelsCount: parcelsCount,
    totalUnitsMassified: totalUnits,
    individualLtlKm,
    massifiedFtlKm,
    kmSaved,
    co2AvoidedTransportKg: co2Avoided,
    transportOptimizationPct: 62.4
  };
}
