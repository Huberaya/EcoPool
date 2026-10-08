import { 
  Campaign, 
  OrderReservation, 
  GroupingDemand, 
  Supplier, 
  CompanyLookupResult, 
  CarbonComputeResult, 
  VirtualEscrowAccount,
  PlatformEconomicConfig,
  SystemNotification,
  HubInventoryItem,
  BuyerProfile,
  AggregationOpportunity
} from '../types';

export interface BackendState {
  campaigns: Campaign[];
  suppliers: Supplier[];
  buyerProfiles: BuyerProfile[];
  groupingDemands: GroupingDemand[];
  opportunities: AggregationOpportunity[];
  orders: OrderReservation[];
  hubInventory: HubInventoryItem[];
  economicConfig: PlatformEconomicConfig;
  notifications: SystemNotification[];
  lastUpdated?: string;
}

// 1. Fetch unified state from server
export async function apiFetchState(): Promise<BackendState | null> {
  try {
    const res = await fetch('/api/state', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[EcoPool API] State fetch failed, falling back to local cache:', err);
  }
  return null;
}

// 2. Health & DB statistics
export async function apiCheckHealth(): Promise<any> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] Health check failed:', err);
  }
  return null;
}

// 3. Join Campaign (Atomic order reservation + tripartite contract)
export async function apiJoinCampaign(
  campaignId: string, 
  quantity: number, 
  notes?: string, 
  buyerId?: string
): Promise<{ success: boolean; order?: OrderReservation; campaign?: Campaign; message?: string }> {
  try {
    const res = await fetch('/api/orders/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, quantity, notes, buyerId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] joinCampaign API call failed:', err);
  }
  return { success: false, message: 'Erreur réseau ou serveur indisponible.' };
}

// 4. Digital Signature
export async function apiSignContract(
  orderId: string, 
  signatoryName: string, 
  signatoryTitle: string
): Promise<{ success: boolean; order?: OrderReservation }> {
  try {
    const res = await fetch(`/api/orders/${orderId}/sign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatoryName, signatoryTitle })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] signContract API call failed:', err);
  }
  return { success: false };
}

// 5. Release Escrow Milestone
export async function apiReleaseMilestone(
  orderId: string, 
  milestoneStage: 1 | 2 | 3
): Promise<{ success: boolean; order?: OrderReservation }> {
  try {
    const res = await fetch(`/api/orders/${orderId}/milestone`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneStage })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] releaseMilestone API call failed:', err);
  }
  return { success: false };
}

// 6. Update Campaign Status
export async function apiUpdateCampaignStatus(
  campaignId: string, 
  status: string
): Promise<{ success: boolean; campaign?: Campaign }> {
  try {
    const res = await fetch(`/api/campaigns/${campaignId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] updateCampaignStatus API call failed:', err);
  }
  return { success: false };
}

// 7. Create Campaign
export async function apiCreateCampaign(
  campaign: Partial<Campaign>
): Promise<{ success: boolean; campaign?: Campaign }> {
  try {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] createCampaign API call failed:', err);
  }
  return { success: false };
}

// 8. Submit Demand
export async function apiSubmitDemand(
  demand: Partial<GroupingDemand>
): Promise<{ success: boolean; demand?: GroupingDemand }> {
  try {
    const res = await fetch('/api/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demand)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] submitDemand API call failed:', err);
  }
  return { success: false };
}

// 9. Convert Opportunity
export async function apiConvertOpportunity(
  oppId: string
): Promise<{ success: boolean; campaign?: Campaign }> {
  try {
    const res = await fetch(`/api/opportunities/${oppId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] convertOpportunity API call failed:', err);
  }
  return { success: false };
}

// 10. Update Supplier Certification
export async function apiUpdateSupplierCert(
  supplierId: string, 
  certId: string, 
  status: string
): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`/api/suppliers/${supplierId}/certifications/${certId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] updateSupplierCert API call failed:', err);
  }
  return { success: false };
}

// ==========================================
// REAL INTEGRATIONS CALLS
// ==========================================

// 1. Sirene / INSEE / RNE Search
export async function apiLookupCompany(query: string): Promise<CompanyLookupResult[]> {
  try {
    const res = await fetch(`/api/integrations/company-lookup?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data?.results)) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn('[EcoPool Integrations] Company lookup failed:', err);
  }
  return [];
}

// 2. ADEME Carbon Computation
export async function apiComputeCarbonImpact(
  materialCode: string, 
  quantity: number, 
  unitWeightGrams?: number
): Promise<CarbonComputeResult | null> {
  try {
    const res = await fetch('/api/integrations/carbon-compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialCode, quantity, unitWeightGrams })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[EcoPool Integrations] Carbon compute failed:', err);
  }
  return null;
}

// 3. Virtual Escrow Account Generation
export async function apiGenerateVirtualEscrow(
  orderId: string, 
  amountTTC: number
): Promise<VirtualEscrowAccount | null> {
  try {
    const res = await fetch('/api/integrations/escrow/generate-va', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amountTTC })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[EcoPool Integrations] Virtual Escrow generation failed:', err);
  }
  return null;
}

export const apiGenerateEscrowVA = apiGenerateVirtualEscrow;

// 4. Simulate Escrow Payment Webhook
export async function apiSimulateEscrowPayment(
  orderId: string, 
  amountEur: number, 
  paymentMethod: string = 'sepa_instant',
  transactionRef?: string
): Promise<{ success: boolean; message?: string; order?: OrderReservation }> {
  try {
    const res = await fetch('/api/integrations/escrow/simulate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amountEur, paymentMethod, transactionRef })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool Integrations] Simulate escrow payment failed:', err);
  }
  return { success: false, message: 'Échec de la simulation de virement bancaire.' };
}

// 5. Restore Backup
export async function apiRestoreBackup(backupData: any): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] Restore backup failed:', err);
  }
  return { success: false, message: 'Échec de la restauration.' };
}

// 6. Reset Database
export async function apiResetDatabase(): Promise<{ success: boolean; data?: BackendState }> {
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] Reset database failed:', err);
  }
  return { success: false };
}

// 7. Automated Test Runner (Option C)
export async function apiRunServerTests(): Promise<any> {
  try {
    const res = await fetch('/api/tests/run', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] Run server tests failed:', err);
  }
  return null;
}

// 8. Inject Test Fixtures (Option C)
export async function apiInjectTestFixture(fixtureType: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/tests/fixture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixtureType })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] Inject test fixture failed:', err);
  }
  return { success: false, message: 'Erreur lors de l\'injection de la fixture.' };
}

// ==========================================
// 9. PHASE 1 : CONCURRENCE ATOMIQUE & TÉLÉMÉTRIE DÉFI 1
// ==========================================

export async function apiGetConcurrencyTelemetry(): Promise<any> {
  try {
    const res = await fetch('/api/concurrency/telemetry');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] Get concurrency telemetry failed:', err);
  }
  return null;
}

export async function apiRunConcurrencyStressTest(params: {
  campaignId?: string;
  concurrencyLevel?: number;
  unitsPerOrder?: number;
  useLock?: boolean;
}): Promise<any> {
  try {
    const res = await fetch('/api/concurrency/stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] Run concurrency stress-test failed:', err);
  }
  return null;
}

export async function apiGetB2BSession(): Promise<any> {
  try {
    const res = await fetch('/api/auth/session');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[EcoPool API] Get B2B session failed:', err);
  }
  return null;
}
