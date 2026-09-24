import React, { useState } from 'react';
import { EcoPoolProvider, useEcoPool } from './context/EcoPoolContext';
import { Navbar } from './components/Navbar';
import { CampaignCard } from './components/CampaignCard';
import { CampaignDetailModal } from './components/CampaignDetailModal';
import { AggregationEngineView } from './components/AggregationEngineView';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SupplierDashboard } from './components/SupplierDashboard';
import { LogisticsHubView } from './components/LogisticsHubView';
import { AdminDashboard } from './components/AdminDashboard';
import { CatalogView } from './components/CatalogView';
import { EscrowSecurityView } from './components/EscrowSecurityView';
import { AnalyticsKPIDashboard } from './components/AnalyticsKPIDashboard';
import { RiskLitigationView } from './components/RiskLitigationView';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AuditReportModal } from './components/AuditReportModal';
import { Campaign, ICPSector } from './types';
import { 
  Sparkles, 
  Layers, 
  TrendingDown, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  ArrowRight,
  Factory,
  Zap,
  Building2,
  Package
} from 'lucide-react';

function EcoPoolAppContent() {
  const { campaigns, opportunities, userRole } = useEcoPool();

  const [currentTab, setCurrentTab] = useState<string>('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Filters for Campaigns
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const readyOpportunity = opportunities.find(o => o.status === 'moq_reached_ready');

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSector = filterSector === 'all' || c.product.category === filterSector;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'moq' && (c.status === 'moq_atteinte' || c.status === 'objectif_atteint')) ||
      (filterStatus === 'almost' && c.status === 'presque_financee') ||
      (filterStatus === 'open' && c.status === 'ouverte') ||
      (filterStatus === 'prod' && c.status === 'production');
    const matchesSearch = searchQuery === '' || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.product.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSector && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Navigation */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab}
        onOpenAI={() => setIsAIModalOpen(true)}
        onOpenAudit={() => setIsAuditModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1">
        
        {/* TAB 1: Campagnes d'Achat Groupé */}
        {currentTab === 'campaigns' && (
          <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Hero B2B Section */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden">
              <div className="max-w-3xl space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Centrale d’Achat Collaborative B2B Responsable
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Achetez uniquement le volume dont vous avez besoin. <br />
                  <span className="text-emerald-400">Atteignez ensemble les MOQ industrielles.</span>
                </h1>

                <p className="text-sm text-slate-300 leading-relaxed">
                  EcoPool regroupe les commandes des PME et marques écoresponsables auprès de fabricants vérifiés. 
                  Bénéficiez de <strong>-35% à -50% d'économie</strong>, d'accès direct aux usines françaises et européennes, 
                  et de certifications auditées (GRS, FSC, C2C) avec paiement sécurisé en séquestre B2B.
                </p>

                {/* Key Metric Highlights */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Verticale Pilote</span>
                    <strong className="text-white text-sm">Packaging Cosmétique</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Économie Moyenne</span>
                    <strong className="text-emerald-400 text-sm">-44.2% vs Solo</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Séquestre B2B</span>
                    <strong className="text-teal-300 text-sm">Fonds Cantonnés</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase">Hubs Contrôle QA</span>
                    <strong className="text-blue-400 text-sm">Normandie & Sud</strong>
                  </div>
                </div>
              </div>

              {/* Background ambient glow */}
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Live Aggregation Opportunity Alert (if ready) */}
            {readyOpportunity && (
              <div className="bg-emerald-950/80 border-2 border-emerald-500/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Zap className="w-5 h-5 text-emerald-400 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Algorithme d'Agrégation • Seuil MOQ Atteint !
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {readyOpportunity.demandCount} PME cumulent {readyOpportunity.aggregatedQuantity.toLocaleString()} u sur : {readyOpportunity.productTitle}
                    </h3>
                    <p className="text-xs text-emerald-200/90 mt-0.5">
                      La MOQ industrielle de {readyOpportunity.requiredMOQ.toLocaleString()} u est franchie. Le pool est prêt à être validé.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentTab('aggregation')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950"
                >
                  <span>Examiner l'Opportunité</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
              
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {[
                  { id: 'all', label: 'Toutes les Campagnes' },
                  { id: 'packaging', label: 'Packaging Cosmétique (Pilote)' },
                  { id: 'textile', label: 'Textiles Éthiques' },
                ].map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => setFilterSector(sec.id)}
                    className={`px-3 py-2 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      filterSector === sec.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              {/* Status & Search */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par matière, format, usine..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Tous Statuts</option>
                  <option value="moq">MOQ Atteinte</option>
                  <option value="almost">Presque Financée (&gt;80%)</option>
                  <option value="open">Ouverte</option>
                  <option value="prod">En Production</option>
                </select>
              </div>
            </div>

            {/* Campaign Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onSelect={(camp) => setSelectedCampaign(camp)}
                />
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: Agrégation & Opportunités */}
        {currentTab === 'aggregation' && (
          <AggregationEngineView />
        )}

        {/* TAB 3: Catalogue Responsable */}
        {currentTab === 'catalog' && (
          <CatalogView 
            onSelectCampaign={(c) => setSelectedCampaign(c)}
            onOpenDemandForm={() => setCurrentTab('aggregation')}
          />
        )}

        {/* TAB 4: Hub Logistique */}
        {currentTab === 'logistics' && (
          <LogisticsHubView />
        )}

        {/* TAB 4 bis: Séquestre Escrow B2B */}
        {currentTab === 'escrow' && (
          <EscrowSecurityView />
        )}

        {/* TAB 4 ter: KPIs Stratégiques (Section 20) */}
        {currentTab === 'analytics' && (
          <AnalyticsKPIDashboard />
        )}

        {/* TAB 4 quater: Risques, Litiges & Rétroplanning Pilote (Sections 22 & 23) */}
        {currentTab === 'risks' && (
          <RiskLitigationView />
        )}

        {/* TAB 5: Espace Acheteur */}
        {currentTab === 'buyer_dashboard' && (
          <BuyerDashboard />
        )}

        {/* TAB 6: Espace Fournisseur */}
        {currentTab === 'supplier_dashboard' && (
          <SupplierDashboard />
        )}

        {/* TAB 7: Cockpit Admin */}
        {currentTab === 'admin_dashboard' && (
          <AdminDashboard />
        )}

      </main>

      {/* Campaign Details & Reservation Modal */}
      <CampaignDetailModal
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onSuccessOrder={(orderId) => {
          // Keep open or navigate to orders
        }}
      />

      {/* AI Assistant Modal (4-in-1 Gemini 3.8 Flash) */}
      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSelectCampaign={(cId) => {
          const c = campaigns.find(item => item.id === cId);
          if (c) setSelectedCampaign(c);
        }}
        onGoToAggregation={() => setCurrentTab('aggregation')}
      />

      {/* Architecture & Audit Report Modal */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 px-4 text-xs text-slate-400 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">EcoPool SAS</span>
              <p className="text-[11px] text-slate-400">Centrale d'achat collaborative B2B spécialisée dans les matières & emballages responsables.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <button onClick={() => setIsAuditModalOpen(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Rapport d'Audit & Roadmap MVP
            </button>
            <button onClick={() => setIsAIModalOpen(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              Assistant IA Sourcing
            </button>
            <span>Conformité GRS, FSC & C2C</span>
            <span>Séquestre B2B Garanti</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <EcoPoolProvider>
      <EcoPoolAppContent />
    </EcoPoolProvider>
  );
}
