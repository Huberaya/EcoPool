import React, { useState, useEffect } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import {
  apiGetHubParcels,
  apiPerformHubQualityInspection,
  apiDispatchCmr,
  apiUpdateParcelStatus,
  apiGetHubMetrics,
  apiGetDigitalProductPassport,
  apiSealDigitalProductPassport,
  apiGetCircularSurplusListings,
  apiPostCircularSurplusListing,
  apiBuyCircularSurplus,
  apiRunPhase4ValidationSuite
} from '../services/apiService';
import { sseClient, SSEMessageEvent } from '../services/sseClient';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Send,
  Award,
  Layers,
  ArrowRight,
  TrendingDown,
  Cpu,
  Lock,
  Building2,
  Clock,
  X,
  RefreshCw,
  FileCheck2,
  Check,
  Zap,
  Globe,
  Leaf,
  QrCode,
  PackageCheck,
  Scan,
  Repeat,
  MapPin,
  ClipboardCheck,
  Tag
} from 'lucide-react';

interface Phase4ExecutionWorkbenchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase4ExecutionWorkbenchModal: React.FC<Phase4ExecutionWorkbenchModalProps> = ({
  isOpen,
  onClose
}) => {
  const { sseStatus, orders, refreshSync } = useEcoPool();

  const [activeTab, setActiveTab] = useState<'crossdocking' | 'qa_lab' | 'dpp' | 'circular_market' | 'validation'>('crossdocking');

  // Logistics & Hub Parcels State
  const [parcels, setParcels] = useState<any[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string>('');
  const [hubMetrics, setHubMetrics] = useState<any>(null);

  // QA Lab State
  const [inspectorName, setInspectorName] = useState<string>('Laurent Vasseur (Directeur QA Hub)');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('Geodis Logistique Distribution B2B');
  const [qaInspectorNotes, setQaInspectorNotes] = useState<string>('Contrôle qualité 4-points complet validé avec succès. Lot scellé conforme.');

  // DPP State
  const [currentDpp, setCurrentDpp] = useState<any>(null);
  const [isDppSealed, setIsDppSealed] = useState<boolean>(false);

  // Circular Market State
  const [surplusListings, setSurplusListings] = useState<any[]>([]);
  const [newSurplusProduct, setNewSurplusProduct] = useState<string>('Flacons 500ml PEHD 100% PCR (Col 28/400)');
  const [newSurplusQty, setNewSurplusQty] = useState<number>(2000);
  const [newSurplusPrice, setNewSurplusPrice] = useState<number>(0.65);
  const [newSurplusDiscount, setNewSurplusDiscount] = useState<number>(32);
  const [showSurplusForm, setShowSurplusForm] = useState<boolean>(false);

  // General Loading & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Validation Suite State
  const [validationReport, setValidationReport] = useState<any>(null);
  const [isValidatingSuite, setIsValidatingSuite] = useState<boolean>(false);

  // Load all Phase 4 data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [parcelsData, metricsData, surplusData] = await Promise.all([
        apiGetHubParcels(),
        apiGetHubMetrics(),
        apiGetCircularSurplusListings()
      ]);

      if (parcelsData && parcelsData.success) {
        setParcels(parcelsData.parcels);
        if (!selectedParcelId && parcelsData.parcels.length > 0) {
          setSelectedParcelId(parcelsData.parcels[0].orderId || parcelsData.parcels[0].id);
        }
      }

      if (metricsData && metricsData.success) {
        setHubMetrics(metricsData.metrics);
      }

      if (surplusData && surplusData.success) {
        setSurplusListings(surplusData.listings);
      }

      // Load DPP for initial order
      const initialOrderId = parcelsData?.parcels[0]?.orderId || orders[0]?.id || 'ord-101';
      const dppData = await apiGetDigitalProductPassport(initialOrderId);
      if (dppData && dppData.success) {
        setCurrentDpp(dppData.dpp);
      }
    } catch (err) {
      console.error('Error loading Phase 4 data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  // Listen to live SSE events
  useEffect(() => {
    const unsub = sseClient.subscribe('*', (evt: SSEMessageEvent) => {
      if (
        evt.event.startsWith('LOGISTICS_') ||
        evt.event.startsWith('HUB_') ||
        evt.event.startsWith('DPP_') ||
        evt.event.startsWith('CIRCULAR_') ||
        evt.event.startsWith('CMR_')
      ) {
        // Refresh quietly
        loadAllData();
      }
    });

    return () => {
      unsub();
    };
  }, []);

  if (!isOpen) return null;

  const selectedParcel = parcels.find(p => p.orderId === selectedParcelId || p.id === selectedParcelId) || parcels[0];

  // Actions
  const handlePerformQaInspection = async () => {
    if (!selectedParcel) return;
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const res = await apiPerformHubQualityInspection(
        selectedParcel.orderId,
        inspectorName,
        qaInspectorNotes
      );
      if (res && res.success) {
        setActionFeedback(`✅ Contrôle Qualité Hub 4-points validé avec succès pour le lot ${selectedParcel.batchNumber}. Empreinte QA scellée.`);
        await loadAllData();
      }
    } catch (err) {
      setActionFeedback('❌ Erreur lors du contrôle qualité.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatchCmr = async () => {
    if (!selectedParcel) return;
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const res = await apiDispatchCmr(selectedParcel.orderId, selectedCarrier);
      if (res && res.success) {
        setActionFeedback(`🚛 Lettre de voiture ${res.cmrDocument.cmrNumber} générée ! Expédition vers ${selectedParcel.buyerCity} en cours.`);
        await loadAllData();
      }
    } catch (err) {
      setActionFeedback('❌ Erreur lors de l\'émission de la e-CMR.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedParcel) return;
    setIsLoading(true);
    try {
      await apiUpdateParcelStatus(selectedParcel.orderId, newStatus);
      await loadAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSealDpp = async () => {
    if (!selectedParcel) return;
    setIsLoading(true);
    try {
      const res = await apiSealDigitalProductPassport(selectedParcel.orderId);
      if (res && res.success) {
        setCurrentDpp(res.dpp);
        setIsDppSealed(true);
        setActionFeedback('🛡️ Passeport Numérique du Produit (DPP) scellé avec signature cryptographique Merkle Root.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostSurplus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiPostCircularSurplusListing({
        campaignId: 'camp-1',
        sellerCompanyName: 'Laboratoires Botanica France SAS',
        sellerSiren: '428843130',
        productName: newSurplusProduct,
        materialType: 'PEHD 100% PCR',
        availableQuantity: newSurplusQty,
        originalUnitPriceEur: 0.95,
        discountedUnitPriceEur: newSurplusPrice,
        savingDiscountPct: newSurplusDiscount,
        minimumPurchaseQuantity: 250,
        locationHub: 'HUB_NORMANDIE_LE_HAVRE',
        batchNumber: `LOT-2026-N${Date.now().toString().slice(-3)}-SURPLUS`,
        certifications: ['GRS 4.0', 'EU Ecolabel']
      });

      if (res && res.success) {
        setShowSurplusForm(false);
        setActionFeedback('♻️ Reliquat circulaire mis en ligne sur la bourse secondaire avec succès !');
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuySurplus = async (listingId: string) => {
    setIsLoading(true);
    try {
      const res = await apiBuyCircularSurplus(listingId, 'Cosmétiques Végétaux de France', 500);
      if (res && res.success) {
        setActionFeedback(`🎉 Rachat de reliquat confirmé ! Séquestre alloué (${res.amountEur} €). Preuve : ${res.transactionProof.slice(0, 24)}...`);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunValidationSuite = async () => {
    setIsValidatingSuite(true);
    try {
      const res = await apiRunPhase4ValidationSuite();
      if (res && res.success) {
        setValidationReport(res);
        await refreshSync();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidatingSuite(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-900/40">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Centre de Contrôle Phase 4 : Hub Logistique 3-Tiers, DPP & Bourse Circulaire
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Norme SSCC & ESPR 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cross-docking massifié, laboratoire QA de réception, Passeport Numérique du Produit (DPP) & re-pooling circulaire
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
              <span className={`w-2 h-2 rounded-full ${sseStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{sseStatus === 'connected' ? 'Hub SSE Connecté' : 'SSE Déconnecté'}</span>
            </div>

            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Hub KPIs Micro-Banner */}
        <div className="px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Hubs Actifs : <strong className="text-white">2 (Le Havre Normandie & Fos Méditerranée)</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Colis suivis SSCC : <strong className="text-purple-300">{parcels.length} palettes / lots</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              CO₂ évité transport : <strong className="text-emerald-400">+{hubMetrics?.co2AvoidedTransportKg || 420} kg CO2e</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Massification FTL :</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
              +{hubMetrics?.transportOptimizationPct || 62.4}% d'efficacité
            </span>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-purple-400 hover:text-purple-200 text-xs font-semibold cursor-pointer"
            >
              Ignorer
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/40 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('crossdocking')}
            className={`px-3.5 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'crossdocking'
                ? 'bg-slate-800 text-purple-300 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>1. Hub Cross-Docking & Traçabilité SSCC</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300">
              {parcels.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('qa_lab')}
            className={`px-3.5 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'qa_lab'
                ? 'bg-slate-800 text-purple-300 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>2. Laboratoire Contrôle Qualité Hub</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
              4-Points
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dpp')}
            className={`px-3.5 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dpp'
                ? 'bg-slate-800 text-purple-300 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>3. Passeport Numérique Produit (DPP ESPR)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300">
              GS1 Link
            </span>
          </button>

          <button
            onClick={() => setActiveTab('circular_market')}
            className={`px-3.5 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'circular_market'
                ? 'bg-slate-800 text-purple-300 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>4. Bourse Circulaire de Reliquats</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
              {surplusListings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3.5 py-2.5 rounded-t-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'validation'
                ? 'bg-slate-800 text-purple-300 border-t-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>5. Suite de Recette & PV Phase 4</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-300">
              8/8
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: HUB CROSS-DOCKING & TRAÇABILITÉ SSCC */}
          {activeTab === 'crossdocking' && (
            <div className="space-y-6">
              
              {/* Architecture 3-Tiers Visual Stepper */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Flux Logistique 3-Tiers Massifié EcoPool
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Gain transport : <strong>{hubMetrics?.kmSaved || 1840} km évités</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        1. Usine Fabricant
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">
                        Amont
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Plastinnov Normandie (Dieppe) • Production groupée en batch FTL (38 tonnes) vers le Hub Central.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-purple-600/50 space-y-1.5 relative shadow-lg shadow-purple-950/30">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-purple-400" />
                        2. Hub Central EcoPool
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300">
                        Cross-Docking
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Le Havre (Quai 14) & Fos-sur-Mer. Réception, dépotage, contrôle qualité 4-points, étiquetage SSCC et ré-allotissement.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                        3. Réception Acheteur PME
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
                        Dernier Km
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Livraison capillaire (Geodis / Kuehne+Nagel) sur bordereau e-CMR, signature d'émargement et clôture séquestre.
                    </p>
                  </div>
                </div>
              </div>

              {/* Parcels Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* List of Parcels */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Unités de Manutention ({parcels.length})
                    </h4>
                    <span className="text-[11px] text-slate-500">Sélectionnez pour piloter</span>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {parcels.map(parcel => (
                      <div
                        key={parcel.id}
                        onClick={() => setSelectedParcelId(parcel.orderId)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          (selectedParcelId === parcel.orderId || selectedParcelId === parcel.id)
                            ? 'bg-purple-950/40 border-purple-500/80 shadow-md shadow-purple-950/40'
                            : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-purple-300">
                            {parcel.ssccBarcode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                            {parcel.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white truncate">
                          {parcel.productName}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span>{parcel.buyerName}</span>
                          <span className="text-slate-300 font-medium">{parcel.unitsCount} u. • {parcel.grossWeightKg} kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Parcel Control Center */}
                {selectedParcel && (
                  <div className="lg:col-span-2 space-y-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                            SSCC {selectedParcel.ssccBarcode}
                          </span>
                          <span className="text-xs text-slate-400">
                            Lot {selectedParcel.batchNumber}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1">
                          {selectedParcel.productName} — Destinataire : {selectedParcel.buyerName} ({selectedParcel.buyerCity})
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400">
                          {selectedParcel.hubLocation === 'HUB_NORMANDIE_LE_HAVRE' ? '📍 Hub Le Havre' : '📍 Hub Fos Méditerranée'}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Transporteur : {selectedParcel.carrierName}
                        </div>
                      </div>
                    </div>

                    {/* Barcode & GS1 Data Visual */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] block uppercase">Code GTIN-14 Produit</span>
                        <span className="font-mono font-bold text-white text-xs">{selectedParcel.gtin}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] block uppercase">Bordereau e-CMR</span>
                        <span className="font-mono font-bold text-purple-300 text-xs">{selectedParcel.cmrNumber || 'En attente'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                        <span className="text-slate-400 text-[10px] block uppercase">Contrôle Qualité Hub</span>
                        <span className="font-bold text-emerald-400 text-xs">
                          {selectedParcel.qaReport ? '✅ Conforme (4/4 tests)' : '⏳ À inspecter'}
                        </span>
                      </div>
                    </div>

                    {/* Status Changer Buttons */}
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-300 block">
                        Piloter le Changement d'Étape Logistique (Synchronisé SSE en direct) :
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'EXPEDIE_USINE_VERS_HUB', label: '1. Usine → Hub' },
                          { id: 'RECEPTIONNE_AU_HUB', label: '2. Réceptionné Hub' },
                          { id: 'CONTROLE_QUALITE_CONFORME', label: '3. QA Validé' },
                          { id: 'CROSS_DOCKING_ECLATEMENT', label: '4. Éclatement FTL' },
                          { id: 'REEXPEDIE_VERS_ACHETEUR', label: '5. En Transit PME' },
                          { id: 'LIVRE_EMARGE', label: '6. Livré Émargé' }
                        ].map(st => (
                          <button
                            key={st.id}
                            onClick={() => handleUpdateStatus(st.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              selectedParcel.status === st.id
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-900'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* e-CMR Dispatcher */}
                    <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-purple-400" />
                          Générer et Transmettre la Lettre de Voiture Électronique (e-CMR)
                        </div>
                        <p className="text-[11px] text-purple-200/80">
                          Émission du bordereau officiel avec transporteur {selectedParcel.carrierName} et notification immédiate à l'acheteur.
                        </p>
                      </div>
                      <button
                        onClick={handleDispatchCmr}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all"
                      >
                        Émettre e-CMR
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 2: LABORATOIRE CONTRÔLE QUALITÉ HUB 4-POINTS */}
          {activeTab === 'qa_lab' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    Laboratoire Qualité & Contrôle Réception Hub (Protocole 4-Points)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Chaque lot arrivant de l'usine subit une analyse physico-chimique et métrologique avant d'être éclaté pour réexpédition aux PME.
                  </p>
                </div>

                <button
                  onClick={handlePerformQaInspection}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950 transition-all shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  Exécuter Inspection 4-Points
                </button>
              </div>

              {/* 4 Test Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Point 1: Spectrométrie Infrarouge PCR */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      1. Spectrométrie Infrarouge (IR-TF) Matière PCR
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      99.6% Pureté Conforme
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Vérification de l'absence de contaminants et conformation spectrale de la résine PEHD/RPET recyclée post-consommation.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 font-mono text-[11px] text-slate-300 border border-slate-800">
                    Empreinte Spectrale : SHA256:d8b2e1...9f86d (Signature certifiée)
                  </div>
                </div>

                {/* Point 2: Tolérances Dimensionnelles Micrométriques */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Scan className="w-4 h-4 text-purple-400" />
                      2. Tolérances Dimensionnelles Bague & Col (DIN 168)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Écart ±0.03mm (Max 0.10mm)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mesure au micromètre laser du diamètre extérieur, du filet et de la hauteur pour garantir le vissage des pompes 24/410.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 font-mono text-[11px] text-slate-300 border border-slate-800">
                    Standard Vérifié : Col 24/410 • Planéité du buvant : 100% conforme
                  </div>
                </div>

                {/* Point 3: Test d'Étanchéité sous Vide */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      3. Test d'Étanchéité sous Cloche à Vide (500 mbar)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      0 Fuite Détectée (60s)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Dépression continue à 500 mbar pendant 60 secondes en immersion aqueuse. Aucun dégazage ni micro-fissure observés.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 font-mono text-[11px] text-slate-300 border border-slate-800">
                    Pression : 500 mbar • Résistance barométrique certifiée transport aérien & routier
                  </div>
                </div>

                {/* Point 4: Contrôle Visuel & Pesée Unitaire */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      4. Inspection Visuelle, Teinte & Pesée
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      0 Défaut / 1 000 pièces
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Contrôle colorimétrique spectrophotomètre (Delta E &lt; 1.2), homogénéité des parois et pesée conforme à 28.4g ± 0.5g.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 font-mono text-[11px] text-slate-300 border border-slate-800">
                    Poids moyen : 28.38g • Homogénéité optique : Conforme grade cosmétique
                  </div>
                </div>

              </div>

              {/* Inspection Certificate Preview */}
              {selectedParcel?.qaReport && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-white text-xs">
                        Procès-Verbal de Conformité Qualité Officiel — {selectedParcel.qaReport.inspectionId}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-300 font-mono">
                      Scellé le {new Date(selectedParcel.qaReport.inspectedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-200">
                    {selectedParcel.qaReport.notes} Inspecteur responsable : <strong>{selectedParcel.qaReport.inspectorName}</strong>.
                  </p>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 font-mono text-[11px] text-slate-300 border border-slate-800 flex items-center justify-between">
                    <span>Empreinte SHA-256 de Certification :</span>
                    <span className="text-emerald-400 font-bold">{selectedParcel.qaReport.complianceSealSha256}</span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: PASSEPORT NUMÉRIQUE DU PRODUIT (DPP / ESPR 2026) */}
          {activeTab === 'dpp' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-800/50 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">
                      Fiche Passeport Numérique du Produit (DPP) — Règlement Européen ESPR 2026/2027
                    </h3>
                  </div>
                  <p className="text-xs text-indigo-200/90">
                    Identifiant unique GS1 Digital Link interopérable assurant la transparence complète de la filière circulaire.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSealDpp}
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Sceller Merkle Root
                  </button>
                </div>
              </div>

              {currentDpp && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: QR Code & GS1 URI */}
                  <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-2xl bg-white text-slate-950 shadow-xl">
                      <QrCode className="w-32 h-32 text-slate-900" />
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        GS1 Digital Link URI
                      </span>
                      <a 
                        href={currentDpp.gs1DigitalLinkUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] underline break-all block"
                      >
                        {currentDpp.gs1DigitalLinkUrl}
                      </a>
                    </div>

                    <div className="w-full pt-2 border-t border-slate-700/60 space-y-2 text-left text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">GTIN :</span>
                        <strong className="text-white font-mono">{currentDpp.gtin}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lot :</span>
                        <strong className="text-white font-mono">{currentDpp.batchNumber}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Réglementation :</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          {currentDpp.esprConformityLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle & Right Column: Composition, Circularity & LCA */}
                  <div className="lg:col-span-2 space-y-4">
                    
                    {/* Material Composition Card */}
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-emerald-400" />
                        Composition Matière & Certifications Tiers
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
                          <span className="text-slate-400 text-[11px]">Résine Principale</span>
                          <div className="font-bold text-white">{currentDpp.materialComposition.primaryResin}</div>
                          <div className="text-emerald-400 font-semibold text-[11px]">
                            {currentDpp.materialComposition.recycledContentPct}% Matière Recyclée Post-Consommation (PCR)
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 space-y-1">
                          <span className="text-slate-400 text-[11px]">Labels & Conformités</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentDpp.materialComposition.certifications.map((c: string) => (
                              <span key={c} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Circularity & LCA Card */}
                    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-indigo-400" />
                        Performance Circulaire & ACV (ISO 14044)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center space-y-1">
                          <span className="text-slate-400 text-[10px] uppercase">Score Recyclabilité Citeo</span>
                          <div className="text-sm font-bold text-emerald-400">Classe A (Excellente)</div>
                          <span className="text-[10px] text-slate-500">Filière 100% recyclable</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center space-y-1">
                          <span className="text-slate-400 text-[10px] uppercase">Empreinte Unitaire</span>
                          <div className="text-sm font-bold text-purple-300">
                            {currentDpp.lifeCycleAssessment.carbonPerUnitGramsCO2e} g CO2e
                          </div>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            -{currentDpp.lifeCycleAssessment.avoidedCarbonPerUnitGramsCO2e}g vs vierge
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-center space-y-1">
                          <span className="text-slate-400 text-[10px] uppercase">Potentiel Réemploi</span>
                          <div className="text-sm font-bold text-sky-400">
                            {currentDpp.circularityMetrics.reusePotentialCycles} Cycles
                          </div>
                          <span className="text-[10px] text-slate-500">Collecte locale 120km</span>
                        </div>
                      </div>
                    </div>

                    {/* Cryptographic Signature Card */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Racine Merkle Cryptographique :</span>
                        <span className="text-indigo-400 font-bold">{currentDpp.cryptographicVerification.merkleRootHash}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans">Signature Numérique ESPR :</span>
                        <span className="text-emerald-400">{currentDpp.cryptographicVerification.digitalSignature}</span>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 4: BOURSE CIRCULAIRE DE RELIQUATS & RE-POOLING */}
          {activeTab === 'circular_market' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-amber-400" />
                    Bourse B2B de Déstockage Solidaire & Re-Pooling Circulaire
                  </h3>
                  <p className="text-xs text-slate-300">
                    Revente et rachat immédiats des reliquats de production certifiés entre membres de la communauté EcoPool.
                  </p>
                </div>

                <button
                  onClick={() => setShowSurplusForm(!showSurplusForm)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md shrink-0"
                >
                  {showSurplusForm ? 'Annuler' : '+ Déposer un Reliquat'}
                </button>
              </div>

              {/* Form to Post Surplus */}
              {showSurplusForm && (
                <form onSubmit={handlePostSurplus} className="p-4 rounded-2xl bg-slate-900 border border-amber-600/50 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Déposer une offre de surplus certifié
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Désignation Produit</label>
                      <input
                        type="text"
                        value={newSurplusProduct}
                        onChange={e => setNewSurplusProduct(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Quantité Disponible (unités)</label>
                      <input
                        type="number"
                        value={newSurplusQty}
                        onChange={e => setNewSurplusQty(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Prix Unitaire Circulaire (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newSurplusPrice}
                        onChange={e => setNewSurplusPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Décote d'opportunité (%)</label>
                      <input
                        type="number"
                        value={newSurplusDiscount}
                        onChange={e => setNewSurplusDiscount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSurplusForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Publier l'Offre
                    </button>
                  </div>
                </form>
              )}

              {/* Surplus Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {surplusListings.map(listing => (
                  <div
                    key={listing.id}
                    className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          -{listing.savingDiscountPct}% Réduction
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {listing.locationHub === 'HUB_NORMANDIE_LE_HAVRE' ? '📍 Le Havre' : '📍 Fos'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">
                        {listing.productName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Vendu par : {listing.sellerCompanyName}
                      </p>

                      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Quantité en stock :</span>
                          <strong className="text-white">{listing.availableQuantity} u.</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Prix catalogue :</span>
                          <span className="line-through text-slate-500">{listing.originalUnitPriceEur} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">Prix Circulaire :</span>
                          <strong className="text-emerald-400 font-bold text-sm">{listing.discountedUnitPriceEur} € / u</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuySurplus(listing.id)}
                      disabled={isLoading || listing.availableQuantity <= 0}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      {listing.availableQuantity > 0 ? 'Rachat Circulaire Immédiat' : 'Épuisé'}
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: SUITE DE RECETTE AUTOMATISÉE & PV PHASE 4 */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-800/50 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">
                      Suite de Recette & Certification Formelle — Phase 4 Industrielle
                    </h3>
                  </div>
                  <p className="text-xs text-purple-200/90">
                    Validation automatisée des 8 critères formels (CRIT-4.1 à CRIT-4.8) attestant de l'achèvement complet du chantier Phase 4.
                  </p>
                </div>

                <button
                  onClick={handleRunValidationSuite}
                  disabled={isValidatingSuite}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-950 transition-all shrink-0"
                >
                  <Play className={`w-4 h-4 ${isValidatingSuite ? 'animate-spin' : ''}`} />
                  {isValidatingSuite ? 'Validation en cours...' : 'Lancer la Recette Automatisée Phase 4'}
                </button>
              </div>

              {/* Report Card */}
              {validationReport ? (
                <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-5">
                  
                  {/* Official Certificate Banner */}
                  <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/50 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-white text-sm">
                          Certificat Officiel d'Exécution : {validationReport.certificateId}
                        </span>
                      </div>
                      <p className="text-xs text-purple-200 mt-1">
                        Délivré par : <strong>{validationReport.auditor}</strong> le {new Date(validationReport.issuedAt).toLocaleString('fr-FR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Conformité Globale</span>
                        <span className="text-xl font-black text-emerald-400">
                          {validationReport.complianceRatePct}%
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Temps d'exécution</span>
                        <span className="text-sm font-bold text-white font-mono">
                          {validationReport.totalDurationMs} ms
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {validationReport.summary}
                  </p>

                  {/* Criteria List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Résultats Détaillés des 8 Critères de Recette :
                    </h4>

                    {validationReport.criteria.map((c: any) => (
                      <div
                        key={c.code}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-800 text-purple-300 font-bold border border-slate-700">
                              {c.code}
                            </span>
                            <span className="font-bold text-white">{c.title}</span>
                            <span className="text-[10px] text-slate-400">({c.domain})</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{c.details}</p>
                          {c.proof && (
                            <div className="font-mono text-[10px] text-purple-400">
                              Preuve cryptographique : {c.proof}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Validé ({c.durationMs}ms)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <Award className="w-12 h-12 text-purple-400 mx-auto opacity-70" />
                  <div className="text-sm font-semibold text-white">Aucun audit de Phase 4 exécuté récemment</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Cliquez sur le bouton ci-dessus pour lancer la suite de recette validant les 8 critères formels de la Phase 4.
                  </p>
                  <button
                    onClick={handleRunValidationSuite}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Lancer la Recette Automatisée Phase 4
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Norme SSCC GS1-128</span>
            <span>•</span>
            <span>Convention e-CMR ONU</span>
            <span>•</span>
            <span>Règlement ESPR / DPP 2026</span>
            <span>•</span>
            <span>Bourse Re-Pooling</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
          >
            Fermer le Centre de Contrôle
          </button>
        </div>

      </div>
    </div>
  );
};
