import React, { useState, useEffect } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { 
  Database, 
  RefreshCw, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Leaf, 
  Lock, 
  FileSpreadsheet, 
  Search, 
  Zap, 
  X, 
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  apiCheckHealth, 
  apiLookupCompany, 
  apiComputeCarbonImpact, 
  apiGenerateVirtualEscrow, 
  apiSimulateEscrowPayment 
} from '../services/apiService';
import { CompanyLookupResult, CarbonComputeResult, VirtualEscrowAccount } from '../types';

interface PersistenceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersistenceHubModal: React.FC<PersistenceHubModalProps> = ({ isOpen, onClose }) => {
  const { 
    syncStatus, 
    lastSyncedAt, 
    refreshSync, 
    restoreFullBackup, 
    resetPlatformData,
    campaigns, 
    orders, 
    suppliers, 
    groupingDemands,
    economicConfig
  } = useEcoPool();

  const [activeTab, setActiveTab] = useState<'sync' | 'sirene' | 'carbon' | 'escrow' | 'exports'>('sync');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Tab 2: SIRENE lookup state
  const [sireneQuery, setSireneQuery] = useState('Botanica');
  const [sireneResults, setSireneResults] = useState<CompanyLookupResult[]>([]);
  const [isSearchingSirene, setIsSearchingSirene] = useState(false);

  // Tab 3: ADEME Carbon compute state
  const [carbonMaterial, setCarbonMaterial] = useState('rpet');
  const [carbonQty, setCarbonQty] = useState(50000);
  const [carbonWeight, setCarbonWeight] = useState(28);
  const [carbonResult, setCarbonResult] = useState<CarbonComputeResult | null>(null);
  const [isComputingCarbon, setIsComputingCarbon] = useState(false);

  // Tab 4: Escrow simulation state
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || 'ord-881');
  const [virtualAccount, setVirtualAccount] = useState<VirtualEscrowAccount | null>(null);
  const [isGeneratingVa, setIsGeneratingVa] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Check health on open
  useEffect(() => {
    if (isOpen) {
      const t0 = performance.now();
      apiCheckHealth().then(() => {
        setLatencyMs(Math.round(performance.now() - t0));
      });
      // Initial Sirene test query
      handleSireneSearch('Botanica');
      // Initial Carbon compute
      handleComputeCarbon('rpet', 50000, 28);
      // Generate VA for default order
      if (orders[0]) {
        handleGenerateVa(orders[0].id, orders[0].totalTTC);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsRefreshing(true);
    const t0 = performance.now();
    await refreshSync();
    setLatencyMs(Math.round(performance.now() - t0));
    setIsRefreshing(false);
    setActionMessage({ text: 'Synchronisation avec le serveur Express Node.js effectuée !', type: 'success' });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup/export';
    setActionMessage({ text: 'Téléchargement de la base de données JSON en cours...', type: 'info' });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const ok = await restoreFullBackup(json);
        if (ok) {
          setActionMessage({ text: 'Restauration complète effectuée avec succès !', type: 'success' });
        } else {
          setActionMessage({ text: 'Erreur lors de la restauration du fichier.', type: 'error' });
        }
      } catch {
        setActionMessage({ text: 'Fichier JSON invalide.', type: 'error' });
      }
      setTimeout(() => setActionMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (confirm('Réinitialiser la base de données aux valeurs usine initiales ?')) {
      const ok = await resetPlatformData();
      if (ok) {
        setActionMessage({ text: 'Base de données réinitialisée avec succès.', type: 'info' });
      }
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleSireneSearch = async (term: string) => {
    setIsSearchingSirene(true);
    const results = await apiLookupCompany(term);
    setSireneResults(results);
    setIsSearchingSirene(false);
  };

  const handleComputeCarbon = async (mat: string, qty: number, weight: number) => {
    setIsComputingCarbon(true);
    const result = await apiComputeCarbonImpact(mat, qty, weight);
    setCarbonResult(result);
    setIsComputingCarbon(false);
  };

  const handleGenerateVa = async (orderId: string, amount: number) => {
    setIsGeneratingVa(true);
    const va = await apiGenerateVirtualEscrow(orderId, amount);
    setVirtualAccount(va);
    setIsGeneratingVa(false);
  };

  const handleSimulatePaymentWebhook = async () => {
    if (!selectedOrderId) return;
    setIsSimulatingPayment(true);
    const matchingOrder = orders.find(o => o.id === selectedOrderId);
    const amount = matchingOrder ? matchingOrder.totalTTC : 24696;
    const res = await apiSimulateEscrowPayment(selectedOrderId, amount, 'sepa_instant', `SIM-SEPA-${Date.now().toString().slice(-6)}`);
    setIsSimulatingPayment(false);

    if (res.success) {
      await refreshSync();
      setActionMessage({ 
        text: `Virement SEPA instantané de ${amount.toLocaleString()} € validé par le webhook bancaire ! Fonds cantonnés en séquestre.`, 
        type: 'success' 
      });
    } else {
      setActionMessage({ text: res.message || 'Erreur webhook', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-slate-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Centre de Persistance & Intégrations Réelles B2B</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  syncStatus === 'online' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : syncStatus === 'syncing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    syncStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`} />
                  {syncStatus === 'online' ? 'API Serveur Live' : syncStatus === 'syncing' ? 'Synchronisation...' : 'Cache Local'}
                </span>
              </div>
              <p className="text-xs text-slate-400">REST API Express, Base JSON persistante, API INSEE/SIRENE, ADEME Base Empreinte & Séquestre ACPR</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex gap-2 overflow-x-auto text-xs">
          {[
            { id: 'sync', label: '1. Persistance & DB', icon: Database },
            { id: 'sirene', label: '2. Registre INSEE / SIRENE', icon: Building2 },
            { id: 'carbon', label: '3. Moteur ADEME Carbone', icon: Leaf },
            { id: 'escrow', label: '4. Passerelle Séquestre & Webhooks', icon: Lock },
            { id: 'exports', label: '5. Exports ERP & CSRD', icon: FileSpreadsheet },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Notice Alert */}
        {actionMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : actionMessage.type === 'error'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">

          {/* TAB 1: PERSISTANCE & SYNCHRO BASE */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                  <span className="text-slate-400 text-xs block">Campagnes Persistées</span>
                  <strong className="text-xl text-white font-mono mt-1 block">{campaigns.length}</strong>
                  <span className="text-[10px] text-emerald-400">Stockage JSON Node.js</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                  <span className="text-slate-400 text-xs block">Commandes & PO Actifs</span>
                  <strong className="text-xl text-white font-mono mt-1 block">{orders.length}</strong>
                  <span className="text-[10px] text-blue-400">Contrats tripartites eIDAS</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                  <span className="text-slate-400 text-xs block">Total Séquestre Bloqué</span>
                  <strong className="text-xl text-emerald-400 font-mono mt-1 block">
                    {Math.round(orders.reduce((sum, o) => sum + (o.totalTTC || 0), 0)).toLocaleString()} €
                  </strong>
                  <span className="text-[10px] text-slate-400">Fonds cantonnés</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                  <span className="text-slate-400 text-xs block">Latence Serveur</span>
                  <strong className="text-xl text-white font-mono mt-1 block">{latencyMs !== null ? `${latencyMs} ms` : '—'}</strong>
                  <span className="text-[10px] text-emerald-400">Port 3000 REST API</span>
                </div>
              </div>

              {/* Status Details */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Fichier de stockage serveur :</span>
                  <span className="font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    /data/ecopool-db.json
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Dernière synchronisation client-serveur :</span>
                  <span className="font-mono text-slate-200">{lastSyncedAt || 'En attente'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Stratégie de persistance :</span>
                  <span className="text-slate-300">Écriture atomique fs + Débounce 200ms + Cache client localStorage</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <button
                  onClick={handleManualSync}
                  disabled={isRefreshing}
                  className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors text-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Forcer la Synchro API
                </button>

                <button
                  onClick={handleDownloadBackup}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  Exporter JSON DB
                </button>

                <label className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs">
                  <Upload className="w-4 h-4 text-purple-400" />
                  Restaurer Fichier JSON
                  <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
                </label>

                <button
                  onClick={handleResetData}
                  className="px-4 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  Réinitialiser DB Usine
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VÉRIFICATION ENTREPRISE SIRENE / INSEE / RNE */}
          {activeTab === 'sirene' && (
            <div className="space-y-5">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  API Recherche d'Entreprises Officielle (recherche-entreprises.api.gouv.fr)
                </div>
                <p className="text-xs text-slate-400">
                  Interrogation en direct du Registre National des Entreprises (RNE) et de la base SIRENE de l'INSEE. 
                  Vérification instantanée de l'existence juridique des acheteurs B2B et des fabricants.
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={sireneQuery}
                    onChange={e => setSireneQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSireneSearch(sireneQuery)}
                    placeholder="Tapez un nom d'entreprise ou un SIREN (ex: Botanica, L'Oréal, Plastinnov, 521948210)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={() => handleSireneSearch(sireneQuery)}
                  disabled={isSearchingSirene}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isSearchingSirene ? 'Recherche...' : 'Vérifier'}
                </button>
              </div>

              {/* Results List */}
              <div className="space-y-3">
                <span className="text-xs text-slate-400 font-semibold block">
                  Résultats officiels trouvés ({sireneResults.length}) :
                </span>

                {sireneResults.map((company, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{company.companyName}</h4>
                          {company.tradeName && company.tradeName !== company.companyName && (
                            <span className="text-slate-400 text-xs">({company.tradeName})</span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            company.isActive 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}>
                            {company.isActive ? '🟢 Active au RNE' : '🔴 Cessée'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {company.street}, {company.postalCode} {company.city}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-400 block">TVA Intracommunautaire</span>
                        <span className="font-mono text-xs text-emerald-400 font-bold">{company.vatNumber || 'Calculée'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-850 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">SIREN :</span>
                        <strong className="text-slate-200 font-mono">{company.siren}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Code NAF / APE :</span>
                        <strong className="text-slate-200 font-mono">{company.nafCode}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Taille Entreprise :</span>
                        <strong className="text-slate-200">{company.companySize || 'PME'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Éligibilité RSE :</span>
                        <strong className="text-emerald-400 font-semibold">
                          {company.isMissionDriven ? '🌱 Société à Mission' : '✅ Vérifiée B2B'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MOTEUR ADEME CARBONE & SCOPE 3 */}
          {activeTab === 'carbon' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <Leaf className="w-3.5 h-3.5" />
                  Calculateur Conforme ADEME Base Empreinte & Norme GHG Protocol Scope 3
                </div>
                <p className="text-xs text-slate-400">
                  Modélisation de l'empreinte carbone évitée par comparaison directe entre résine/matière vierge fossile et matière 100% recyclée/écoresponsable certifiée.
                </p>
              </div>

              {/* Calculator Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block text-xs mb-1">Matière Écoresponsable :</label>
                  <select
                    value={carbonMaterial}
                    onChange={e => {
                      setCarbonMaterial(e.target.value);
                      handleComputeCarbon(e.target.value, carbonQty, carbonWeight);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="rpet">RPET 100% Recyclé (Plastique)</option>
                    <option value="pehd_pcr">PEHD 100% PCR Post-Consommation</option>
                    <option value="carton_fsc">Carton Kraft Recyclé FSC</option>
                    <option value="alu_recycle">Aluminium 95% Recyclé</option>
                    <option value="verre_recycle">Verre Allégé Recyclé</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block text-xs mb-1">Quantité Mutualisée (unités) :</label>
                  <input
                    type="number"
                    value={carbonQty}
                    step={5000}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setCarbonQty(v);
                      handleComputeCarbon(carbonMaterial, v, carbonWeight);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block text-xs mb-1">Poids Unitaire (grammes) :</label>
                  <input
                    type="number"
                    value={carbonWeight}
                    step={1}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setCarbonWeight(v);
                      handleComputeCarbon(carbonMaterial, carbonQty, v);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Results Display */}
              {carbonResult && (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                        Rapport d'Impact ADEME Certifié
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{carbonResult.material}</h3>
                      <p className="text-xs text-slate-400 font-mono">Code Référence : {carbonResult.ademeFactorCode}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-400">-{carbonResult.reductionPercentage}%</span>
                      <span className="text-[10px] text-slate-400 block uppercase">Réduction GES</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Matière Vierge Évitée</span>
                      <strong className="text-base text-white font-mono">{carbonResult.virginPlasticAvoidedKg.toLocaleString()} kg</strong>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">CO2e Évité (Scope 3)</span>
                      <strong className="text-base text-emerald-400 font-mono">{carbonResult.avoidedKgCO2e.toLocaleString()} kg</strong>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Eau Économisée</span>
                      <strong className="text-base text-blue-400 font-mono">{carbonResult.waterSavedLiters.toLocaleString()} L</strong>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Équivalent Voitures</span>
                      <strong className="text-base text-purple-400 font-mono">{carbonResult.carKmEquivalent.toLocaleString()} km</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PASSERELLE SÉQUESTRE & SIMULATEUR DE WEBHOOK */}
          {activeTab === 'escrow' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  Passerelle de Paiement Séquestre B2B (Compte de Cantonnement Conforme ACPR)
                </div>
                <p className="text-xs text-slate-400">
                  Génération d'IBAN virtuels dédiés par commande pour les virements SEPA Instantanés des PME, et simulateur de webhook bancaire pour tester les flux en direct.
                </p>
              </div>

              {/* Order Selector */}
              <div>
                <label className="text-slate-300 font-semibold block text-xs mb-1">Sélectionner une commande active :</label>
                <select
                  value={selectedOrderId}
                  onChange={e => {
                    setSelectedOrderId(e.target.value);
                    const order = orders.find(o => o.id === e.target.value);
                    if (order) handleGenerateVa(order.id, order.totalTTC);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.id} — {o.productName} ({o.quantity} u) — {o.totalTTC.toLocaleString()} € TTC ({o.escrowStatus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Virtual Account Card */}
              {virtualAccount && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase block">Compte Séquestre Émis</span>
                      <h4 className="text-base font-bold text-white mt-0.5">{virtualAccount.beneficiary}</h4>
                      <p className="text-xs text-slate-400">{virtualAccount.bankName}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      SEPA Instant Compatible
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">IBAN de Cantonnement :</span>
                      <span className="text-white font-bold">{virtualAccount.iban}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">BIC / SWIFT :</span>
                      <span className="text-white font-bold">{virtualAccount.bic}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Référence Obligatoire :</span>
                      <span className="text-emerald-400 font-bold">{virtualAccount.reference}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Montant Séquestre Requis :</span>
                      <span className="text-white font-bold">{virtualAccount.escrowAmountTTC.toLocaleString()} € TTC</span>
                    </div>
                  </div>

                  {/* Simulator Button */}
                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={handleSimulatePaymentWebhook}
                      disabled={isSimulatingPayment}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
                    >
                      <Zap className={`w-4 h-4 ${isSimulatingPayment ? 'animate-bounce' : ''}`} />
                      {isSimulatingPayment ? 'Traitement du webhook bancaire...' : 'Simuler Réception Virement SEPA (Webhook Live)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EXPORTS ERP & CSRD */}
          {activeTab === 'exports' && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Passerelles d'Export Comptables ERP & Registres Durabilité
                </div>
                <p className="text-xs text-slate-400">
                  Exportation directe des écritures d'achats groupés au format standard FEC pour intégration dans SAP, Sage 100, Cegid ou Odoo, ainsi que le registre d'audit CSRD.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ERP Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Journal des Achats ERP (CSV)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Format FEC délimité par point-virgule avec comptes 601 (Matières), 622 (Commission), 44566 (TVA) et 467 (Séquestre).
                    </p>
                  </div>
                  <a
                    href="/api/integrations/export-erp"
                    download
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger CSV Compatible SAP / Sage
                  </a>
                </div>

                {/* CSRD Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Registre d'Audit CSRD Scope 3 (CSV)</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Données certifiées de GES évités, plastique vierge substitué, certificats GRS/FSC et dates d'audit pour les commissaires aux comptes.
                    </p>
                  </div>
                  <a
                    href="/api/integrations/export-csrd"
                    download
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger Bilan CSRD Conforme ADEME
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            EcoPool SAS • Moteur de persistance Node.js v22 & APIs Réelles
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
