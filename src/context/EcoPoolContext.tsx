import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Campaign, 
  Supplier, 
  BuyerProfile, 
  GroupingDemand, 
  AggregationOpportunity, 
  OrderReservation, 
  HubInventoryItem,
  PlatformEconomicConfig,
  SystemNotification,
  UserRole,
  CampaignStatus,
  SupplierStatus,
  CertificationStatus
} from '../types';
import { 
  initialCampaigns, 
  initialSuppliers, 
  initialBuyerProfiles, 
  initialGroupingDemands, 
  initialAggregationOpportunities, 
  initialOrders, 
  initialHubInventory, 
  initialEconomicConfig, 
  initialNotifications 
} from '../data/initialData';

interface EcoPoolContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentBuyer: BuyerProfile;
  currentSupplier: Supplier;
  campaigns: Campaign[];
  suppliers: Supplier[];
  buyerProfiles: BuyerProfile[];
  groupingDemands: GroupingDemand[];
  opportunities: AggregationOpportunity[];
  orders: OrderReservation[];
  hubInventory: HubInventoryItem[];
  economicConfig: PlatformEconomicConfig;
  notifications: SystemNotification[];
  
  // Actions
  joinCampaign: (campaignId: string, quantity: number, notes?: string) => { success: boolean; orderId?: string; message: string };
  createCampaign: (campaign: Omit<Campaign, 'id' | 'reservedVolume' | 'participantsCount' | 'participants'>) => void;
  updateCampaignStatus: (campaignId: string, status: CampaignStatus) => void;
  submitCustomDemand: (demand: Omit<GroupingDemand, 'id' | 'submittedAt' | 'status'>) => void;
  convertOpportunityToCampaign: (oppId: string) => Campaign | null;
  updateSupplierStatus: (supplierId: string, status: SupplierStatus) => void;
  updateCertificationStatus: (supplierId: string, certId: string, status: CertificationStatus) => void;
  updateLogisticsStep: (orderId: string, step: OrderReservation['logisticsStep']) => void;
  updateHubItemStatus: (itemId: string, status: HubInventoryItem['dispatchStatus']) => void;
  updateCommissionRate: (ratePct: number) => void;
  updateSubscriptionPrice: (planId: string, newPrice: number) => void;
  markNotificationRead: (id: string) => void;
  calculateSavings: (campaign: Campaign, quantity: number) => {
    soloTotal: number;
    groupTotal: number;
    goodsTotal: number;
    savingsEuro: number;
    savingsPct: number;
    applicableUnitPrice: number;
    ecopoolFee: number;
    logisticsEst: number;
    totalAmount: number;
  };
}

const EcoPoolContext = createContext<EcoPoolContextType | undefined>(undefined);

const STORAGE_PREFIX = 'ecopool_v1_';

export const EcoPoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Role switcher
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem(`${STORAGE_PREFIX}role`) as UserRole) || 'buyer';
  });

  // State initialization with localStorage persistence
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}campaigns`);
    return saved ? JSON.parse(saved) : initialCampaigns;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}suppliers`);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [buyerProfiles] = useState<BuyerProfile[]>(initialBuyerProfiles);

  const [groupingDemands, setGroupingDemands] = useState<GroupingDemand[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}demands`);
    return saved ? JSON.parse(saved) : initialGroupingDemands;
  });

  const [opportunities, setOpportunities] = useState<AggregationOpportunity[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}opportunities`);
    return saved ? JSON.parse(saved) : initialAggregationOpportunities;
  });

  const [orders, setOrders] = useState<OrderReservation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}orders`);
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [hubInventory, setHubInventory] = useState<HubInventoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}hub`);
    return saved ? JSON.parse(saved) : initialHubInventory;
  });

  const [economicConfig, setEconomicConfig] = useState<PlatformEconomicConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}economics`);
    return saved ? JSON.parse(saved) : initialEconomicConfig;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}notifs`);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Active user entity
  const currentBuyer = buyerProfiles[0]; // Laboratoires Botanica France
  const currentSupplier = suppliers[0]; // Plastinnov Normandie

  // Persist state updates
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}role`, userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}campaigns`, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}demands`, JSON.stringify(groupingDemands));
  }, [groupingDemands]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}opportunities`, JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}hub`, JSON.stringify(hubInventory));
  }, [hubInventory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}economics`, JSON.stringify(economicConfig));
  }, [economicConfig]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}notifs`, JSON.stringify(notifications));
  }, [notifications]);

  // Helper for price and savings calculations
  const calculateSavings = (campaign: Campaign, quantity: number) => {
    const projectedTotalVolume = campaign.reservedVolume + quantity;
    
    // Find matching tier
    let unitPrice = campaign.currentUnitPrice;
    const sortedTiers = [...campaign.priceTiers].sort((a, b) => b.volume - a.volume);
    for (const tier of sortedTiers) {
      if (projectedTotalVolume >= tier.volume) {
        unitPrice = tier.unitPrice;
        break;
      }
    }

    const goodsTotal = quantity * unitPrice;
    const soloTotal = quantity * campaign.marketSoloPrice;
    const ecopoolFee = Math.round(goodsTotal * (economicConfig.commissionRatePct / 100) * 100) / 100;
    const logisticsEst = Math.round(quantity * campaign.logisticsConditions.estimatedHubShippingCostPerUnit * 100) / 100;
    const totalAmount = Math.round((goodsTotal + ecopoolFee + logisticsEst) * 100) / 100;
    const savingsEuro = Math.round((soloTotal - goodsTotal) * 100) / 100;
    const savingsPct = Math.round(((soloTotal - goodsTotal) / soloTotal) * 1000) / 10;

    return {
      soloTotal,
      groupTotal: goodsTotal,
      goodsTotal,
      savingsEuro,
      savingsPct,
      applicableUnitPrice: unitPrice,
      ecopoolFee,
      logisticsEst,
      totalAmount
    };
  };

  // Join Campaign
  const joinCampaign = (campaignId: string, quantity: number, notes?: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return { success: false, message: 'Campagne introuvable.' };
    }

    if (quantity <= 0) {
      return { success: false, message: 'La quantité doit être supérieure à 0.' };
    }

    const { applicableUnitPrice, goodsTotal, ecopoolFee, logisticsEst, totalAmount } = calculateSavings(campaign, quantity);
    const newReservedVolume = campaign.reservedVolume + quantity;

    // Check status transition
    let newStatus = campaign.status;
    if (newReservedVolume >= campaign.moq && campaign.status !== 'moq_atteinte' && campaign.status !== 'objectif_atteint' && campaign.status !== 'production') {
      newStatus = newReservedVolume >= campaign.targetVolume ? 'objectif_atteint' : 'moq_atteinte';
    } else if (newReservedVolume >= campaign.moq * 0.8 && campaign.status === 'ouverte') {
      newStatus = 'presque_financee';
    }

    const participantId = `part-${Date.now()}`;
    const newParticipant = {
      id: participantId,
      buyerId: currentBuyer.id,
      buyerName: currentBuyer.contactName,
      companyName: currentBuyer.companyName,
      sector: currentBuyer.sector,
      quantity,
      unitPricePaid: applicableUnitPrice,
      totalAmount,
      reservedAt: new Date().toISOString().slice(0, 10),
      escrowStatus: 'secured_in_escrow' as const,
      deliveryStatus: 'en_attente' as const
    };

    const updatedCampaign: Campaign = {
      ...campaign,
      reservedVolume: newReservedVolume,
      participantsCount: campaign.participantsCount + 1,
      currentUnitPrice: applicableUnitPrice,
      status: newStatus,
      participants: [newParticipant, ...campaign.participants]
    };

    setCampaigns(prev => prev.map(c => c.id === campaignId ? updatedCampaign : c));

    // Create Order Record
    const orderId = `ord-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: OrderReservation = {
      id: orderId,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      buyerId: currentBuyer.id,
      companyName: currentBuyer.companyName,
      productName: campaign.product.name,
      quantity,
      unitPrice: applicableUnitPrice,
      goodsTotal,
      ecopoolFee,
      logisticsFee: logisticsEst,
      totalTTC: totalAmount,
      escrowStatus: 'paiement_securise',
      paymentMethod: 'prelevement_sepa_b2b',
      reservedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      hubTrackingNumber: `HUB-NRM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      finalTrackingNumber: `ECO-EXP-${Math.floor(10000 + Math.random() * 90000)}`,
      logisticsStep: 'reception_hub'
    };

    setOrders(prev => [newOrder, ...prev]);

    // Send notification
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      title: 'Réservation B2B validée !',
      message: `Votre commande de ${quantity.toLocaleString()} unités pour "${campaign.title}" est sécurisée en Escrow EcoPool. Montant total : ${totalAmount.toLocaleString()} € TTC.`,
      type: 'success',
      timestamp: 'À l’instant',
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, orderId, message: 'Réservation enregistrée avec succès.' };
  };

  // Create Campaign
  const createCampaign = (campaignData: Omit<Campaign, 'id' | 'reservedVolume' | 'participantsCount' | 'participants'>) => {
    const newCampaign: Campaign = {
      ...campaignData,
      id: `camp-${Date.now()}`,
      reservedVolume: 0,
      participantsCount: 0,
      participants: []
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Nouvelle campagne ouverte !',
        message: `La campagne "${newCampaign.title}" est maintenant active sur la plateforme.`,
        type: 'info',
        timestamp: 'À l’instant',
        read: false
      },
      ...prev
    ]);
  };

  // Update Campaign Status
  const updateCampaignStatus = (campaignId: string, status: CampaignStatus) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status } : c));
  };

  // Submit Buyer Demand (feeds the grouping engine)
  const submitCustomDemand = (demandData: Omit<GroupingDemand, 'id' | 'submittedAt' | 'status'>) => {
    const newDemand: GroupingDemand = {
      ...demandData,
      id: `dem-${Date.now()}`,
      submittedAt: new Date().toISOString().slice(0, 10),
      status: 'pending'
    };

    const updatedDemands = [newDemand, ...groupingDemands];
    setGroupingDemands(updatedDemands);

    // Algorithmic check: Check if compatible demands reach an industrial MOQ
    const compatible = updatedDemands.filter(d => 
      d.status === 'pending' && 
      d.format.toLowerCase().includes('250')
    );

    const totalVolume = compatible.reduce((acc, curr) => acc + curr.desiredQuantity, 0);

    if (totalVolume >= 50000) {
      // Find or update opportunity
      setOpportunities(prev => {
        const existing = prev.find(o => o.id === 'opp-01');
        if (existing) {
          return prev.map(o => o.id === 'opp-01' ? {
            ...o,
            aggregatedQuantity: totalVolume,
            demandCount: compatible.length,
            compatibleDemands: compatible,
            status: 'moq_reached_ready'
          } : o);
        }
        return prev;
      });

      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: '⚡ Seuil MOQ industriel franchi !',
          message: `L’agrégation de vos besoins avec les autres PME totalise désormais ${totalVolume.toLocaleString()} unités. Le groupage est prêt à être transformé en campagne.`,
          type: 'success',
          timestamp: 'À l’instant',
          read: false
        },
        ...prev
      ]);
    }
  };

  // Convert Aggregation Opportunity into a full Campaign
  const convertOpportunityToCampaign = (oppId: string): Campaign | null => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return null;

    const matchedSupplier = suppliers[0]; // Plastinnov Normandie

    const newCamp: Campaign = {
      id: `camp-pooled-${Date.now()}`,
      title: opp.productTitle,
      subtitle: `Campagne générée automatiquement suite à l'agrégation de ${opp.demandCount} PME compatibles. MOQ industrielle de ${opp.requiredMOQ.toLocaleString()} u validée.`,
      featured: true,
      product: {
        id: `prod-pooled-${Date.now()}`,
        name: opp.productTitle,
        category: 'packaging',
        subCategory: 'flacons',
        material: opp.material,
        recycledPercentage: 100,
        capacity: '250 ml',
        neckFinish: '24/410 Standard',
        color: 'Naturel / Blanc opaque',
        weightGrams: 24,
        foodCosmeticGrade: true,
        recyclabilityIndex: '100% Recyclable (Code 2 HDPE)',
        originCountry: 'France',
        co2SavedPerUnitGrams: 48,
        virginPlasticAvoidedGrams: 24,
        photos: [
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
        ]
      },
      supplier: matchedSupplier,
      moq: opp.requiredMOQ,
      targetVolume: Math.round(opp.requiredMOQ * 1.2),
      maxVolume: opp.requiredMOQ * 2,
      reservedVolume: opp.aggregatedQuantity,
      participantsCount: opp.demandCount,
      currentUnitPrice: opp.potentialUnitPrice,
      marketSoloPrice: 1.38,
      priceTiers: [
        { volume: opp.requiredMOQ, unitPrice: opp.potentialUnitPrice, discountPct: opp.estimatedSavingsPct, label: 'Palier MOQ' },
        { volume: Math.round(opp.requiredMOQ * 1.2), unitPrice: 0.74, discountPct: 46.3, label: 'Palier Optimal' },
        { volume: Math.round(opp.requiredMOQ * 1.5), unitPrice: 0.68, discountPct: 50.7, label: 'Palier Super-Volume' }
      ],
      certifications: matchedSupplier.certifications,
      status: 'moq_atteinte',
      opensAt: new Date().toISOString().slice(0, 10),
      closesAt: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      estimatedProductionDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      estimatedDeliveryDate: new Date(Date.now() + 55 * 86400000).toISOString().slice(0, 10),
      logisticsConditions: {
        hubLocation: 'Hub Central EcoPool Normandie (Rouen)',
        packagingUnit: 'Carton double cannelure',
        boxesPerPallet: 24,
        unitsPerBox: 250,
        estimatedHubShippingCostPerUnit: 0.04
      },
      paymentTerms: 'Séquestre Escrow B2B certifié EcoPool',
      ecopoolFeePct: economicConfig.commissionRatePct,
      participants: opp.compatibleDemands.map((dem, idx) => ({
        id: `part-pooled-${idx}`,
        buyerId: dem.buyerId,
        buyerName: `Responsable Achats (${dem.companyName})`,
        companyName: dem.companyName,
        sector: dem.sector,
        quantity: dem.desiredQuantity,
        unitPricePaid: opp.potentialUnitPrice,
        totalAmount: dem.desiredQuantity * opp.potentialUnitPrice,
        reservedAt: new Date().toISOString().slice(0, 10),
        escrowStatus: 'secured_in_escrow',
        deliveryStatus: 'en_attente'
      }))
    };

    // Update opportunity status
    setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, status: 'converted_to_campaign' } : o));
    
    // Add campaign
    setCampaigns(prev => [newCamp, ...prev]);

    // Mark demands as pooled
    setGroupingDemands(prev => prev.map(d => 
      opp.compatibleDemands.some(cd => cd.id === d.id) ? { ...d, status: 'pooled' } : d
    ));

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: '🎉 Campagne créée par groupage !',
        message: `La campagne "${newCamp.title}" a été lancée avec ${opp.aggregatedQuantity.toLocaleString()} unités d’emblée. Statut : MOQ Atteinte.`,
        type: 'success',
        timestamp: 'À l’instant',
        read: false
      },
      ...prev
    ]);

    return newCamp;
  };

  // Supplier KYB Status
  const updateSupplierStatus = (supplierId: string, status: SupplierStatus) => {
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, status } : s));
  };

  // Certification Audit status
  const updateCertificationStatus = (supplierId: string, certId: string, status: CertificationStatus) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id !== supplierId) return s;
      return {
        ...s,
        certifications: s.certifications.map(c => c.id === certId ? { ...c, status, lastAuditDate: new Date().toISOString().slice(0, 10) } : c)
      };
    }));
  };

  // Logistics tracking step
  const updateLogisticsStep = (orderId: string, step: OrderReservation['logisticsStep']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, logisticsStep: step } : o));
  };

  // Hub QA status
  const updateHubItemStatus = (itemId: string, status: HubInventoryItem['dispatchStatus']) => {
    setHubInventory(prev => prev.map(h => h.id === itemId ? { ...h, dispatchStatus: status } : h));
  };

  // Economic configuration
  const updateCommissionRate = (ratePct: number) => {
    setEconomicConfig(prev => ({ ...prev, commissionRatePct: ratePct }));
  };

  const updateSubscriptionPrice = (planId: string, newPrice: number) => {
    setEconomicConfig(prev => ({
      ...prev,
      subscriptionPlans: prev.subscriptionPlans.map(p => p.id === planId ? { ...p, monthlyPriceEuro: newPrice } : p)
    }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <EcoPoolContext.Provider
      value={{
        userRole,
        setUserRole,
        currentBuyer,
        currentSupplier,
        campaigns,
        suppliers,
        buyerProfiles,
        groupingDemands,
        opportunities,
        orders,
        hubInventory,
        economicConfig,
        notifications,
        joinCampaign,
        createCampaign,
        updateCampaignStatus,
        submitCustomDemand,
        convertOpportunityToCampaign,
        updateSupplierStatus,
        updateCertificationStatus,
        updateLogisticsStep,
        updateHubItemStatus,
        updateCommissionRate,
        updateSubscriptionPrice,
        markNotificationRead,
        calculateSavings
      }}
    >
      {children}
    </EcoPoolContext.Provider>
  );
};

export const useEcoPool = () => {
  const context = useContext(EcoPoolContext);
  if (!context) {
    throw new Error('useEcoPool must be used within an EcoPoolProvider');
  }
  return context;
};
