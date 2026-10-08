export type UserRole = 'buyer' | 'supplier' | 'admin';

export type ICPSector = 
  | 'cosmetique_naturelle'
  | 'mode_ethique'
  | 'dnvb'
  | 'restauration_traiteur'
  | 'industriel_regional';

export type CampaignStatus =
  | 'brouillon'
  | 'preparation'
  | 'ouverte'
  | 'presque_financee'
  | 'moq_atteinte'
  | 'objectif_atteint'
  | 'cloturee'
  | 'commande_confirmee'
  | 'production'
  | 'controle_qualite'
  | 'expedition_hub'
  | 'repartition'
  | 'livree'
  | 'terminee'
  | 'annulee';

export type CertificationStatus = 'verified' | 'pending' | 'expired' | 'insufficient_data';

export interface Certification {
  id: string;
  name: string; // FSC, GOTS, Global Recycled Standard (GRS), EU Ecolabel, Ecocert, Cradle to Cradle
  authority: string;
  licenseNumber: string;
  issuedAt: string;
  expiresAt: string;
  scope: string;
  documentUrl?: string;
  status: CertificationStatus;
  lastAuditDate: string;
}

export type SupplierStatus = 'non_verifie' | 'en_verification' | 'verifie' | 'suspendu';

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  country: string;
  city: string;
  factoryLocation: string;
  siren: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  status: SupplierStatus;
  certifications: Certification[];
  leadTimeWeeks: number;
  paymentTerms: string;
  logisticsConditions: string;
  rating: number;
  totalPoolsCompleted: number;
  verifiedAt?: string;
  notes?: string;
}

export interface BuyerProfile {
  id: string;
  companyName: string;
  siren: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  sector: ICPSector;
  website: string;
  companySize: '1-10' | '11-50' | '51-250' | '250+';
  annualPurchasingVolume: string;
  targetMaterials: string[];
  requiredCertifications: string[];
  targetBudgetPerUnit?: number;
  deliveryAddress: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  billingAddress: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  isVerified: boolean;
}

export interface PriceTier {
  volume: number;
  unitPrice: number;
  discountPct: number;
  label?: string;
}

export interface ProductSpec {
  id: string;
  name: string;
  category: 'packaging' | 'textile' | 'composants' | 'restauration';
  subCategory: string; // e.g. 'flacons', 'pots', 'tubes', 'cartons'
  material: string; // e.g. 'HDPE 100% Recyclé Post-Consommation (PCR)'
  recycledPercentage: number;
  capacity?: string; // '250 ml', '500 ml'
  neckFinish?: string; // '24/410'
  color: string;
  weightGrams?: number;
  foodCosmeticGrade: boolean;
  recyclabilityIndex: string; // e.g. '100% Recyclable (Code 2)'
  originCountry: string;
  co2SavedPerUnitGrams: number;
  virginPlasticAvoidedGrams: number;
  photos: string[];
  technicalDataSheetUrl?: string;
}

export interface CampaignParticipant {
  id: string;
  buyerId: string;
  buyerName: string;
  companyName: string;
  sector: ICPSector;
  quantity: number;
  unitPricePaid: number;
  totalAmount: number;
  reservedAt: string;
  escrowStatus: 'pending' | 'authorized' | 'secured_in_escrow' | 'released_to_supplier' | 'refunded';
  deliveryStatus: 'en_attente' | 'production' | 'au_hub' | 'en_acheminement' | 'livre';
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  product: ProductSpec;
  supplier: Supplier;
  moq: number; // Volume minimum industriel imposé
  targetVolume: number; // Volume cible
  maxVolume: number; // Capacité max de l'usine
  reservedVolume: number;
  participantsCount: number;
  currentUnitPrice: number;
  marketSoloPrice: number; // Prix moyen pour une commande unitaire petite PME (sans EcoPool)
  priceTiers: PriceTier[];
  certifications: Certification[];
  status: CampaignStatus;
  opensAt: string;
  closesAt: string;
  estimatedProductionDate: string;
  estimatedDeliveryDate: string;
  logisticsConditions: {
    hubLocation: string;
    packagingUnit: string;
    boxesPerPallet: number;
    unitsPerBox: number;
    estimatedHubShippingCostPerUnit: number;
  };
  paymentTerms: string;
  ecopoolFeePct: number; // 5-8%
  participants: CampaignParticipant[];
  featured?: boolean;
}

export interface GroupingDemand {
  id: string;
  buyerId: string;
  companyName: string;
  sector: ICPSector;
  productCategory: string;
  format: string;
  material: string;
  desiredQuantity: number;
  maxBudgetUnit: number;
  requiredCertifications: string[];
  submittedAt: string;
  status: 'pending' | 'matched' | 'pooled';
}

export interface AggregationOpportunity {
  id: string;
  productTitle: string;
  category: string;
  format: string;
  material: string;
  aggregatedQuantity: number;
  requiredMOQ: number;
  targetSupplier: string;
  demandCount: number;
  compatibleDemands: GroupingDemand[];
  status: 'moq_reached_ready' | 'gathering' | 'converted_to_campaign';
  potentialUnitPrice: number;
  estimatedSavingsPct: number;
}

export type EscrowStatus = 
  | 'paiement_en_attente'
  | 'autorisation'
  | 'paiement_securise'
  | 'paiement_libere'
  | 'remboursement'
  | 'bloque_litige'
  | 'echec';

export interface TripartiteContract {
  contractNumber: string;
  poNumber: string;
  rseCertNumber: string;
  generatedDate: string;
  buyerSignature: {
    signed: boolean;
    signatoryName: string;
    signatoryTitle: string;
    signedAt?: string;
    hashSha256?: string;
  };
  ecopoolSignature: {
    signed: boolean;
    signatoryName: string;
    signedAt?: string;
    hashSha256: string;
  };
  supplierSignature: {
    signed: boolean;
    signatoryName: string;
    signedAt?: string;
  };
  escrowMilestones: {
    stage1Pct: number; // 30% Engagement Matière
    stage1Released: boolean;
    stage2Pct: number; // 50% Réception & Contrôle Hub
    stage2Released: boolean;
    stage3Pct: number; // 20% Réception Finale Acheteur
    stage3Released: boolean;
  };
  carbonMetrics: {
    co2AvoidedKg: number;
    virginPlasticAvoidedKg: number;
    recycledContentPct: number;
    waterSavedLiters: number;
    treeEquivalent: number;
  };
}

export interface OrderReservation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  buyerId: string;
  companyName: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  goodsTotal: number;
  ecopoolFee: number;
  logisticsFee: number;
  totalTTC: number;
  escrowStatus: EscrowStatus;
  paymentMethod: 'prelevement_sepa_b2b' | 'virement_escrow' | 'carte_b2b';
  reservedAt: string;
  hubTrackingNumber?: string;
  finalTrackingNumber?: string;
  logisticsStep: 'reception_hub' | 'controle_lot' | 'repartition' | 'expedie' | 'livre';
  contract?: TripartiteContract;
  notes?: string;
}

export interface HubInventoryItem {
  id: string;
  campaignId: string;
  productName: string;
  supplierName: string;
  batchNumber: string;
  totalReceivedUnits: number;
  inspectedUnits: number;
  qaPassRatePct: number;
  storageZone: string;
  receivedDate: string;
  dispatchStatus: 'en_attente_qa' | 'conforme_en_repartition' | 'expeditions_en_cours' | 'cloture';
}

export interface PlatformEconomicConfig {
  commissionRatePct: number; // e.g. 6.5
  subscriptionPlans: {
    id: string;
    name: string;
    monthlyPriceEuro: number;
    description: string;
    features: string[];
  }[];
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  matchedCampaignIds?: string[];
  actionRecommendation?: {
    type: 'view_campaign' | 'join_campaign' | 'create_pool' | 'audit_cert';
    targetId: string;
    label: string;
  };
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  read: boolean;
  link?: string;
}

export type RiskSeverity = 'faible' | 'moderee' | 'critique' | 'bloquante';
export type IncidentStatus = 'signale' | 'investigation_hub' | 'arbitrage_ecopool' | 'avoir_indemnise' | 'resolu_clos';

export interface RiskIncident {
  id: string;
  campaignId: string;
  campaignTitle: string;
  category: 'retard_fournisseur' | 'non_conformite_qa' | 'avarie_transport' | 'defaillance_acheteur' | 'audit_certification';
  severity: RiskSeverity;
  title: string;
  description: string;
  detectedAt: string;
  affectedBuyersCount: number;
  totalValueAtRiskEuro: number;
  escrowStatusImpact: 'bloque_sequestre' | 'aucun_impact' | 'deblocage_partiel' | 'remboursement_enclenché';
  status: IncidentStatus;
  correctiveAction: string;
  resolutionDeadline: string;
}

export interface PilotWeekMilestone {
  week: number;
  title: string;
  phase: string;
  status: 'termine' | 'en_cours' | 'a_venir';
  progressPct: number;
  kpis: { label: string; current: string; target: string }[];
  deliverables: string[];
}

export interface CompanyLookupResult {
  siren: string;
  siret: string;
  companyName: string;
  tradeName?: string;
  street: string;
  postalCode: string;
  city: string;
  nafCode: string;
  vatNumber: string;
  companySize?: string;
  isMissionDriven?: boolean;
  hasAdemeAid?: boolean;
  isActive: boolean;
}

export interface CarbonComputeResult {
  material: string;
  quantity: number;
  unitWeightKg: number;
  totalWeightKg: number;
  virginFootprintKgCO2e: number;
  ecoFootprintKgCO2e: number;
  avoidedKgCO2e: number;
  reductionPercentage: number;
  virginPlasticAvoidedKg: number;
  waterSavedLiters: number;
  carKmEquivalent: number;
  ademeFactorCode: string;
}

export interface VirtualEscrowAccount {
  orderId: string;
  iban: string;
  bic: string;
  bankName: string;
  beneficiary: string;
  reference: string;
  escrowAmountTTC: number;
  status: 'active' | 'funded' | 'released' | 'refunded';
  expiresAt: string;
}

export type SyncStatus = 'online' | 'syncing' | 'offline' | 'error';

// ==========================================
// SCÉNARIOS DE TESTS & VALIDATION DES PARCOURS (OPTION C)
// ==========================================

export type TestExecutionStatus = 'idle' | 'running' | 'passed' | 'failed' | 'warning';

export interface TestCaseAssertion {
  id: string;
  name: string;
  description: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
  passed: boolean;
  metric?: string;
  details?: string;
}

export interface TestScenarioStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  actor: 'Acheteur (PME)' | 'Fournisseur (Usine)' | 'Algorithme EcoPool' | 'Hub Logistique' | 'Séquestre Escrow' | 'Admin & Juridique';
  actionName: string;
  status: TestExecutionStatus;
  durationMs?: number;
  assertions: TestCaseAssertion[];
  logs?: string[];
  outputData?: Record<string, any>;
}

export interface TestScenario {
  id: string;
  code: string; // e.g. "SCN-01"
  title: string;
  category: 
    | 'Parcours Acheteur' 
    | 'Moteur Agrégation' 
    | 'Fournisseur & QA Hub' 
    | 'Séquestre & Litiges' 
    | 'RSE & ADEME' 
    | 'Résilience & Persistence';
  description: string;
  targetEntity: string;
  prerequisites: string;
  steps: TestScenarioStep[];
  overallStatus: TestExecutionStatus;
  lastRunTimestamp?: string;
  durationMs?: number;
  criticality: 'Critique' | 'Haute' | 'Moyenne';
}

export interface ValidationSuiteReport {
  suiteId: string;
  generatedAt: string;
  auditor: string;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  totalDurationMs: number;
  complianceRate: number; // 0 - 100%
  scenarios: TestScenario[];
  summaryMessage: string;
}

