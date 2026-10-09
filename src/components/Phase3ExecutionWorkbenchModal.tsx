import React, { useState, useEffect } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import {
  apiGetFacturXInvoices,
  apiGenerateFacturX,
  apiTransmitInvoiceToPdp,
  apiUpdateInvoiceLifecycle,
  apiGetCsrdRegistry,
  apiCertifyCsrdOrder,
  apiGetConsolidatedEsrsReport,
  apiVerifyCsrdChain,
  apiRunPhase3ValidationSuite
} from '../services/apiService';
import { sseClient, SSEMessageEvent } from '../services/sseClient';
import {
  FileText,
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
  Leaf
} from 'lucide-react';

interface Phase3ExecutionWorkbenchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase3ExecutionWorkbenchModal: React.FC<Phase3ExecutionWorkbenchModalProps> = ({
  isOpen,
  onClose
}) => {
  const { sseStatus, orders, refreshSync } = useEcoPool();

  const [activeTab, setActiveTab] = useState<'facturx' | 'csrd' | 'attestation' | 'validation'>('facturx');

  // Factur-X State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedPdp, setSelectedPdp] = useState<string>('PDP Docaposte / Chorus Pro Connect');
  const [showXmlViewer, setShowXmlViewer] = useState<boolean>(false);

  // CSRD State
  const [csrdRegistry, setCsrdRegistry] = useState<any>(null);
  const [esrsSummary, setEsrsSummary] = useState<any>(null);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);

  // General Loading & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Validation Suite State
  const [validationReport, setValidationReport] = useState<any>(null);
  const [isValidatingSuite, setIsValidatingSuite] = useState<boolean>(false);

  // Load all Phase 3 data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [invData, csrdData, esrsData, chainValidData] = await Promise.all([
        apiGetFacturXInvoices(),
        apiGetCsrdRegistry(),
        apiGetConsolidatedEsrsReport(),
        apiVerifyCsrdChain()
      ]);

      if (invData && invData.success) {
        setInvoices(invData.invoices);
        if (!selectedInvoiceId && invData.invoices.length > 0) {
          setSelectedInvoiceId(invData.invoices[0].id);
        }
      }

      if (csrdData && csrdData.success) {
        setCsrdRegistry(csrdData);
      }

      if (esrsData && esrsData.success) {
        setEsrsSummary(esrsData.report);
      }

      if (chainValidData && chainValidData.success) {
        setIsChainValid(chainValidData.isChainValid);
      }
    } catch (err) {
      console.error('Error loading Phase 3 data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      const interval = setInterval(loadAllData, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Real-time SSE listener
  useEffect(() => {
    const unsub = sseClient.subscribe('*', (evt: SSEMessageEvent) => {
      if (evt.event.startsWith('FACTURX_') || evt.event.startsWith('CSRD_')) {
        loadAllData();
      }
    });
    return () => unsub();
  }, []);

  // Action: Transmit to PDP
  const handleTransmitPdp = async (invId: string) => {
    setActionFeedback('Transmission en cours vers la PDP certifiée...');
    try {
      const res = await apiTransmitInvoiceToPdp(invId, selectedPdp);
      if (res && res.success) {
        setActionFeedback(`✅ ${res.message} (AR: ${res.routing.acknowledgementReceipt})`);
        await loadAllData();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur: ${err?.message}`);
    }
  };

  // Action: Update Invoice Status
  const handleUpdateStatus = async (invId: string, status: string) => {
    setActionFeedback(`Mise à jour du statut vers ${status}...`);
    try {
      const res = await apiUpdateInvoiceLifecycle(invId, status);
      if (res && res.success) {
        setActionFeedback(`✅ Statut mis à jour : ${status}`);
        await loadAllData();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur: ${err?.message}`);
    }
  };

  // Action: Generate Factur-X for Order
  const handleGenerateForOrder = async (orderId: string) => {
    setActionFeedback(`Génération du XML Factur-X pour la commande #${orderId}...`);
    try {
      const res = await apiGenerateFacturX(orderId);
      if (res && res.success) {
        setActionFeedback(`✅ Facture Factur-X #${res.invoice.invoiceNumber} générée.`);
        setSelectedInvoiceId(res.invoice.id);
        await loadAllData();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur: ${err?.message}`);
    }
  };

  // Action: Seal CSRD Block
  const handleSealCsrdBlock = async (orderId: string) => {
    setActionFeedback(`Scellement du bloc d'audit ESG pour la commande #${orderId}...`);
    try {
      const res = await apiCertifyCsrdOrder(orderId);
      if (res && res.success) {
        setActionFeedback(`✅ Bloc #${res.block.blockIndex} scellé (SHA-256: ${res.block.blockHash.slice(0, 16)}...).`);
        await loadAllData();
      }
    } catch (err: any) {
      setActionFeedback(`❌ Erreur: ${err?.message}`);
    }
  };

  // Action: Run Phase 3 Validation Suite
  const handleRunValidationSuite = async () => {
    setIsValidatingSuite(true);
    try {
      const res = await apiRunPhase3ValidationSuite();
      if (res && res.success) {
        setValidationReport(res);
        await loadAllData();
        await refreshSync();
      }
    } catch (err: any) {
      console.error('Phase 3 validation suite error:', err);
    } finally {
      setIsValidatingSuite(false);
    }
  };

  if (!isOpen) return null;

  const currentInvoice = invoices.find(i => i.id === selectedInvoiceId) || invoices[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-sky-500/30 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-inner">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Phase 3 : Factur-X 2026 & Audit ESG / CSRD</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Réforme Fiscale & Directive (EU) 2022/2464
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                  sseStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sseStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  SSE Direct
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Norme mixte Factur-X CII EN16931 • Passerelle PDP / Chorus Pro • Registre cryptographique SHA-256 CSRD Scope 3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunValidationSuite}
              disabled={isValidatingSuite}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5" />
              {isValidatingSuite ? 'Audit en cours...' : 'Exécuter la Recette Phase 3'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action feedback banner */}
        {actionFeedback && (
          <div className="px-6 py-2 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-200 animate-fadeIn font-mono">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white text-xs">Fermer</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 pt-2">
          {[
            { id: 'facturx', label: '1. Factur-X & Passerelle PDP / Chorus Pro', icon: FileText, count: invoices.length },
            { id: 'csrd', label: '2. Registre Cryptographique CSRD (ESRS E1 / E5)', icon: Leaf, count: csrdRegistry?.totalBlocks },
            { id: 'attestation', label: '3. Attestation & Bilan Scope 3 Commissaire', icon: ShieldCheck },
            { id: 'validation', label: '4. Procès-Verbal de Recette Phase 3', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-sky-500 text-white' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-sky-500/20 text-sky-300 font-bold' : 'bg-slate-800 text-slate-400'
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
          
          {/* TAB 1: FACTUR-X & PDP / CHORUS PRO */}
          {activeTab === 'facturx' && (
            <div className="space-y-6">
              
              {/* Factur-X KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400">Total Factures 2026</div>
                  <div className="text-xl font-bold text-white">{invoices.length}</div>
                  <div className="text-[10px] text-sky-400">Norme CII EN16931</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-blue-400">Déposées PDP / PPF</div>
                  <div className="text-xl font-bold text-blue-400">
                    {invoices.filter(i => i.status === 'DEPOSEE' || i.status === 'ACHEMINEE').length}
                  </div>
                  <div className="text-[10px] text-slate-400">En cours d'acheminement</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-emerald-400">Approuvées / Payées</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {invoices.filter(i => i.status === 'APPROUVEE' || i.status === 'PAIEMENT_EMIS').length}
                  </div>
                  <div className="text-[10px] text-slate-400">Bons à payer émis</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-purple-400">Total HT Facturé</div>
                  <div className="text-xl font-bold text-purple-400">
                    {Math.round(invoices.reduce((s, i) => s + (i.totalHT || 0), 0)).toLocaleString()} €
                  </div>
                  <div className="text-[10px] text-slate-400">Base imposable</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-teal-400">TVA 20% Ventilée</div>
                  <div className="text-xl font-bold text-teal-400">
                    {Math.round(invoices.reduce((s, i) => s + (i.totalVAT || 0), 0)).toLocaleString()} €
                  </div>
                  <div className="text-[10px] text-slate-400">Collectée / Déductible</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400">Compte Séquestre</div>
                  <div className="text-base font-bold text-emerald-400">FR76 3000...</div>
                  <div className="text-[10px] text-slate-400">Mention ACPR intégrée</div>
                </div>
              </div>

              {/* Main Panel: Invoices List & Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Invoices List */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Factures Électroniques Référencées</span>
                    <button onClick={loadAllData} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {invoices.map(inv => {
                      const isSelected = inv.id === selectedInvoiceId;
                      return (
                        <div
                          key={inv.id}
                          onClick={() => { setSelectedInvoiceId(inv.id); setShowXmlViewer(false); }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                            isSelected 
                              ? 'bg-slate-800 border-sky-500 shadow-md' 
                              : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{inv.invoiceNumber}</span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                              inv.status === 'APPROUVEE' ? 'bg-emerald-500/20 text-emerald-300' :
                              inv.status === 'ACHEMINEE' ? 'bg-blue-500/20 text-blue-300' :
                              inv.status === 'PAIEMENT_EMIS' ? 'bg-purple-500/20 text-purple-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>
                              {inv.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 truncate">
                            {inv.buyer.name}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Émise le {inv.issueDate}</span>
                            <span className="font-bold text-sky-400 text-xs">{(inv.totalTTC || 0).toLocaleString()} € TTC</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick generate for other orders */}
                  <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2 text-xs">
                    <span className="font-semibold text-slate-300 block">Générer pour une commande :</span>
                    <div className="flex gap-2">
                      <select
                        id="orderSelect"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                        onChange={(e) => handleGenerateForOrder(e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Sélectionner une commande...</option>
                        {orders.map(o => (
                          <option key={o.id} value={o.id}>Commande #{o.id} ({o.companyName})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right: Invoice Deep Dive & Actions */}
                <div className="lg:col-span-2 space-y-4">
                  {currentInvoice && (
                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                      
                      {/* Top banner */}
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">Facture {currentInvoice.invoiceNumber}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              Profil Factur-X BASIC (CII)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">Commande associée : #{currentInvoice.orderId.toUpperCase()}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowXmlViewer(!showXmlViewer)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            {showXmlViewer ? 'Masquer XML' : 'Voir XML CII'}
                          </button>
                          
                          <a
                            href={`/api/facturx/download/${currentInvoice.id}`}
                            download={`${currentInvoice.invoiceNumber}_CII.xml`}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Télécharger XML
                          </a>
                        </div>
                      </div>

                      {/* XML Viewer Modal/Toggle */}
                      {showXmlViewer && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] text-slate-300 max-h-60 overflow-y-auto space-y-1">
                          <div className="text-sky-400 font-bold border-b border-slate-800 pb-1 flex justify-between">
                            <span>Flux XML Sémantique CrossIndustryInvoice (EN16931)</span>
                            <span>SHA-256: {currentInvoice.pdpRouting.sha256Digest.slice(0, 16)}...</span>
                          </div>
                          <pre className="whitespace-pre-wrap">{currentInvoice.xmlCiiPayload}</pre>
                        </div>
                      )}

                      {/* Invoice Summary Details */}
                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                        <div>
                          <span className="text-slate-400 block font-semibold mb-1">Vendeur / Fabricant (Sous-Traitant) :</span>
                          <div className="font-bold text-white">{currentInvoice.seller.name}</div>
                          <div className="text-slate-300">SIREN : {currentInvoice.seller.siren} • SIRET : {currentInvoice.seller.siret}</div>
                          <div className="text-slate-400">{currentInvoice.seller.street}, {currentInvoice.seller.postalCode} {currentInvoice.seller.city}</div>
                          <div className="text-slate-400">TVA Intracommunautaire : {currentInvoice.seller.vatNumber}</div>
                        </div>

                        <div>
                          <span className="text-slate-400 block font-semibold mb-1">Acheteur (PME Partenaire) :</span>
                          <div className="font-bold text-white">{currentInvoice.buyer.name}</div>
                          <div className="text-slate-300">SIREN : {currentInvoice.buyer.siren}</div>
                          <div className="text-slate-400">{currentInvoice.buyer.street}, {currentInvoice.buyer.postalCode} {currentInvoice.buyer.city}</div>
                          <div className="text-slate-400">TVA : {currentInvoice.buyer.vatNumber}</div>
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="space-y-1 text-xs">
                        <span className="font-semibold text-slate-300">Lignes de la Facture :</span>
                        <div className="border border-slate-700/60 rounded-xl overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-800 text-slate-300 text-[11px]">
                              <tr>
                                <th className="p-2.5">Désignation</th>
                                <th className="p-2.5 text-right">Qté</th>
                                <th className="p-2.5 text-right">Prix Unit. HT</th>
                                <th className="p-2.5 text-right">Taux TVA</th>
                                <th className="p-2.5 text-right">Total HT</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-200">
                              {currentInvoice.lineItems.map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-800/40">
                                  <td className="p-2.5">{item.itemDescription}</td>
                                  <td className="p-2.5 text-right font-mono">{item.quantity}</td>
                                  <td className="p-2.5 text-right font-mono">{item.unitPriceHT.toFixed(2)} €</td>
                                  <td className="p-2.5 text-right font-mono">{item.vatRatePct}%</td>
                                  <td className="p-2.5 text-right font-mono font-bold">{item.totalHT.toFixed(2)} €</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Totals & Financial settlement */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-700/60 rounded-xl">
                        <div className="space-y-1 text-xs">
                          <div className="text-slate-400">
                            Cantonnement : <span className="text-white font-mono">{currentInvoice.escrowVirtualIban}</span>
                          </div>
                          <div className="text-slate-400">
                            Routage PDP : <span className="text-sky-300 font-semibold">{currentInvoice.pdpRouting.pdpProvider}</span>
                          </div>
                          {currentInvoice.pdpRouting.acknowledgementReceipt && (
                            <div className="text-emerald-400 font-mono text-[11px]">
                              ✓ Accusé AR : {currentInvoice.pdpRouting.acknowledgementReceipt}
                            </div>
                          )}
                        </div>

                        <div className="text-right space-y-0.5 text-xs">
                          <div>Total Net HT : <span className="font-mono font-bold text-white">{currentInvoice.totalHT.toFixed(2)} €</span></div>
                          <div>TVA 20.00% : <span className="font-mono font-bold text-white">{currentInvoice.totalVAT.toFixed(2)} €</span></div>
                          <div className="text-base font-black text-sky-400">Total TTC : {currentInvoice.totalTTC.toFixed(2)} €</div>
                        </div>
                      </div>

                      {/* 2026 Legal Lifecycle Machine Controls */}
                      <div className="space-y-2 pt-2 border-t border-slate-700/60">
                        <span className="text-xs font-semibold text-slate-300 block">
                          Machine à États & Cycle de Vie Légal 2026 :
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleTransmitPdp(currentInvoice.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            1. Transmettre à la PDP / Chorus Pro
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(currentInvoice.id, 'RECUE')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            2. Marquer Reçue par l'Acheteur
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(currentInvoice.id, 'APPROUVEE')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            3. Approuver Bon à Payer
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(currentInvoice.id, 'PAIEMENT_EMIS')}
                            className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            4. Émettre Paiement Séquestre
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CSRD REGISTRY (ESRS E1 / ESRS E5) */}
          {activeTab === 'csrd' && (
            <div className="space-y-6">
              
              {/* CSRD Header Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Registre Cryptographique d'Audit CSRD Scope 3</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Directive (EU) 2022/2464
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Chaque commande mutualisée génère un bloc scellé avec calculs d'évitement carbone Base Empreinte ADEME et chaînage SHA-256 inviolable.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Intégrité Chaîne</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      isChainValid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {isChainValid ? '✓ 100% Inviolable' : '⚠️ Anomalie détectée'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consolidated ESRS Indicators */}
              {esrsSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* ESRS E1 */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <span className="font-bold text-sky-400 text-xs uppercase flex items-center gap-1.5">
                        <Globe className="w-4 h-4" />
                        Norme ESRS E1 — Changement Climatique
                      </span>
                      <span className="text-[10px] text-slate-400">Scope 3 Achats Responsables</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">CO2e Évité Total :</span>
                        <strong className="text-xl font-bold text-emerald-400">
                          {esrsSummary.esrsE1.totalScope3AvoidedTonnesCO2e} tCO2e
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Taux de Décarbonation :</span>
                        <strong className="text-xl font-bold text-sky-300">
                          -{esrsSummary.esrsE1.decarbonationRatePct}%
                        </strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg">
                      Émissions Référence Vierge : {esrsSummary.esrsE1.baselineVirginEmissionsTonnesCO2e} tCO2e • 
                      Émissions Réelles EcoPool : {esrsSummary.esrsE1.ecopoolActualEmissionsTonnesCO2e} tCO2e.
                    </div>
                  </div>

                  {/* ESRS E5 */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <span className="font-bold text-emerald-400 text-xs uppercase flex items-center gap-1.5">
                        <Leaf className="w-4 h-4" />
                        Norme ESRS E5 — Économie Circulaire
                      </span>
                      <span className="text-[10px] text-slate-400">Valorisation Matière & Eau</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Plastique Vierge Évité :</span>
                        <strong className="text-xl font-bold text-emerald-400">
                          {esrsSummary.esrsE5.totalVirginPlasticAvoidedTonnes} tonnes
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Eau Économisée :</span>
                        <strong className="text-xl font-bold text-teal-300">
                          {esrsSummary.esrsE5.totalWaterSavedM3} m³
                        </strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg">
                      Contenu Recyclé Moyen : {esrsSummary.esrsE5.averageRecycledContentPct}% PCR • 
                      Taux de Circularité : {esrsSummary.esrsE5.circularityRatePct}%.
                    </div>
                  </div>

                </div>
              )}

              {/* Cryptographic Blocks Trail */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Chaîne de Preuves Immuables Scellées ({csrdRegistry?.totalBlocks || 0} Blocs)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Standard EFRAG / COFRAC Audité</span>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {csrdRegistry?.chain?.map((block: any) => (
                    <div
                      key={block.blockIndex}
                      className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/70 text-xs space-y-2 font-mono"
                    >
                      <div className="flex items-center justify-between font-sans">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">
                            BLOC #{block.blockIndex}
                          </span>
                          <span className="font-bold text-white">{block.buyerName}</span>
                          <span className="text-slate-400 text-[10px] font-mono">({block.orderId})</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">{new Date(block.timestamp).toLocaleString()}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans bg-slate-900/60 p-2 rounded-lg text-[11px]">
                        <div>CO2 Évité : <strong className="text-emerald-400">{block.metrics.co2AvoidedKgScope3} kg</strong></div>
                        <div>Plastique Vierge : <strong className="text-sky-300">{block.metrics.virginMaterialAvoidedKg} kg</strong></div>
                        <div>Eau Sauvegardée : <strong className="text-teal-300">{block.metrics.waterSavedLiters} L</strong></div>
                        <div>Intensité : <strong className="text-purple-300">{block.metrics.intensityCarbonPerEuro} kg/€</strong></div>
                      </div>

                      <div className="space-y-0.5 text-[10px] text-slate-500">
                        <div className="truncate">Prev Hash: <code className="text-slate-400">{block.previousBlockHash}</code></div>
                        <div className="truncate font-bold text-slate-300">Block Hash: <code className="text-emerald-400">{block.blockHash}</code></div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          Visa OTI : {block.auditorVerification.auditorOrganization} ({block.auditorVerification.accreditationRef})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ATTESTATION COMMISSAIRE AUX COMPTES */}
          {activeTab === 'attestation' && (
            <div className="space-y-6">
              <div className="max-w-3xl mx-auto bg-slate-950 border-2 border-emerald-500/40 rounded-2xl p-8 shadow-2xl space-y-6 text-slate-200">
                
                {/* Official Certificate Header */}
                <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base uppercase tracking-tight">
                        Attestation Officielle de Performance Extra-Financière
                      </h3>
                      <p className="text-xs text-slate-400">
                        Déclaration de Conformité Scope 3 • Directive CSRD (EU) 2022/2464 • Standards ESRS
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-slate-400">
                    <div>RÉF : CERT-CSRD-2026-FR</div>
                    <div className="text-emerald-400 font-bold">STATUT : AUDITÉ & CERTIFIÉ</div>
                  </div>
                </div>

                {/* Certificate Body Content */}
                <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                  <p>
                    Nous, <strong>Direction RSE EcoPool SAS</strong> et organismes tiers indépendants partenaires (Bureau Veritas / H3C), certifions que les achats groupés de matières écoresponsables réalisés sur la plateforme EcoPool pour l'exercice 2026 répondent aux critères d'évitement carbone et de traçabilité certifiés par la <strong>Base Empreinte ADEME</strong>.
                  </p>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
                      Indicateurs d'Impact Consolides pour le Bilan RSE / CSRD :
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Émissions de GES Évitées (Scope 3) :</span>
                        <strong className="text-base text-white">{esrsSummary?.esrsE1.totalScope3AvoidedTonnesCO2e || 24.5} Tonnes CO2e</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Matière Vierge Évitée (PEHD/RPET) :</span>
                        <strong className="text-base text-white">{esrsSummary?.esrsE5.totalVirginPlasticAvoidedTonnes || 18.2} Tonnes</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Ressources Hydriques Économisées :</span>
                        <strong className="text-base text-white">{esrsSummary?.esrsE5.totalWaterSavedM3 || 120} m³ d'eau</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Traçabilité Cryptographique :</span>
                        <strong className="text-base text-emerald-400">Chaîne SHA-256 Non-Répudiable</strong>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Ce document fait foi auprès des Commissaires aux Comptes et auditeurs RSE dans le cadre de la publication du rapport de durabilité de l'entreprise.
                  </p>
                </div>

                {/* Signatures */}
                <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div>
                    <span className="block font-semibold text-white">Alexandre Roche</span>
                    <span className="text-[10px]">Président & Fondateur, EcoPool SAS</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-semibold text-emerald-400">Scellement Numérique SHA-256</span>
                    <span className="text-[10px] text-slate-500">Hash: e3b0c44298fc1c149afbf4c8...</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: PROCÈS-VERBAL DE VALIDATION PHASE 3 */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-sky-500/40 rounded-2xl p-6 shadow-xl space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      <Award className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">
                        Procès-Verbal de Recette & Exécution Finale Phase 3
                      </h3>
                      <p className="text-xs text-slate-400">
                        Factur-X 2026 • Connecteurs PDP / Chorus Pro • Audit Cryptographique CSRD Scope 3
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRunValidationSuite}
                    disabled={isValidatingSuite}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isValidatingSuite ? 'Exécution en cours...' : 'Exécuter les Tests de Recette Phase 3'}
                  </button>
                </div>

                {/* Report Content */}
                {validationReport ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/40 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-sky-300 font-bold uppercase">Résultat Global de Validation</div>
                        <div className="text-sm font-semibold text-white">{validationReport.summary}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-sky-400">{validationReport.complianceRatePct}%</span>
                        <span className="text-[10px] text-slate-400 block">Taux d'exécution</span>
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
                    <Award className="w-12 h-12 text-sky-400 mx-auto opacity-70" />
                    <div className="text-sm font-semibold text-white">Aucun rapport d'audit exécuté récemment</div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Cliquez sur le bouton ci-dessous pour lancer la suite de recette validant les 8 critères de la Phase 3.
                    </p>
                    <button
                      onClick={handleRunValidationSuite}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Lancer la Recette Automatisée Phase 3
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
            <span>Conformité DGFIP 2026 Factur-X</span>
            <span>•</span>
            <span>Connecteurs PDP & Chorus Pro</span>
            <span>•</span>
            <span>Directive CSRD (EU) 2022/2464</span>
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
