import React, { useState, useEffect } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import {
  apiGetEscrowLedger,
  apiProcessBankReconciliation,
  apiReleaseEscrowMilestone,
  apiFreezeEscrowDispute,
  apiResolveEscrowDispute,
  apiGetQueueMetrics,
  apiGetQueueJobs,
  apiEnqueueJob,
  apiProcessNextJob,
  apiProcessAllJobs,
  apiClearQueueJobs,
  apiRunPhase2ValidationSuite
} from '../services/apiService';
import { sseClient, SSEMessageEvent } from '../services/sseClient';
import {
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Truck,
  Building2,
  Factory,
  FileCheck2,
  X,
  RefreshCw,
  Clock,
  Sparkles,
  Award,
  CreditCard,
  Send,
  Eye,
  Server
} from 'lucide-react';

interface Phase2ExecutionWorkbenchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase2ExecutionWorkbenchModal: React.FC<Phase2ExecutionWorkbenchModalProps> = ({
  isOpen,
  onClose
}) => {
  const { refreshSync, sseStatus } = useEcoPool();

  const [activeTab, setActiveTab] = useState<'escrow' | 'queue' | 'hub' | 'audit' | 'cert'>('escrow');

  // Escrow State
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [selectedAccountOrderId, setSelectedAccountOrderId] = useState<string>('');

  // Queue State
  const [queueMetrics, setQueueMetrics] = useState<any>(null);
  const [queueJobs, setQueueJobs] = useState<any[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Simulation forms state
  const [reconcileAmount, setReconcileAmount] = useState<number>(3500);
  const [disputeReason, setDisputeReason] = useState<string>('Écart de tolérance dimensionnelle sur le goulot (col 24/410).');
  const [newJobType, setNewJobType] = useState<string>('COMPUTE_ADEME_CARBON_AUDIT');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Validation Suite State
  const [validationReport, setValidationReport] = useState<any>(null);
  const [isValidatingSuite, setIsValidatingSuite] = useState(false);

  // Load all Phase 2 Data
  const loadAllData = async () => {
    setIsLoadingLedger(true);
    setIsLoadingQueue(true);
    try {
      const [ledger, metrics, jobs] = await Promise.all([
        apiGetEscrowLedger(),
        apiGetQueueMetrics(),
        apiGetQueueJobs(30)
      ]);
      if (ledger && ledger.success) {
        setLedgerData(ledger);
        if (!selectedAccountOrderId && ledger.accounts?.[0]) {
          setSelectedAccountOrderId(ledger.accounts[0].orderId);
        }
      }
      if (metrics && metrics.success) {
        setQueueMetrics(metrics.metrics);
      }
      if (jobs && jobs.success) {
        setQueueJobs(jobs.jobs);
      }
    } catch (err) {
      console.error('Error fetching Phase 2 data:', err);
    } finally {
      setIsLoadingLedger(false);
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      const interval = setInterval(loadAllData, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Listen to live SSE events to update UI
  useEffect(() => {
    const unsub = sseClient.subscribe('*', (evt: SSEMessageEvent) => {
      if (
        evt.event.startsWith('ESCROW_') || 
        evt.event.startsWith('JOB_') || 
        evt.event.startsWith('DISPUTE_')
      ) {
        loadAllData();
      }
    });
    return () => unsub();
  }, []);

  // Action: Bank Reconciliation Webhook
  const handleSimulateReconciliation = async () => {
    if (!selectedAccountOrderId) return;
    setActionFeedback('Exécution du webhook bancaire SEPA...');
    try {
      const res = await apiProcessBankReconciliation({
        orderId: selectedAccountOrderId,
        amountEur: reconcileAmount,
        senderIban: 'FR76 3000 4001 2345 9999 8888 77',
        senderName: 'PME Acheteuse (Virement SEPA Instant)',
        bankReference: `SEPA-INST-${Date.now().toString().slice(-6)}`
      });
      if (res && res.success) {
        setActionFeedback(`✅ ${res.message}`);
        await loadAllData();
        await refreshSync();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur : ${err?.message}`);
    }
  };

  // Action: Release Milestone
  const handleReleaseMilestone = async (stage: 1 | 2 | 3) => {
    if (!selectedAccountOrderId) return;
    setActionFeedback(`Libération conditionnelle du Jalon ${stage}...`);
    try {
      const res = await apiReleaseEscrowMilestone({
        orderId: selectedAccountOrderId,
        milestoneStage: stage,
        authorizedBy: 'Superviseur EcoPool Hub Qualité',
        notes: 'Inspection physique et visa documentaire conformes.'
      });
      if (res && res.success) {
        setActionFeedback(`✅ ${res.message}`);
        await loadAllData();
        await refreshSync();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur : ${err?.message}`);
    }
  };

  // Action: Freeze Escrow on Dispute
  const handleFreezeDispute = async () => {
    if (!selectedAccountOrderId) return;
    setActionFeedback('Activation du gel conservatoire...');
    try {
      const res = await apiFreezeEscrowDispute({
        orderId: selectedAccountOrderId,
        reason: disputeReason,
        reportedBy: 'Contrôleur Hub Qualité Rouen'
      });
      if (res && res.success) {
        setActionFeedback(`⚠️ ${res.message}`);
        await loadAllData();
        await refreshSync();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur : ${err?.message}`);
    }
  };

  // Action: Resolve Dispute
  const handleResolveDispute = async (resolution: 'refund_buyer_full' | 'refund_partial_proceed' | 'dismiss_dispute_release') => {
    if (!selectedAccountOrderId) return;
    setActionFeedback('Arbitrage en cours...');
    try {
      const res = await apiResolveEscrowDispute({
        orderId: selectedAccountOrderId,
        resolution,
        terms: {
          refundPct: resolution === 'refund_partial_proceed' ? 15 : 100,
          notes: 'Protocole d’arbitrage EcoPool SAS validé par les deux parties.',
          resolvedBy: 'Direction Juridique EcoPool'
        }
      });
      if (res && res.success) {
        setActionFeedback(`✅ ${res.message}`);
        await loadAllData();
        await refreshSync();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur : ${err?.message}`);
    }
  };

  // Action: Enqueue New Job
  const handleEnqueueJob = async () => {
    setActionFeedback('Enfilement du job...');
    try {
      let title = 'Traitement asynchrone';
      let payload = {};

      if (newJobType === 'COMPUTE_ADEME_CARBON_AUDIT') {
        title = 'Calcul Scope 3 ADEME - Lot Packaging #LOT-2026';
        payload = { materialCode: 'rpet', quantity: 25000, unitWeightGrams: 28 };
      } else if (newJobType === 'GENERATE_LEGAL_CONTRACTS_OF') {
        title = 'Génération automatique OF Usine Plastinnov (#OF-NORMANDIE-02)';
        payload = { campaignId: 'camp-01' };
      } else if (newJobType === 'DISPATCH_WEBHOOKS_AND_NOTIFICATIONS') {
        title = 'Synchronisation Webhook ERP Chorus Pro & Factur-X';
        payload = { destination: 'https://chorus-pro.gouv.fr/api/v1/invoices' };
      } else {
        title = 'Lettrage & Réconciliation bancaire de fin de journée';
        payload = { ordersCount: 5, totalEur: 34800 };
      }

      const res = await apiEnqueueJob({
        type: newJobType,
        title,
        payload,
        priority: 'high'
      });
      if (res && res.success) {
        setActionFeedback(`✅ Job #${res.job.id} ajouté à la file.`);
        await loadAllData();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur : ${err?.message}`);
    }
  };

  // Action: Process Next Job
  const handleProcessNext = async () => {
    setIsProcessingQueue(true);
    try {
      const res = await apiProcessNextJob();
      if (res && res.success) {
        setActionFeedback(res.processedJob ? `✅ Job #${res.processedJob.id} traité avec succès.` : 'ℹ️ Aucun job en attente.');
        await loadAllData();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur : ${err?.message}`);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  // Action: Process All Jobs
  const handleProcessAll = async () => {
    setIsProcessingQueue(true);
    setActionFeedback('Traitement de toute la file asynchrone...');
    try {
      const res = await apiProcessAllJobs();
      if (res && res.success) {
        setActionFeedback(`✅ ${res.processedCount} jobs traités avec succès par les workers.`);
        await loadAllData();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur : ${err?.message}`);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  // Action: Run Phase 2 Validation Suite
  const handleRunValidationSuite = async () => {
    setIsValidatingSuite(true);
    try {
      const res = await apiRunPhase2ValidationSuite();
      if (res && res.success) {
        setValidationReport(res);
        await loadAllData();
        await refreshSync();
      }
    } catch (err: any) {
      console.error('Validation suite error:', err);
    } finally {
      setIsValidatingSuite(false);
    }
  };

  if (!isOpen) return null;

  const currentAccount = ledgerData?.accounts?.find((a: any) => a.orderId === selectedAccountOrderId) || ledgerData?.accounts?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Phase 2 : Séquestre ACPR & File Asynchrone</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Industrialisation B2B
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                  sseStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sseStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  SSE Flux Direct
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cantonnement réglementé ACPR • Réconciliation SEPA automatisée • File de Jobs BullMQ • Contrôle Qualité Hub 3-Tiers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunValidationSuite}
              disabled={isValidatingSuite}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5" />
              {isValidatingSuite ? 'Audit en cours...' : 'Exécuter la Recette Phase 2'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action feedback bar */}
        {actionFeedback && (
          <div className="px-6 py-2 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-200 animate-fadeIn">
            <span className="font-mono">{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white text-xs">Fermer</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 pt-2">
          {[
            { id: 'escrow', label: '1. Grand Livre Séquestre & ACPR', icon: Lock, count: ledgerData?.summary?.activeAccountsCount },
            { id: 'queue', label: '2. File Asynchrone & Workers', icon: Cpu, count: queueMetrics?.pendingJobs },
            { id: 'hub', label: '3. Hub Logistique & Contrôle Qualité', icon: Truck },
            { id: 'audit', label: '4. Registre d\'Audit SHA-256', icon: FileCheck2, count: ledgerData?.auditLog?.length },
            { id: 'cert', label: '5. Certificat & PV de Recette', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-emerald-500 text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          
          {/* TAB 1: SÉQUESTRE ACPR */}
          {activeTab === 'escrow' && (
            <div className="space-y-6">
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Total Séquestré</span>
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold text-emerald-400">
                    {(ledgerData?.summary?.totalHeldEur || 0).toLocaleString()} €
                  </div>
                  <div className="text-[10px] text-slate-400">Fonds cantonnés ACPR</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Fonds Libérés</span>
                    <Unlock className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-blue-400">
                    {(ledgerData?.summary?.totalReleasedEur || 0).toLocaleString()} €
                  </div>
                  <div className="text-[10px] text-slate-400">Versés aux industriels</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Fonds Gelés (Litige)</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold text-amber-400">
                    {(ledgerData?.summary?.totalDisputedEur || 0).toLocaleString()} €
                  </div>
                  <div className="text-[10px] text-slate-400">Consignation protégée</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Commissions (6.5%)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-purple-400">
                    {(ledgerData?.summary?.totalCommissionEarnedEur || 0).toLocaleString()} €
                  </div>
                  <div className="text-[10px] text-slate-400">Revenus EcoPool</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Frais Logistique Hub</span>
                    <Truck className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <div className="text-lg font-bold text-teal-400">
                    {(ledgerData?.summary?.totalLogisticsAllocatedEur || 0).toLocaleString()} €
                  </div>
                  <div className="text-[10px] text-slate-400">Transport & Hub Rouen</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Sous-Comptes</span>
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-lg font-bold text-white">
                    {ledgerData?.summary?.activeAccountsCount || 0}
                  </div>
                  <div className="text-[10px] text-emerald-400">100% Cantonnement étanche</div>
                </div>
              </div>

              {/* Main Escrow Operations Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Account Selector & Account Details */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        Comptes de Cantonnement Séquestre Dédiés
                      </h3>
                      <button onClick={loadAllData} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Actualiser
                      </button>
                    </div>

                    {/* Account selection list */}
                    <div className="space-y-2">
                      {ledgerData?.accounts?.map((acc: any) => {
                        const isSelected = acc.orderId === selectedAccountOrderId;
                        return (
                          <div
                            key={acc.orderId}
                            onClick={() => setSelectedAccountOrderId(acc.orderId)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected 
                                ? 'bg-slate-800 border-emerald-500 shadow-md' 
                                : 'bg-slate-800/30 border-slate-700/60 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">#{acc.orderId.toUpperCase()}</span>
                                <span className="text-xs text-slate-300">• {acc.buyerName}</span>
                                <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                                  acc.status === 'fully_settled' ? 'bg-blue-500/20 text-blue-300' :
                                  acc.status === 'frozen_dispute' ? 'bg-rose-500/20 text-rose-300' :
                                  acc.status === 'milestone_partial_released' ? 'bg-emerald-500/20 text-emerald-300' :
                                  'bg-slate-700 text-slate-300'
                                }`}>
                                  {acc.status === 'fully_settled' ? 'Clôturé & Libéré' :
                                   acc.status === 'frozen_dispute' ? 'Gel Conservatoire' :
                                   acc.status === 'milestone_partial_released' ? 'Jalons en cours' : 'Fonds Cantonnés'}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                IBAN: {acc.virtualIban}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-emerald-400 text-sm">
                                {acc.totalOrderAmountTTC.toLocaleString()} € TTC
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Séquestré: {acc.fundsHeldEur} € | Libéré: {acc.fundsReleasedEur} €
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Account Details & Milestone Stepper */}
                  {currentAccount && (
                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                        <div>
                          <div className="text-xs text-slate-400 font-mono">DÉTAIL DU CANTONNEMENT SOUS-COMPTE</div>
                          <div className="text-base font-bold text-white">Commande #{currentAccount.orderId.toUpperCase()} — {currentAccount.buyerName}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Banque Dépositaire</span>
                          <span className="text-xs text-emerald-400 font-medium">{currentAccount.bankName}</span>
                        </div>
                      </div>

                      {/* 3 Milestones Progress */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-300">Protocole de Libération par Jalons Tripartites :</div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          
                          {/* Jalon 1 */}
                          <div className={`p-3 rounded-xl border ${
                            currentAccount.milestones.stage1Released 
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                              : 'bg-slate-800/40 border-slate-700 text-slate-400'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">Jalon 1 (30%)</span>
                              {currentAccount.milestones.stage1Released ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-[11px] leading-tight mb-2">Acompte à la commande pour approvisionnement usine.</div>
                            <span className="text-[10px] font-mono block">
                              {currentAccount.milestones.stage1Released ? 'Libéré le 01/03/2026' : 'En attente'}
                            </span>
                          </div>

                          {/* Jalon 2 */}
                          <div className={`p-3 rounded-xl border ${
                            currentAccount.milestones.stage2Released 
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                              : 'bg-slate-800/40 border-slate-700 text-slate-400'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">Jalon 2 (50%)</span>
                              {currentAccount.milestones.stage2Released ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-[11px] leading-tight mb-2">Sortie d'usine & visa contrôle qualité Hub Rouen.</div>
                            <span className="text-[10px] font-mono block">
                              {currentAccount.milestones.stage2Released ? 'Libéré le 15/03/2026' : 'Conditionné au contrôle Hub'}
                            </span>
                          </div>

                          {/* Jalon 3 */}
                          <div className={`p-3 rounded-xl border ${
                            currentAccount.milestones.stage3Released 
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                              : 'bg-slate-800/40 border-slate-700 text-slate-400'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">Jalon 3 (20%)</span>
                              {currentAccount.milestones.stage3Released ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5" />}
                            </div>
                            <div className="text-[11px] leading-tight mb-2">Livraison finale conforme chez l'acheteur. Clôture.</div>
                            <span className="text-[10px] font-mono block">
                              {currentAccount.milestones.stage3Released ? 'Séquestre débouclé' : 'Solde bloqué'}
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Dispute notification if any */}
                      {currentAccount.disputeInfo && (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs space-y-1">
                          <div className="flex items-center gap-2 font-bold text-amber-300">
                            <AlertTriangle className="w-4 h-4" />
                            GEL CONSERVATOIRE ACTIF : {currentAccount.disputeInfo.reason}
                          </div>
                          <div>Montant bloqué en consignation : {currentAccount.disputeInfo.claimAmountEur.toLocaleString()} € • Signalé par : {currentAccount.disputeInfo.reportedBy}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Escrow Actions & Simulators */}
                <div className="space-y-4">
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      Actions de Séquestre Bancaire
                    </h3>

                    {/* Simulation Virement SEPA */}
                    <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs">
                      <span className="font-semibold text-slate-200 block">1. Réconciliation SEPA Instant</span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={reconcileAmount}
                          onChange={(e) => setReconcileAmount(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          placeholder="Montant en €"
                        />
                        <button
                          onClick={handleSimulateReconciliation}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          Webhook SEPA
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400">Génère l'écriture de cantonnement et la notification temps réel.</span>
                    </div>

                    {/* Libération de Jalons */}
                    <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs">
                      <span className="font-semibold text-slate-200 block">2. Libération Conditionnelle de Jalon</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleReleaseMilestone(1)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white text-[11px] font-medium border border-slate-700 cursor-pointer"
                        >
                          Jalon 1 (30%)
                        </button>
                        <button
                          onClick={() => handleReleaseMilestone(2)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white text-[11px] font-medium border border-slate-700 cursor-pointer"
                        >
                          Jalon 2 (50%)
                        </button>
                        <button
                          onClick={() => handleReleaseMilestone(3)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white text-[11px] font-medium border border-slate-700 cursor-pointer"
                        >
                          Jalon 3 (20%)
                        </button>
                      </div>
                    </div>

                    {/* Gestion des litiges et gels */}
                    <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs">
                      <span className="font-semibold text-amber-300 block">3. Protection Litige & Gel Conservatoire</span>
                      <input
                        type="text"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        placeholder="Motif de litige..."
                      />
                      <button
                        onClick={handleFreezeDispute}
                        className="w-full py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Activer le Gel Conservatoire
                      </button>
                    </div>

                    {/* Arbitrage */}
                    <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs">
                      <span className="font-semibold text-purple-300 block">4. Protocole d'Arbitrage EcoPool</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleResolveDispute('refund_partial_proceed')}
                          className="p-1.5 rounded bg-purple-900/40 hover:bg-purple-800 border border-purple-700/50 text-[10px] text-purple-200 font-medium cursor-pointer"
                        >
                          Avoir partiel (15%)
                        </button>
                        <button
                          onClick={() => handleResolveDispute('dismiss_dispute_release')}
                          className="p-1.5 rounded bg-emerald-900/40 hover:bg-emerald-800 border border-emerald-700/50 text-[10px] text-emerald-200 font-medium cursor-pointer"
                        >
                          Lever le litige
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: FILE DE TRAITEMENT ASYNCHRONE */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              
              {/* Queue Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400">Total Jobs</div>
                  <div className="text-xl font-bold text-white">{queueMetrics?.totalJobs || 0}</div>
                  <div className="text-[10px] text-slate-400">Enregistrés</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-amber-400">En attente (Pending)</div>
                  <div className="text-xl font-bold text-amber-400">{queueMetrics?.pendingJobs || 0}</div>
                  <div className="text-[10px] text-slate-400">Queue BullMQ</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-blue-400">En cours (Active)</div>
                  <div className="text-xl font-bold text-blue-400">{queueMetrics?.processingJobs || 0}</div>
                  <div className="text-[10px] text-slate-400">{queueMetrics?.activeWorkers || 0} workers occupés</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-emerald-400">Terminés</div>
                  <div className="text-xl font-bold text-emerald-400">{queueMetrics?.completedJobs || 0}</div>
                  <div className="text-[10px] text-slate-400">Taux: {queueMetrics?.successRatePct || 100}%</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400">Latence Moyenne</div>
                  <div className="text-xl font-bold text-purple-400">{queueMetrics?.averageLatencyMs || 0} ms</div>
                  <div className="text-[10px] text-slate-400">Temps de worker</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400">Concurrence Max</div>
                  <div className="text-xl font-bold text-sky-400">3 workers</div>
                  <div className="text-[10px] text-slate-400">Pool asynchrone</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400">Uptime Engine</div>
                  <div className="text-xl font-bold text-white">{queueMetrics?.uptimeSeconds || 0}s</div>
                  <div className="text-[10px] text-emerald-400">Opérationnel</div>
                </div>
              </div>

              {/* Queue Controls Bar */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-300">Enfiler un job métier :</span>
                  <select
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  >
                    <option value="COMPUTE_ADEME_CARBON_AUDIT">1. Calcul Scope 3 ADEME (Carbone)</option>
                    <option value="GENERATE_LEGAL_CONTRACTS_OF">2. Génération OF Usine & Contrat PO</option>
                    <option value="DISPATCH_WEBHOOKS_AND_NOTIFICATIONS">3. Webhook ERP SAP & Chorus Pro</option>
                    <option value="RECONCILE_BANK_SETTLEMENT">4. Lettrage & Rapprochement Bancaire</option>
                  </select>
                  <button
                    onClick={handleEnqueueJob}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" /> Soumettre
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleProcessNext}
                    disabled={isProcessingQueue}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Cpu className="w-3 h-3" /> Traiter le prochain job
                  </button>
                  <button
                    onClick={handleProcessAll}
                    disabled={isProcessingQueue}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3 h-3" /> Traiter toute la file
                  </button>
                  <button
                    onClick={async () => {
                      await apiClearQueueJobs();
                      await loadAllData();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Purger
                  </button>
                </div>
              </div>

              {/* Jobs List */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Journal d'Exécution des Jobs Asynchrones
                </h3>

                <div className="space-y-2">
                  {queueJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            job.status === 'processing' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                            job.status === 'failed' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {job.status.toUpperCase()}
                          </span>
                          <span className="font-semibold text-white">{job.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">#{job.id}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>Type: <code className="text-slate-300">{job.type}</code></span>
                          <span>Priorité: <span className="text-slate-300 font-bold">{job.priority}</span></span>
                          {job.durationMs && <span>Durée: <span className="text-purple-300 font-mono">{job.durationMs} ms</span></span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : new Date(job.createdAt).toLocaleTimeString()}
                        </span>
                        {job.result && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            ✓ Résultat valide
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: WORKFLOW LOGISTIQUE 3-TIERS & HUB QUALITÉ */}
          {activeTab === 'hub' && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-400" />
                  Workflow Logistique 3-Tiers & Hub Rouen EcoPool
                </h3>
                <p className="text-xs text-slate-300">
                  Le modèle EcoPool regroupe les flux en amont chez le façonnier, centralise la réception au Hub de Rouen pour contrôle qualité AQL, puis dispatche les palettes personnalisées vers les acheteurs finaux.
                </p>

                {/* 3-Tier Visual Flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  
                  {/* Tier 1 */}
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
                      <Factory className="w-4 h-4" />
                      Tier 1 : Usine Fabricant
                    </div>
                    <div className="text-xs text-white font-semibold">Production Groupée & Palettisation</div>
                    <p className="text-[11px] text-slate-400">
                      Fabrication en campagne unique (ex: 50 000 flacons PCR). Émission de l'Ordre de Fabrication (OF) et lettre de voiture CMR groupée vers le Hub.
                    </p>
                    <div className="pt-2 text-[10px] text-emerald-400 font-mono">✓ Acompte 30% perçu (Jalon 1)</div>
                  </div>

                  {/* Tier 2 */}
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/40 space-y-2 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                      <Truck className="w-4 h-4" />
                      Tier 2 : Hub EcoPool Rouen
                    </div>
                    <div className="text-xs text-white font-semibold">Contrôle Qualité AQL & Échantillonnage</div>
                    <p className="text-[11px] text-slate-400">
                      Inspection dimensionnelle, test d'étanchéité goulot, vérification certificat GRS/PCR. La signature du PV conforme déclenche le versement du Jalon 2 (50%).
                    </p>
                    <button
                      onClick={() => handleReleaseMilestone(2)}
                      className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Valider PV Contrôle Hub (Jalon 2)
                    </button>
                  </div>

                  {/* Tier 3 */}
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase">
                      <Building2 className="w-4 h-4" />
                      Tier 3 : Dispatch PME Acheteuses
                    </div>
                    <div className="text-xs text-white font-semibold">Distribution Finie & Clôture Séquestre</div>
                    <p className="text-[11px] text-slate-400">
                      Éclatement du lot et livraison sur site chez chaque marque (Botanica, Léa Nature, etc.) avec BL individuel. Libération du solde 20% (Jalon 3).
                    </p>
                    <button
                      onClick={() => handleReleaseMilestone(3)}
                      className="w-full mt-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirmer Réception Finale (Jalon 3)
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REGISTRE D'AUDIT SHA-256 */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    Grand Livre d'Audit Cryptographique (SHA-256)
                  </h3>
                  <span className="text-xs text-slate-400">
                    {ledgerData?.auditLog?.length || 0} transactions non-répudiables
                  </span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {ledgerData?.auditLog?.map((rec: any) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 text-xs space-y-1.5 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.type === 'DEPOSIT_CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300' :
                          rec.type === 'MILESTONE_RELEASE' ? 'bg-blue-500/20 text-blue-300' :
                          rec.type === 'DISPUTE_FROZEN' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {rec.type}
                        </span>
                        <span className="text-slate-400 text-[10px]">{new Date(rec.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-200 text-[11px] font-sans">
                        {rec.details}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-2">
                        <span>SHA-256: <code className="text-slate-400">{rec.sha256Proof}</code></span>
                        <span>• Ref: {rec.reference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CERTIFICAT & PV DE RECETTE PHASE 2 */}
          {activeTab === 'cert' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-6">
                
                {/* Certificate Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">
                        Procès-Verbal de Recette & Conformité Industrielle Phase 2
                      </h3>
                      <p className="text-xs text-slate-400">
                        Séquestre Bancaire B2B (ACPR) • File Asynchrone de Jobs • Traçabilité Hub 3-Tiers
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRunValidationSuite}
                    disabled={isValidatingSuite}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isValidatingSuite ? 'Vérification en cours...' : 'Relancer la Suite de Tests Phase 2'}
                  </button>
                </div>

                {/* Validation Suite Results */}
                {validationReport ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-emerald-300 font-bold uppercase">Résultat Global de Validation</div>
                        <div className="text-sm font-semibold text-white">{validationReport.summary}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-emerald-400">{validationReport.complianceRatePct}%</span>
                        <span className="text-[10px] text-slate-400 block">Taux de conformité</span>
                      </div>
                    </div>

                    {/* Criteria List */}
                    <div className="space-y-2">
                      {validationReport.criteria?.map((crit: any) => (
                        <div
                          key={crit.code}
                          className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between text-xs gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-700 text-slate-300">
                                {crit.code}
                              </span>
                              <span className="font-bold text-white">{crit.title}</span>
                              <span className="text-[10px] text-slate-400">({crit.domain})</span>
                            </div>
                            <p className="text-slate-300 text-[11px]">{crit.details}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Validé ({crit.durationMs}ms)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <Award className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
                    <div className="text-sm font-semibold text-white">Aucun rapport d'audit exécuté récemment</div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Cliquez ci-dessous pour exécuter les 8 tests automatisés certifiant l'exécution complète de la Phase 2.
                    </p>
                    <button
                      onClick={handleRunValidationSuite}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Lancer la Validation Complète
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Conformité ACPR Art. L. 522-1</span>
            <span>•</span>
            <span>Architecture BullMQ Worker</span>
            <span>•</span>
            <span>Hub Rouen 3-Tiers</span>
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
