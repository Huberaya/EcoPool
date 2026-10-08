import fs from 'fs';
import path from 'path';
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

export interface PlatformState {
  campaigns: Campaign[];
  suppliers: Supplier[];
  buyerProfiles: BuyerProfile[];
  groupingDemands: GroupingDemand[];
  opportunities: AggregationOpportunity[];
  orders: OrderReservation[];
  hubInventory: HubInventoryItem[];
  economicConfig: PlatformEconomicConfig;
  notifications: SystemNotification[];
  lastUpdated: string;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'ecopool-db.json');

function getDefaultState(): PlatformState {
  return {
    campaigns: initialCampaigns,
    suppliers: initialSuppliers,
    buyerProfiles: initialBuyerProfiles,
    groupingDemands: initialGroupingDemands,
    opportunities: initialAggregationOpportunities,
    orders: initialOrders,
    hubInventory: initialHubInventory,
    economicConfig: initialEconomicConfig,
    notifications: initialNotifications,
    lastUpdated: new Date().toISOString()
  };
}

let currentState: PlatformState = getDefaultState();
let isInitialized = false;

export function initDatabase(): PlatformState {
  if (isInitialized) return currentState;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.campaigns)) {
        currentState = parsed;
        console.log(`[EcoPool DB] Loaded persistent database from disk (${currentState.campaigns.length} campaigns, ${currentState.orders.length} orders).`);
        isInitialized = true;
        return currentState;
      }
    }

    // Seed file if not present
    currentState = getDefaultState();
    fs.writeFileSync(DB_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
    console.log(`[EcoPool DB] Initialized new persistent database at ${DB_FILE}`);
  } catch (err) {
    console.warn('[EcoPool DB] Error reading database file, using default seed state:', err);
    currentState = getDefaultState();
  }

  isInitialized = true;
  return currentState;
}

let saveTimer: NodeJS.Timeout | null = null;

export function saveDatabase(immediate: boolean = false): void {
  currentState.lastUpdated = new Date().toISOString();
  if (saveTimer) clearTimeout(saveTimer);

  const doSave = () => {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const tempFile = path.resolve(DB_DIR, `ecopool-db-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.tmp`);
      fs.writeFileSync(tempFile, JSON.stringify(currentState, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE); // Atomic replace sous POSIX / Linux
      // Atomic write successful
    } catch (err) {
      console.error('[EcoPool DB] Failed to save state to disk atomically:', err);
    }
  };

  if (immediate) {
    doSave();
  } else {
    saveTimer = setTimeout(doSave, 80);
  }
}

export function getState(): PlatformState {
  if (!isInitialized) initDatabase();
  return currentState;
}

export function setState(newState: Partial<PlatformState>): PlatformState {
  currentState = {
    ...currentState,
    ...newState,
    lastUpdated: new Date().toISOString()
  };
  saveDatabase();
  return currentState;
}

export function resetDatabase(): PlatformState {
  currentState = getDefaultState();
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(currentState, null, 2), 'utf-8');
    console.log('[EcoPool DB] Database reset to default seed data.');
  } catch (err) {
    console.error('[EcoPool DB] Failed to write reset database:', err);
  }
  return currentState;
}
