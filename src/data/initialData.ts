import { 
  Campaign, 
  Supplier, 
  BuyerProfile, 
  GroupingDemand, 
  AggregationOpportunity, 
  OrderReservation, 
  HubInventoryItem,
  PlatformEconomicConfig,
  SystemNotification
} from '../types';

export const initialSuppliers: Supplier[] = [
  {
    id: 'supp-01',
    name: 'Plastinnov Normandie',
    companyName: 'Plastinnov Industries SAS',
    country: 'France',
    city: 'Le Havre',
    factoryLocation: 'Parc Industriel de l’Estuaire, 76700 Gonfreville-l’Orcher',
    siren: '521948210',
    contactEmail: 'b2b-ecopool@plastinnov.fr',
    contactPhone: '+33 2 35 48 90 00',
    website: 'https://plastinnov-normandie.fr',
    status: 'verifie',
    leadTimeWeeks: 5,
    paymentTerms: '30% à la commande (Escrow), 70% avant expédition hub',
    logisticsConditions: 'Incoterm FCA Usine Le Havre vers Hub EcoPool Rouen',
    rating: 4.9,
    totalPoolsCompleted: 14,
    verifiedAt: '2026-02-15',
    certifications: [
      {
        id: 'cert-01',
        name: 'Global Recycled Standard (GRS 4.0)',
        authority: 'Ecocert Greenlife',
        licenseNumber: 'GRS-FR-2024-88419',
        issuedAt: '2024-05-10',
        expiresAt: '2027-05-09',
        scope: 'Production de flacons et bouchons en HDPE et PET 100% recyclés post-consommation',
        status: 'verified',
        lastAuditDate: '2026-04-12'
      },
      {
        id: 'cert-02',
        name: 'EU Ecolabel Emballages',
        authority: 'AFNOR Certification',
        licenseNumber: 'FR/045/012',
        issuedAt: '2025-01-20',
        expiresAt: '2028-01-19',
        scope: 'Emballages plastiques à empreinte carbone réduite et filière de recyclage validée',
        status: 'verified',
        lastAuditDate: '2026-01-15'
      }
    ],
    notes: 'Leader français de l’extrusion-soufflage en plastique PCR de grade cosmétique.'
  },
  {
    id: 'supp-02',
    name: 'Verreries Rhône-Alpes',
    companyName: 'Verreries Artisanales & Industrielles SAS',
    country: 'France',
    city: 'Lyon / Givors',
    factoryLocation: 'Zone Verrière des Berges du Rhône, 69700 Givors',
    siren: '419823901',
    contactEmail: 'contact@verreries-rhone.com',
    contactPhone: '+33 4 78 50 12 34',
    website: 'https://verreries-rhone.com',
    status: 'verifie',
    leadTimeWeeks: 6,
    paymentTerms: '50% Escrow engagement, solde à réception Hub EcoPool',
    logisticsConditions: 'Palettisation sécurisée avec intercalaires recyclés, transport mutualisé',
    rating: 4.8,
    totalPoolsCompleted: 9,
    verifiedAt: '2026-01-10',
    certifications: [
      {
        id: 'cert-03',
        name: 'Cradle to Cradle Certified (Silver)',
        authority: 'C2C Certified Institute',
        licenseNumber: 'C2C-GL-5819',
        issuedAt: '2024-09-01',
        expiresAt: '2026-11-30',
        scope: 'Fabrication de verre d’emballage allégé contenant min. 80% de calcin recyclé',
        status: 'verified',
        lastAuditDate: '2026-03-02'
      },
      {
        id: 'cert-04',
        name: 'ISO 14001:2015 Management Environnemental',
        authority: 'Bureau Veritas',
        licenseNumber: 'BV-FR-993021',
        issuedAt: '2023-06-15',
        expiresAt: '2026-06-14',
        scope: 'Gestion éco-énergétique des fours à verre et zéro rejet liquide',
        status: 'pending',
        lastAuditDate: '2025-06-10'
      }
    ]
  },
  {
    id: 'supp-03',
    name: 'BioPack Ibérica',
    companyName: 'BioPack Sustainable Containers SL',
    country: 'Espagne',
    city: 'Barcelone',
    factoryLocation: 'Polígono Industrial del Besòs, 08030 Barcelona',
    siren: 'ESB67291044',
    contactEmail: 'export@biopack-iberica.es',
    contactPhone: '+34 93 204 88 12',
    website: 'https://biopack-iberica.es',
    status: 'verifie',
    leadTimeWeeks: 4,
    paymentTerms: 'Paiement Escrow bloqué jusqu’au contrôle qualité au Hub',
    logisticsConditions: 'Transport routier combiné Espagne-France vers Hub Lyon',
    rating: 4.7,
    totalPoolsCompleted: 11,
    verifiedAt: '2026-03-01',
    certifications: [
      {
        id: 'cert-05',
        name: 'ISCC Plus (Biomasse & Biosourcé)',
        authority: 'DNV GL',
        licenseNumber: 'ISCC-PLUS-Cert-PL214-883',
        issuedAt: '2025-03-12',
        expiresAt: '2028-03-11',
        scope: 'Polymères biosourcés issus de résidus de canne à sucre sans déforestation',
        status: 'verified',
        lastAuditDate: '2026-03-01'
      }
    ]
  },
  {
    id: 'supp-04',
    name: 'Tissages Occitans Éthiques',
    companyName: 'Tissages & Confections d’Occitanie SARL',
    country: 'France',
    city: 'Castres',
    factoryLocation: 'Voie Textile du Sidobre, 81100 Castres',
    siren: '782910394',
    contactEmail: 'atelier@tissages-occitans.fr',
    contactPhone: '+33 5 63 71 22 00',
    website: 'https://tissages-occitans.fr',
    status: 'verifie',
    leadTimeWeeks: 5,
    paymentTerms: '30% commande, 70% contrôle conformité',
    logisticsConditions: 'Livraison vrac sous cartons recyclés au Hub EcoPool',
    rating: 4.9,
    totalPoolsCompleted: 8,
    verifiedAt: '2025-11-20',
    certifications: [
      {
        id: 'cert-06',
        name: 'GOTS Version 7.0 (Global Organic Textile Standard)',
        authority: 'Control Union',
        licenseNumber: 'CU-883019-GOTS',
        issuedAt: '2024-02-14',
        expiresAt: '2027-02-13',
        scope: 'Filature, tissage et confection de pochons et sacs en coton 100% biologique',
        status: 'verified',
        lastAuditDate: '2026-02-10'
      }
    ]
  },
  {
    id: 'supp-05',
    name: 'Cartonneries Éco-Alsace',
    companyName: 'Cartonneries Réunies du Rhin SAS',
    country: 'France',
    city: 'Mulhouse',
    factoryLocation: 'Parc Éco-Industriel Rhénan, 68100 Mulhouse',
    siren: '381920485',
    contactEmail: 'commercial@cartonnerie-rhin.fr',
    contactPhone: '+33 3 89 60 44 20',
    website: 'https://cartonnerie-rhin.fr',
    status: 'verifie',
    leadTimeWeeks: 3,
    paymentTerms: 'Escrow 100% à l’atteinte de la MOQ',
    logisticsConditions: 'Palettes sous film biodégradable',
    rating: 4.6,
    totalPoolsCompleted: 15,
    verifiedAt: '2025-10-05',
    certifications: [
      {
        id: 'cert-07',
        name: 'FSC Recycled (Forest Stewardship Council)',
        authority: 'SGS Forestry',
        licenseNumber: 'FSC-C149832',
        issuedAt: '2023-11-01',
        expiresAt: '2026-10-31',
        scope: 'Carton ondulé double cannelure 100% fibres recyclées post-consommation',
        status: 'verified',
        lastAuditDate: '2025-11-12'
      }
    ]
  },
  {
    id: 'supp-06',
    name: 'AluCyclo Med',
    companyName: 'Aluminium Recyclé de Provence SAS',
    country: 'France',
    city: 'Marseille',
    factoryLocation: 'Zone Portuaire Nord, 13015 Marseille',
    siren: '891029341',
    contactEmail: 'contact@alucyclo.fr',
    contactPhone: '+33 4 91 22 33 44',
    website: 'https://alucyclo.fr',
    status: 'en_verification',
    leadTimeWeeks: 7,
    paymentTerms: '40% Escrow à la signature',
    logisticsConditions: 'Plateaux thermoformés réutilisables',
    rating: 4.3,
    totalPoolsCompleted: 2,
    certifications: [
      {
        id: 'cert-08',
        name: 'Aluminium Stewardship Initiative (ASI)',
        authority: 'DNV GL',
        licenseNumber: 'ASI-PROV-2024',
        issuedAt: '2024-01-10',
        expiresAt: '2026-08-30',
        scope: 'Capuchons et bouchons cosmétiques en aluminium recyclé à 90%',
        status: 'pending',
        lastAuditDate: '2025-01-15'
      },
      {
        id: 'cert-09',
        name: 'Certificat REACH & Alimentarité',
        authority: 'Laboratoire Eurofins',
        licenseNumber: 'EF-REACH-9948',
        issuedAt: '2022-04-01',
        expiresAt: '2024-04-01',
        scope: 'Test de migration chimique - Flacons cosmétiques',
        status: 'expired',
        lastAuditDate: '2024-03-20'
      }
    ],
    notes: 'Dossier de renouvellement REACH en cours d’examen.'
  }
];

export const initialBuyerProfiles: BuyerProfile[] = [
  {
    id: 'buyer-01',
    companyName: 'Laboratoires Botanica France',
    siren: '849201948',
    contactName: 'Clémence Vasseur (Directrice Achats & RSE)',
    email: 'clemence.vasseur@botanica-lab.fr',
    phone: '+33 6 45 89 21 00',
    country: 'France',
    sector: 'cosmetique_naturelle',
    website: 'https://botanica-lab.fr',
    companySize: '11-50',
    annualPurchasingVolume: '80 000 à 150 000 contenants/an',
    targetMaterials: ['HDPE recyclé (PCR)', 'Verre allégé recyclé', 'Bouchons liège'],
    requiredCertifications: ['GRS', 'Ecocert', 'EU Ecolabel'],
    targetBudgetPerUnit: 0.85,
    deliveryAddress: {
      street: '14 Allée des Chênes Verts',
      postalCode: '69007',
      city: 'Lyon',
      country: 'France'
    },
    billingAddress: {
      street: '14 Allée des Chênes Verts',
      postalCode: '69007',
      city: 'Lyon',
      country: 'France'
    },
    isVerified: true
  },
  {
    id: 'buyer-02',
    companyName: 'Maison Éthique & Soin',
    siren: '910283948',
    contactName: 'Marc Delaunay (Fondateur & CEO)',
    email: 'marc@maison-ethique-soin.com',
    phone: '+33 6 12 34 56 78',
    country: 'France',
    sector: 'cosmetique_naturelle',
    website: 'https://maison-ethique-soin.com',
    companySize: '1-10',
    annualPurchasingVolume: '30 000 à 60 000 unités/an',
    targetMaterials: ['Plastique 100% PCR', 'Aluminium recyclé'],
    requiredCertifications: ['GRS', 'Cosmos Organic'],
    targetBudgetPerUnit: 0.80,
    deliveryAddress: {
      street: '8 Rue Paradis',
      postalCode: '13001',
      city: 'Marseille',
      country: 'France'
    },
    billingAddress: {
      street: '8 Rue Paradis',
      postalCode: '13001',
      city: 'Marseille',
      country: 'France'
    },
    isVerified: true
  },
  {
    id: 'buyer-03',
    companyName: 'Atelier Néo-Textile',
    siren: '772910485',
    contactName: 'Sarah Benali (Responsable Sourcing)',
    email: 'sarah@atelier-neotextile.fr',
    phone: '+33 6 78 90 12 34',
    country: 'France',
    sector: 'mode_ethique',
    website: 'https://atelier-neotextile.fr',
    companySize: '11-50',
    annualPurchasingVolume: '40 000 pochons et sacs/an',
    targetMaterials: ['Coton bio GOTS', 'Fibres recyclées'],
    requiredCertifications: ['GOTS', 'Fairtrade'],
    targetBudgetPerUnit: 1.10,
    deliveryAddress: {
      street: '22 Rue Oberkampf',
      postalCode: '75011',
      city: 'Paris',
      country: 'France'
    },
    billingAddress: {
      street: '22 Rue Oberkampf',
      postalCode: '75011',
      city: 'Paris',
      country: 'France'
    },
    isVerified: true
  },
  {
    id: 'buyer-04',
    companyName: 'PureClean Organics (DNVB)',
    siren: '883920194',
    contactName: 'Thomas Leroy (Head of Operations)',
    email: 'thomas@pureclean.io',
    phone: '+33 6 99 00 11 22',
    country: 'France',
    sector: 'dnvb',
    website: 'https://pureclean.io',
    companySize: '11-50',
    annualPurchasingVolume: '100 000 flacons/an',
    targetMaterials: ['HDPE PCR', 'Carton FSC'],
    requiredCertifications: ['GRS', 'FSC'],
    targetBudgetPerUnit: 0.75,
    deliveryAddress: {
      street: '45 Quai de Bacalan',
      postalCode: '33300',
      city: 'Bordeaux',
      country: 'France'
    },
    billingAddress: {
      street: '45 Quai de Bacalan',
      postalCode: '33300',
      city: 'Bordeaux',
      country: 'France'
    },
    isVerified: true
  }
];

export const initialCampaigns: Campaign[] = [
  {
    id: 'camp-01',
    title: 'Flacon Cosmétique PCR 100% Recyclé — 250 ml',
    subtitle: 'Flacon cylindrique standard européen 24/410 en PEHD post-consommation certifié GRS pour shampoings, gels douche et lotions.',
    featured: true,
    product: {
      id: 'prod-01',
      name: 'Flacon Cylindre 250ml PCR 100%',
      category: 'packaging',
      subCategory: 'flacons',
      material: 'HDPE 100% Recyclé Post-Consommation (PCR Européen)',
      recycledPercentage: 100,
      capacity: '250 ml',
      neckFinish: '24/410 Standard',
      color: 'Naturel teinté ambré (anti-UV) ou blanc opaque',
      weightGrams: 24,
      foodCosmeticGrade: true,
      recyclabilityIndex: '100% Recyclable dans le bac jaune (Code 2 HDPE)',
      originCountry: 'France (Origine Normandie)',
      co2SavedPerUnitGrams: 48,
      virginPlasticAvoidedGrams: 24,
      photos: [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1608248597359-0f0e74f17849?auto=format&fit=crop&w=800&q=80'
      ],
      technicalDataSheetUrl: '/docs/Fiche_Technique_Flacon_250ml_PCR_Plastinnov.pdf'
    },
    supplier: initialSuppliers[0], // Plastinnov Normandie
    moq: 50000,
    targetVolume: 60000,
    maxVolume: 90000,
    reservedVolume: 42500,
    participantsCount: 4,
    currentUnitPrice: 0.82,
    marketSoloPrice: 1.38, // Prix payé par une PME achetant seule 5k unités
    priceTiers: [
      { volume: 50000, unitPrice: 0.82, discountPct: 40.5, label: 'Palier 1 — MOQ Atteinte' },
      { volume: 60000, unitPrice: 0.74, discountPct: 46.3, label: 'Palier 2 — Objectif Optimal' },
      { volume: 75000, unitPrice: 0.68, discountPct: 50.7, label: 'Palier 3 — Super Volume' }
    ],
    certifications: [
      initialSuppliers[0].certifications[0],
      initialSuppliers[0].certifications[1]
    ],
    status: 'presque_financee', // 42.5k / 50k = 85% de la MOQ!
    opensAt: '2026-09-10',
    closesAt: '2026-10-06', // 12 jours restants
    estimatedProductionDate: '2026-10-20',
    estimatedDeliveryDate: '2026-11-15',
    logisticsConditions: {
      hubLocation: 'Hub Central EcoPool Normandie (Rouen - Val-de-Reuil)',
      packagingUnit: 'Carton double cannelure',
      boxesPerPallet: 24,
      unitsPerBox: 250,
      estimatedHubShippingCostPerUnit: 0.04
    },
    paymentTerms: 'Séquestre Escrow B2B : débit différé à la clôture de la campagne.',
    ecopoolFeePct: 6.5,
    participants: [
      {
        id: 'part-01',
        buyerId: 'buyer-01',
        buyerName: 'Clémence Vasseur',
        companyName: 'Laboratoires Botanica France',
        sector: 'cosmetique_naturelle',
        quantity: 15000,
        unitPricePaid: 0.82,
        totalAmount: 12300,
        reservedAt: '2026-09-12',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      },
      {
        id: 'part-02',
        buyerId: 'buyer-02',
        buyerName: 'Marc Delaunay',
        companyName: 'Maison Éthique & Soin',
        sector: 'cosmetique_naturelle',
        quantity: 12000,
        unitPricePaid: 0.82,
        totalAmount: 9840,
        reservedAt: '2026-09-14',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      },
      {
        id: 'part-03',
        buyerId: 'buyer-04',
        buyerName: 'Thomas Leroy',
        companyName: 'PureClean Organics',
        sector: 'dnvb',
        quantity: 10000,
        unitPricePaid: 0.82,
        totalAmount: 8200,
        reservedAt: '2026-09-18',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      },
      {
        id: 'part-04',
        buyerId: 'buyer-ext-01',
        buyerName: 'Sophie Garnier',
        companyName: 'Savonnerie Provençale SAS',
        sector: 'cosmetique_naturelle',
        quantity: 5500,
        unitPricePaid: 0.82,
        totalAmount: 4510,
        reservedAt: '2026-09-21',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      }
    ]
  },
  {
    id: 'camp-02',
    title: 'Flacon Cosmétique Grand Format PCR 100% — 500 ml',
    subtitle: 'Flacon haute résistance 500ml compatible pompes lotions et bouchons capsules, PET 100% recyclé clarifié pour formulations bio.',
    featured: true,
    product: {
      id: 'prod-02',
      name: 'Flacon Grand Format 500ml RPET',
      category: 'packaging',
      subCategory: 'flacons',
      material: 'RPET 100% Recyclé Clarifié (Grade Cosmétique ECOCERT)',
      recycledPercentage: 100,
      capacity: '500 ml',
      neckFinish: '28/410',
      color: 'Translucide ambré ou cristal',
      weightGrams: 36,
      foodCosmeticGrade: true,
      recyclabilityIndex: '100% Recyclable (Code 1 PET)',
      originCountry: 'France',
      co2SavedPerUnitGrams: 72,
      virginPlasticAvoidedGrams: 36,
      photos: [
        'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'
      ]
    },
    supplier: initialSuppliers[0],
    moq: 40000,
    targetVolume: 50000,
    maxVolume: 75000,
    reservedVolume: 41200, // MOQ Atteinte !
    participantsCount: 5,
    currentUnitPrice: 1.15,
    marketSoloPrice: 1.85,
    priceTiers: [
      { volume: 40000, unitPrice: 1.15, discountPct: 37.8, label: 'Palier 1 — MOQ 40k' },
      { volume: 50000, unitPrice: 1.02, discountPct: 44.8, label: 'Palier 2 — Volume 50k' },
      { volume: 65000, unitPrice: 0.94, discountPct: 49.1, label: 'Palier 3 — Volume 65k' }
    ],
    certifications: [
      initialSuppliers[0].certifications[0],
      initialSuppliers[0].certifications[1]
    ],
    status: 'moq_atteinte',
    opensAt: '2026-09-01',
    closesAt: '2026-10-02',
    estimatedProductionDate: '2026-10-15',
    estimatedDeliveryDate: '2026-11-10',
    logisticsConditions: {
      hubLocation: 'Hub Central EcoPool Normandie',
      packagingUnit: 'Carton renforcé',
      boxesPerPallet: 20,
      unitsPerBox: 150,
      estimatedHubShippingCostPerUnit: 0.05
    },
    paymentTerms: 'Escrow sécurisé B2B, validation MOQ confirmée',
    ecopoolFeePct: 6.5,
    participants: [
      {
        id: 'part-05',
        buyerId: 'buyer-01',
        buyerName: 'Clémence Vasseur',
        companyName: 'Laboratoires Botanica France',
        sector: 'cosmetique_naturelle',
        quantity: 18000,
        unitPricePaid: 1.15,
        totalAmount: 20700,
        reservedAt: '2026-09-05',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      },
      {
        id: 'part-06',
        buyerId: 'buyer-04',
        buyerName: 'Thomas Leroy',
        companyName: 'PureClean Organics',
        sector: 'dnvb',
        quantity: 12000,
        unitPricePaid: 1.15,
        totalAmount: 13800,
        reservedAt: '2026-09-08',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      },
      {
        id: 'part-07',
        buyerId: 'buyer-ext-02',
        buyerName: 'Antoine Morel',
        companyName: 'BioLotion Pro France',
        sector: 'cosmetique_naturelle',
        quantity: 11200,
        unitPricePaid: 1.15,
        totalAmount: 12880,
        reservedAt: '2026-09-15',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      }
    ]
  },
  {
    id: 'camp-03',
    title: 'Pot Cosmétique Verre Allégé & Recyclé 85% — 50 ml',
    subtitle: 'Pot en verre circulaire allégé haute résistance, fabriqué en France avec 85% de calcin recyclé. Certifié Cradle to Cradle.',
    featured: true,
    product: {
      id: 'prod-03',
      name: 'Pot Verre Circulaire 50ml Éco-Conçu',
      category: 'packaging',
      subCategory: 'pots',
      material: 'Verre blanc allégé à 85% de calcin recyclé post-consommation',
      recycledPercentage: 85,
      capacity: '50 ml',
      neckFinish: 'Filetage GCMI 48/400',
      color: 'Verre transparent ou teinté fumé',
      weightGrams: 58,
      foodCosmeticGrade: true,
      recyclabilityIndex: '100% Recyclable à l’infini',
      originCountry: 'France (Vallée du Rhône)',
      co2SavedPerUnitGrams: 85,
      virginPlasticAvoidedGrams: 45,
      photos: [
        'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80'
      ]
    },
    supplier: initialSuppliers[1], // Verreries Rhône-Alpes
    moq: 30000,
    targetVolume: 35000,
    maxVolume: 60000,
    reservedVolume: 28000, // 93.3% de la MOQ!
    participantsCount: 3,
    currentUnitPrice: 0.98,
    marketSoloPrice: 1.65,
    priceTiers: [
      { volume: 30000, unitPrice: 0.98, discountPct: 40.6, label: 'Palier 1 — MOQ 30k' },
      { volume: 35000, unitPrice: 0.89, discountPct: 46.0, label: 'Palier 2 — Objectif 35k' },
      { volume: 45000, unitPrice: 0.81, discountPct: 50.9, label: 'Palier 3 — Grand Volume 45k' }
    ],
    certifications: [
      initialSuppliers[1].certifications[0],
      initialSuppliers[1].certifications[1]
    ],
    status: 'presque_financee',
    opensAt: '2026-09-05',
    closesAt: '2026-10-10',
    estimatedProductionDate: '2026-10-25',
    estimatedDeliveryDate: '2026-11-20',
    logisticsConditions: {
      hubLocation: 'Hub Central EcoPool Sud (Lyon Saint-Priest)',
      packagingUnit: 'Plateau alvéolé thermoformé recyclé',
      boxesPerPallet: 18,
      unitsPerBox: 120,
      estimatedHubShippingCostPerUnit: 0.06
    },
    paymentTerms: 'Escrow sécurisé, déblocage 50% au lancement de four',
    ecopoolFeePct: 6.5,
    participants: [
      {
        id: 'part-08',
        buyerId: 'buyer-01',
        buyerName: 'Clémence Vasseur',
        companyName: 'Laboratoires Botanica France',
        sector: 'cosmetique_naturelle',
        quantity: 12000,
        unitPricePaid: 0.98,
        totalAmount: 11760,
        reservedAt: '2026-09-10',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      },
      {
        id: 'part-09',
        buyerId: 'buyer-02',
        buyerName: 'Marc Delaunay',
        companyName: 'Maison Éthique & Soin',
        sector: 'cosmetique_naturelle',
        quantity: 10000,
        unitPricePaid: 0.98,
        totalAmount: 9800,
        reservedAt: '2026-09-12',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      },
      {
        id: 'part-10',
        buyerId: 'buyer-ext-03',
        buyerName: 'Hélène Vautier',
        companyName: 'Crèmes & Sérums des Alpes',
        sector: 'cosmetique_naturelle',
        quantity: 6000,
        unitPricePaid: 0.98,
        totalAmount: 5880,
        reservedAt: '2026-09-18',
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      }
    ]
  },
  {
    id: 'camp-04',
    title: 'Tube Cosmétique Biosourcé Canne à Sucre — 100 ml',
    subtitle: 'Tube souple extrudé en PE végétal biosourcé certifié ISCC Plus avec bouchon flip-top en PP recyclé.',
    featured: false,
    product: {
      id: 'prod-04',
      name: 'Tube Souple 100ml Biosourcé',
      category: 'packaging',
      subCategory: 'tubes',
      material: 'Polyéthylène végétal (Canne à sucre certifiée sans déforestation)',
      recycledPercentage: 0,
      capacity: '100 ml',
      neckFinish: 'Bouchon flip-top 35mm scellé',
      color: 'Blanc satiné toucher soft-touch',
      weightGrams: 16,
      foodCosmeticGrade: true,
      recyclabilityIndex: 'Recyclable dans la filière PE (Code 4)',
      originCountry: 'Espagne',
      co2SavedPerUnitGrams: 52,
      virginPlasticAvoidedGrams: 16,
      photos: [
        'https://images.unsplash.com/photo-1556228722-d0b5ed7f5a89?auto=format&fit=crop&w=800&q=80'
      ]
    },
    supplier: initialSuppliers[2],
    moq: 25000,
    targetVolume: 30000,
    maxVolume: 50000,
    reservedVolume: 32000,
    participantsCount: 4,
    currentUnitPrice: 0.69,
    marketSoloPrice: 1.15,
    priceTiers: [
      { volume: 25000, unitPrice: 0.76, discountPct: 33.9 },
      { volume: 30000, unitPrice: 0.69, discountPct: 40.0 },
      { volume: 45000, unitPrice: 0.62, discountPct: 46.0 }
    ],
    certifications: [initialSuppliers[2].certifications[0]],
    status: 'production', // En cours de production à l'usine!
    opensAt: '2026-08-10',
    closesAt: '2026-09-10',
    estimatedProductionDate: '2026-09-25',
    estimatedDeliveryDate: '2026-10-15',
    logisticsConditions: {
      hubLocation: 'Hub Central EcoPool Sud (Lyon)',
      packagingUnit: 'Cartons de 400 unités',
      boxesPerPallet: 20,
      unitsPerBox: 400,
      estimatedHubShippingCostPerUnit: 0.03
    },
    paymentTerms: 'Fonds débloqués 60% au fabricant, solde à la livraison Hub',
    ecopoolFeePct: 6.5,
    participants: []
  },
  {
    id: 'camp-05',
    title: 'Pochette Cadeau Textile Coton Biologique GOTS — 15x20 cm',
    subtitle: 'Pochon cordon coulissant pour marques cosmétiques et mode éthique, toile de coton écru certifiée GOTS 7.0 sans blanchiment chimique.',
    featured: false,
    product: {
      id: 'prod-05',
      name: 'Pochon Textile Coton Bio GOTS',
      category: 'textile',
      subCategory: 'pochons',
      material: 'Toile 100% Coton Biologique Régénératif 140g/m²',
      recycledPercentage: 0,
      capacity: '15 x 20 cm',
      color: 'Écru naturel non blanchi',
      foodCosmeticGrade: true,
      recyclabilityIndex: '100% Biodégradable & compostable',
      originCountry: 'France (Occitanie)',
      co2SavedPerUnitGrams: 110,
      virginPlasticAvoidedGrams: 0,
      photos: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
      ]
    },
    supplier: initialSuppliers[3],
    moq: 20000,
    targetVolume: 25000,
    maxVolume: 40000,
    reservedVolume: 14500,
    participantsCount: 3,
    currentUnitPrice: 1.05,
    marketSoloPrice: 1.95,
    priceTiers: [
      { volume: 20000, unitPrice: 1.05, discountPct: 46.1 },
      { volume: 25000, unitPrice: 0.94, discountPct: 51.7 },
      { volume: 35000, unitPrice: 0.85, discountPct: 56.4 }
    ],
    certifications: [initialSuppliers[3].certifications[0]],
    status: 'ouverte',
    opensAt: '2026-09-12',
    closesAt: '2026-10-18',
    estimatedProductionDate: '2026-11-01',
    estimatedDeliveryDate: '2026-11-25',
    logisticsConditions: {
      hubLocation: 'Hub Central EcoPool Sud (Lyon)',
      packagingUnit: 'Ballots de 500 unités sous carton kraft',
      boxesPerPallet: 16,
      unitsPerBox: 500,
      estimatedHubShippingCostPerUnit: 0.04
    },
    paymentTerms: 'Escrow B2B EcoPool',
    ecopoolFeePct: 6.5,
    participants: []
  },
  {
    id: 'camp-06',
    title: 'Boîte Expédition Carton Ondulé 100% Recyclé FSC — Format M',
    subtitle: 'Boîte postale e-commerce à bande adhésive kraft sans plastique, certifiée FSC Recycled, testée pour transport colissimo & transporteurs.',
    featured: false,
    product: {
      id: 'prod-06',
      name: 'Boîte Postale E-commerce Format M',
      category: 'packaging',
      subCategory: 'cartons',
      material: 'Carton ondulé micro-cannelure 100% papier recyclé FSC',
      recycledPercentage: 100,
      capacity: '240 x 180 x 90 mm',
      color: 'Kraft naturel brun',
      foodCosmeticGrade: false,
      recyclabilityIndex: '100% Recyclable dans la filière papier',
      originCountry: 'France (Alsace)',
      co2SavedPerUnitGrams: 95,
      virginPlasticAvoidedGrams: 0,
      photos: [
        'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'
      ]
    },
    supplier: initialSuppliers[4],
    moq: 25000,
    targetVolume: 30000,
    maxVolume: 60000,
    reservedVolume: 26500,
    participantsCount: 6,
    currentUnitPrice: 0.44,
    marketSoloPrice: 0.85,
    priceTiers: [
      { volume: 25000, unitPrice: 0.44, discountPct: 48.2 },
      { volume: 30000, unitPrice: 0.38, discountPct: 55.2 },
      { volume: 40000, unitPrice: 0.34, discountPct: 60.0 }
    ],
    certifications: [initialSuppliers[4].certifications[0]],
    status: 'moq_atteinte',
    opensAt: '2026-09-08',
    closesAt: '2026-10-05',
    estimatedProductionDate: '2026-10-18',
    estimatedDeliveryDate: '2026-11-05',
    logisticsConditions: {
      hubLocation: 'Hub Central EcoPool Grand-Est (Strasbourg)',
      packagingUnit: 'Paquets à plat de 50 unités',
      boxesPerPallet: 20,
      unitsPerBox: 50,
      estimatedHubShippingCostPerUnit: 0.03
    },
    paymentTerms: 'Escrow B2B standard',
    ecopoolFeePct: 6.5,
    participants: []
  }
];

// DEMANDES EN ATTENTE POUR L'ALGORITHME DE GROUPAGE (Section 8 du cahier des charges)
// "10 entreprises recherchent flacon PCR 250 ml : 8k + 5k + 12k + 7k + 10k + 6k + 4k = 52k (MOQ: 50k)"
export const initialGroupingDemands: GroupingDemand[] = [
  {
    id: 'dem-01',
    buyerId: 'buyer-pme-1',
    companyName: 'CosméNature Bio SAS',
    sector: 'cosmetique_naturelle',
    productCategory: 'Packaging Cosmétique',
    format: 'Flacon 250 ml (col 24/410)',
    material: 'HDPE 100% Recyclé PCR',
    desiredQuantity: 8000,
    maxBudgetUnit: 0.90,
    requiredCertifications: ['GRS', 'EU Ecolabel'],
    submittedAt: '2026-09-20',
    status: 'pending'
  },
  {
    id: 'dem-02',
    buyerId: 'buyer-pme-2',
    companyName: 'Aura Botanics Ltd',
    sector: 'cosmetique_naturelle',
    productCategory: 'Packaging Cosmétique',
    format: 'Flacon 250 ml (col 24/410)',
    material: 'HDPE 100% Recyclé PCR',
    desiredQuantity: 5000,
    maxBudgetUnit: 0.88,
    requiredCertifications: ['GRS'],
    submittedAt: '2026-09-21',
    status: 'pending'
  },
  {
    id: 'dem-03',
    buyerId: 'buyer-pme-3',
    companyName: 'Laboratoires Provence Soins',
    sector: 'cosmetique_naturelle',
    productCategory: 'Packaging Cosmétique',
    format: 'Flacon 250 ml (col 24/410)',
    material: 'HDPE 100% Recyclé PCR',
    desiredQuantity: 12000,
    maxBudgetUnit: 0.85,
    requiredCertifications: ['GRS', 'Ecocert'],
    submittedAt: '2026-09-21',
    status: 'pending'
  },
  {
    id: 'dem-04',
    buyerId: 'buyer-pme-4',
    companyName: 'PureClean Skin Paris',
    sector: 'dnvb',
    productCategory: 'Packaging Cosmétique',
    format: 'Flacon 250 ml (col 24/410)',
    material: 'HDPE 100% Recyclé PCR',
    desiredQuantity: 7000,
    maxBudgetUnit: 0.85,
    requiredCertifications: ['GRS'],
    submittedAt: '2026-09-22',
    status: 'pending'
  },
  {
    id: 'dem-05',
    buyerId: 'buyer-pme-5',
    companyName: 'Maison du Shampoing Solide & Liquide',
    sector: 'cosmetique_naturelle',
    productCategory: 'Packaging Cosmétique',
    format: 'Flacon 250 ml (col 24/410)',
    material: 'HDPE 100% Recyclé PCR',
    desiredQuantity: 10000,
    maxBudgetUnit: 0.82,
    requiredCertifications: ['GRS', 'EU Ecolabel'],
    submittedAt: '2026-09-22',
    status: 'pending'
  },
  {
    id: 'dem-06',
    buyerId: 'buyer-pme-6',
    companyName: 'Atelier Cosmétique Breton',
    sector: 'cosmetique_naturelle',
    productCategory: 'Packaging Cosmétique',
    format: 'Flacon 250 ml (col 24/410)',
    material: 'HDPE 100% Recyclé PCR',
    desiredQuantity: 6000,
    maxBudgetUnit: 0.88,
    requiredCertifications: ['GRS'],
    submittedAt: '2026-09-23',
    status: 'pending'
  },
  {
    id: 'dem-07',
    buyerId: 'buyer-pme-7',
    companyName: 'EcoBarber Grooming',
    sector: 'dnvb',
    productCategory: 'Packaging Cosmétique',
    format: 'Flacon 250 ml (col 24/410)',
    material: 'HDPE 100% Recyclé PCR',
    desiredQuantity: 4000,
    maxBudgetUnit: 0.92,
    requiredCertifications: ['GRS'],
    submittedAt: '2026-09-23',
    status: 'pending'
  },
  // Demandes pour une autre référence (Pots verre)
  {
    id: 'dem-08',
    buyerId: 'buyer-pme-8',
    companyName: 'Baumes & Élixirs des Cévennes',
    sector: 'cosmetique_naturelle',
    productCategory: 'Packaging Verre',
    format: 'Pot 50 ml bague 48/400',
    material: 'Verre allégé 80%+ recyclé',
    desiredQuantity: 9000,
    maxBudgetUnit: 1.05,
    requiredCertifications: ['Cradle to Cradle'],
    submittedAt: '2026-09-22',
    status: 'pending'
  },
  {
    id: 'dem-09',
    buyerId: 'buyer-pme-9',
    companyName: 'BioCrèmes Aquitaine',
    sector: 'cosmetique_naturelle',
    productCategory: 'Packaging Verre',
    format: 'Pot 50 ml bague 48/400',
    material: 'Verre allégé 80%+ recyclé',
    desiredQuantity: 11000,
    maxBudgetUnit: 1.00,
    requiredCertifications: ['Cradle to Cradle'],
    submittedAt: '2026-09-23',
    status: 'pending'
  }
];

export const initialAggregationOpportunities: AggregationOpportunity[] = [
  {
    id: 'opp-01',
    productTitle: 'Flacon Cylindre Cosmétique PCR 100% — 250 ml (Col 24/410)',
    category: 'Packaging Cosmétique',
    format: 'Flacon cylindrique 250 ml',
    material: 'HDPE 100% Recyclé PCR Certifié GRS',
    aggregatedQuantity: 52000, // 8k + 5k + 12k + 7k + 10k + 6k + 4k = 52 000 !
    requiredMOQ: 50000,
    targetSupplier: 'Plastinnov Normandie (Capacité vérifiée)',
    demandCount: 7,
    compatibleDemands: initialGroupingDemands.slice(0, 7),
    status: 'moq_reached_ready', // Seuil MOQ atteint !
    potentialUnitPrice: 0.82,
    estimatedSavingsPct: 40.5
  },
  {
    id: 'opp-02',
    productTitle: 'Pot Cosmétique Verre Allégé 85% Recyclé — 50 ml',
    category: 'Packaging Verre',
    format: 'Pot verre bague 48/400 50 ml',
    material: 'Verre recyclé allégé C2C',
    aggregatedQuantity: 20000, // 9k + 11k = 20k sur MOQ 30k
    requiredMOQ: 30000,
    targetSupplier: 'Verreries Rhône-Alpes',
    demandCount: 2,
    compatibleDemands: initialGroupingDemands.slice(7, 9),
    status: 'gathering',
    potentialUnitPrice: 0.98,
    estimatedSavingsPct: 40.6
  }
];

export const initialOrders: OrderReservation[] = [
  {
    id: 'ord-881',
    campaignId: 'camp-01',
    campaignTitle: 'Flacon Cosmétique PCR 100% Recyclé — 250 ml',
    buyerId: 'buyer-01',
    companyName: 'Laboratoires Botanica France',
    productName: 'Flacon Cylindre 250ml PCR 100%',
    quantity: 15000,
    unitPrice: 0.82,
    goodsTotal: 12300,
    ecopoolFee: 799.50,
    logisticsFee: 600.00,
    totalTTC: 13699.50,
    escrowStatus: 'paiement_securise',
    paymentMethod: 'prelevement_sepa_b2b',
    reservedAt: '2026-09-12 14:30',
    hubTrackingNumber: 'HUB-NRM-2026-0914',
    finalTrackingNumber: 'ECO-BTK-FR-77192',
    logisticsStep: 'controle_lot'
  },
  {
    id: 'ord-882',
    campaignId: 'camp-02',
    campaignTitle: 'Flacon Cosmétique Grand Format PCR 100% — 500 ml',
    buyerId: 'buyer-01',
    companyName: 'Laboratoires Botanica France',
    productName: 'Flacon Grand Format 500ml RPET',
    quantity: 18000,
    unitPrice: 1.15,
    goodsTotal: 20700,
    ecopoolFee: 1345.50,
    logisticsFee: 900.00,
    totalTTC: 22945.50,
    escrowStatus: 'paiement_securise',
    paymentMethod: 'virement_escrow',
    reservedAt: '2026-09-05 10:15',
    hubTrackingNumber: 'HUB-NRM-2026-0884',
    finalTrackingNumber: 'ECO-BTK-FR-77193',
    logisticsStep: 'reception_hub'
  },
  {
    id: 'ord-883',
    campaignId: 'camp-03',
    campaignTitle: 'Pot Cosmétique Verre Allégé & Recyclé 85% — 50 ml',
    buyerId: 'buyer-01',
    companyName: 'Laboratoires Botanica France',
    productName: 'Pot Verre Circulaire 50ml Éco-Conçu',
    quantity: 12000,
    unitPrice: 0.98,
    goodsTotal: 11760,
    ecopoolFee: 764.40,
    logisticsFee: 720.00,
    totalTTC: 13244.40,
    escrowStatus: 'paiement_securise',
    paymentMethod: 'prelevement_sepa_b2b',
    reservedAt: '2026-09-10 16:45',
    logisticsStep: 'reception_hub'
  }
];

export const initialHubInventory: HubInventoryItem[] = [
  {
    id: 'hub-item-01',
    campaignId: 'camp-04',
    productName: 'Tube Cosmétique Biosourcé Canne à Sucre 100ml',
    supplierName: 'BioPack Ibérica',
    batchNumber: 'LOT-BIO-2026-089',
    totalReceivedUnits: 32000,
    inspectedUnits: 1500,
    qaPassRatePct: 99.8,
    storageZone: 'Zone A - Quai 3 (Rouen Hub)',
    receivedDate: '2026-09-20',
    dispatchStatus: 'conforme_en_repartition'
  },
  {
    id: 'hub-item-02',
    campaignId: 'camp-01',
    productName: 'Échantillons Pré-Série Flacon 250ml PCR',
    supplierName: 'Plastinnov Normandie',
    batchNumber: 'LOT-PRE-76-004',
    totalReceivedUnits: 500,
    inspectedUnits: 500,
    qaPassRatePct: 100.0,
    storageZone: 'Laboratoire Contrôle Qualité Hub',
    receivedDate: '2026-09-22',
    dispatchStatus: 'en_attente_qa'
  }
];

export const initialEconomicConfig: PlatformEconomicConfig = {
  commissionRatePct: 6.5, // 6.5% de take rate sur le volume transactionnel
  subscriptionPlans: [
    {
      id: 'sub-starter',
      name: 'Starter PME',
      monthlyPriceEuro: 99,
      description: 'Idéal pour les marques émergentes réalisant 2 à 4 commandes groupées par an.',
      features: [
        'Accès illimité aux campagnes groupées ouvertes',
        'Calculateur d’économies et simulation de paliers',
        'Support d’intermédiation Escrow sécurisé',
        'Contrôle qualité au Hub EcoPool standard',
        'Frais de commission : 7.5%'
      ]
    },
    {
      id: 'sub-pro',
      name: 'Pro Sourcing',
      monthlyPriceEuro: 199,
      description: 'Pour les PME et DNVB actives avec besoins de groupage réguliers et sourcing sur-mesure.',
      features: [
        'Toutes les fonctionnalités Starter',
        'Priorité de réservation sur les campagnes à forte demande',
        'Dépôt de besoins d’agrégation algorithmique illimité',
        'Assistant IA Sourcing & Conformité illimité',
        'Stockage tampon Hub étendu (14 jours offerts)',
        'Frais de commission réduits : 6.0%'
      ]
    },
    {
      id: 'sub-enterprise',
      name: 'Enterprise / ETI',
      monthlyPriceEuro: 299,
      description: 'Pour les ETI industrielles et regroupements de marques nécessitant un accompagnement dédié.',
      features: [
        'Toutes les fonctionnalités Pro Sourcing',
        'Création de campagnes privées multi-filiales',
        'Account Manager Achats & Logistique dédié',
        'Audit documentaire et conformité fournisseur approfondi',
        'Accès API et intégration ERP B2B',
        'Frais de commission optimisés : 5.0%'
      ]
    }
  ]
};

export const initialNotifications: SystemNotification[] = [
  {
    id: 'notif-01',
    title: 'Campagne presque financée (85%)',
    message: 'La campagne Flacon Cosmétique PCR 250ml a atteint 42 500 unités. Il ne manque que 7 500 unités pour atteindre la MOQ de 50 000 !',
    type: 'info',
    timestamp: 'Il y a 2 heures',
    read: false
  },
  {
    id: 'notif-02',
    title: 'Opportunité de groupage détectée !',
    message: 'L’algorithme d’agrégation a identifié 7 PME cumulant 52 000 flacons PCR 250ml. La MOQ de 50k chez Plastinnov est atteinte. Cliquez pour lancer la campagne.',
    type: 'success',
    timestamp: 'Il y a 4 heures',
    read: false
  },
  {
    id: 'notif-03',
    title: 'Rappel Conformité Certificat',
    message: 'Le certificat REACH du fournisseur AluCyclo Med arrive à expiration. Audit documentaire requis.',
    type: 'warning',
    timestamp: 'Hier',
    read: false
  }
];
