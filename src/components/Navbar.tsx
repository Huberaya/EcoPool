import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { UserRole } from '../types';
import { 
  Building2, 
  Factory, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Bell, 
  ChevronDown, 
  Package, 
  Layers, 
  Truck, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Activity,
  ShieldAlert 
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAI: () => void;
  onOpenAudit: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAI,
  onOpenAudit
}) => {
  const { 
    userRole, 
    setUserRole, 
    notifications, 
    markNotificationRead, 
    opportunities,
    currentBuyer,
    currentSupplier 
  } = useEcoPool();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.read);
  const readyOppCount = opportunities.filter(o => o.status === 'moq_reached_ready').length;

  const handleSelectRole = (role: UserRole) => {
    setUserRole(role);
    setShowRoleMenu(false);
    if (role === 'buyer') setCurrentTab('campaigns');
    else if (role === 'supplier') setCurrentTab('supplier_dashboard');
    else if (role === 'admin') setCurrentTab('admin_dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top micro-bar for B2B Trust & Pilot Banner */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 px-4 py-1 text-xs text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium">Programme Pilote 2026 : Packaging Cosmétique Responsable</span>
          <span className="text-emerald-500">•</span>
          <span className="text-slate-300">Hub Central Normandie & Sud opérationnels</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-slate-400">
          <span>Escrow bancaire B2B séquestré</span>
          <span>•</span>
          <span>Certifications GRS & FSC vérifiées par tiers</span>
          <button 
            onClick={onOpenAudit}
            className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3 h-3" />
            Consulter l’Audit & Roadmap MVP
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentTab('campaigns')}
              className="flex items-center gap-3 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    EcoPool
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    B2B SaaS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Centrale d’Achat Collaborative Responsable
                </p>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 ml-6">
              <button
                onClick={() => setCurrentTab('campaigns')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'campaigns'
                    ? 'bg-slate-800 text-emerald-400 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Package className="w-4 h-4" />
                Campagnes d'Achat
              </button>

              <button
                onClick={() => setCurrentTab('aggregation')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 relative ${
                  currentTab === 'aggregation'
                    ? 'bg-slate-800 text-emerald-400 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                Agrégation & Groupage
                {readyOppCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full animate-bounce">
                    {readyOppCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setCurrentTab('catalog')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'catalog'
                    ? 'bg-slate-800 text-emerald-400 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Catalogue & Matières
              </button>

              <button
                onClick={() => setCurrentTab('logistics')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'logistics'
                    ? 'bg-slate-800 text-emerald-400 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Truck className="w-4 h-4" />
                Hub Logistique
              </button>

              <button
                onClick={() => setCurrentTab('escrow')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'escrow'
                    ? 'bg-slate-800 text-emerald-400 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Lock className="w-4 h-4" />
                Séquestre Escrow
              </button>

              <button
                onClick={() => setCurrentTab('analytics')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'analytics'
                    ? 'bg-slate-800 text-emerald-400 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                KPIs & Performance
              </button>

              <button
                onClick={() => setCurrentTab('risks')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'risks'
                    ? 'bg-slate-800 text-rose-300 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Risques & Pilote
              </button>

              {userRole === 'buyer' && (
                <button
                  onClick={() => setCurrentTab('buyer_dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'buyer_dashboard'
                      ? 'bg-slate-800 text-emerald-400 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Espace Acheteur
                </button>
              )}

              {userRole === 'supplier' && (
                <button
                  onClick={() => setCurrentTab('supplier_dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'supplier_dashboard'
                      ? 'bg-slate-800 text-emerald-400 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Factory className="w-4 h-4" />
                  Espace Fournisseur
                </button>
              )}

              {userRole === 'admin' && (
                <button
                  onClick={() => setCurrentTab('admin_dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'admin_dashboard'
                      ? 'bg-slate-800 text-emerald-400 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Cockpit Admin
                </button>
              )}
            </nav>
          </div>

          {/* Right Controls: Role Switcher, AI Assistant, Notifications */}
          <div className="flex items-center gap-3">
            {/* AI Assistant Button */}
            <button
              onClick={onOpenAI}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs md:text-sm shadow-md shadow-emerald-950 transition-all cursor-pointer hover:shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="hidden sm:inline">Assistant IA Sourcing</span>
              <span className="sm:hidden">IA</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
                    <span className="font-semibold text-sm text-white">Notifications Système</span>
                    <span className="text-xs text-slate-400">{unreadNotifs.length} non lues</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors border ${
                          n.read ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-700/50 border-emerald-800/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          {n.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          {n.type === 'info' && <Package className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                          <span className="font-semibold text-white">{n.title}</span>
                        </div>
                        <p className="line-clamp-2 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  {userRole === 'buyer' && <Building2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {userRole === 'supplier' && <Factory className="w-3.5 h-3.5 text-blue-400" />}
                  {userRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="font-medium">
                    {userRole === 'buyer' && 'Acheteur : Botanica'}
                    {userRole === 'supplier' && 'Fournisseur : Plastinnov'}
                    {userRole === 'admin' && 'Admin EcoPool'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-slate-200">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Changer de Rôle B2B
                  </div>
                  
                  <button
                    onClick={() => handleSelectRole('buyer')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      userRole === 'buyer' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'hover:bg-slate-700/60'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Espace Acheteur PME</div>
                      <div className="text-[10px] text-slate-400">{currentBuyer.companyName} (ICP 2)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectRole('supplier')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      userRole === 'supplier' ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60' : 'hover:bg-slate-700/60'
                    }`}
                  >
                    <Factory className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Espace Fournisseur Industriel</div>
                      <div className="text-[10px] text-slate-400">{currentSupplier.name} (Normandie)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectRole('admin')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      userRole === 'admin' ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60' : 'hover:bg-slate-700/60'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-white">Espace Admin EcoPool</div>
                      <div className="text-[10px] text-slate-400">Supervision GMV, Frais & Certificats</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setCurrentTab('campaigns')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'campaigns' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Campagnes
          </button>
          <button
            onClick={() => setCurrentTab('aggregation')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'aggregation' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Agrégation ({readyOppCount})
          </button>
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'catalog' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Catalogue
          </button>
          <button
            onClick={() => setCurrentTab('logistics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'logistics' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Hub Logistique
          </button>
          <button
            onClick={() => setCurrentTab('escrow')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'escrow' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Séquestre Escrow
          </button>
          <button
            onClick={() => setCurrentTab('analytics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'analytics' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            KPIs
          </button>
          <button
            onClick={() => setCurrentTab('risks')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'risks' ? 'bg-slate-800 text-rose-300' : 'text-slate-400'
            }`}
          >
            Risques & Pilote
          </button>
          <button
            onClick={() => setCurrentTab(userRole === 'buyer' ? 'buyer_dashboard' : userRole === 'supplier' ? 'supplier_dashboard' : 'admin_dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              ['buyer_dashboard', 'supplier_dashboard', 'admin_dashboard'].includes(currentTab) ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'
            }`}
          >
            Mon Espace
          </button>
        </div>
      </div>
    </header>
  );
};
