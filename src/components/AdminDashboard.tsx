import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { 
  ShieldCheck, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Factory, 
  Package, 
  Sliders, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Clock
} from 'lucide-react';
import { CampaignStatus, SupplierStatus, CertificationStatus } from '../types';

export const AdminDashboard: React.FC = () => {
  const { 
    campaigns, 
    suppliers, 
    orders, 
    economicConfig, 
    updateCommissionRate, 
    updateSubscriptionPrice,
    updateCampaignStatus,
    updateSupplierStatus,
    updateCertificationStatus 
  } = useEcoPool();

  const [activeTab, setActiveTab] = useState<'kpis' | 'economics' | 'campaigns' | 'suppliers' | 'certifications'>('kpis');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Compute live KPIs
  const totalVolumeAggregated = campaigns.reduce((sum, c) => sum + c.reservedVolume, 0);
  const totalGMV = campaigns.reduce((sum, c) => sum + (c.reservedVolume * c.currentUnitPrice), 0);
  const moqReachedCount = campaigns.filter(c => c.reservedVolume >= c.moq).length;
  const moqSuccessRate = Math.round((moqReachedCount / campaigns.length) * 100);

  // Platform revenue = GMV * commission + subscription ARR
  const platformCommissionRevenue = Math.round(totalGMV * (economicConfig.commissionRatePct / 100));
  const estimatedSubscriptionARR = (99 * 12 * 8) + (199 * 12 * 4) + (299 * 12 * 2); // Sample active subscribers

  const totalSmeSavings = Math.round(campaigns.reduce((sum, c) => {
    const soloCost = c.reservedVolume * c.marketSoloPrice;
    const groupCost = c.reservedVolume * c.currentUnitPrice;
    return sum + (soloCost - groupCost);
  }, 0));

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    updateCommissionRate(rate);
    setSuccessNotice(`Taux de commission EcoPool mis à jour : ${rate.toFixed(1)}%`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const handlePriceUpdate = (planId: string, price: number) => {
    updateSubscriptionPrice(planId, price);
    setSuccessNotice(`Tarif d'abonnement mis à jour.`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">Cockpit Administrateur & Direction Générale</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                EcoPool Ops v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Supervision de la centrale d'achat B2B : GMV, paliers MOQ industriels, commissions, KYB et conformité.
            </p>
          </div>
        </div>

        {/* Global GMV Summary */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex gap-6 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">GMV Sous Séquestre</span>
            <strong className="text-lg font-bold text-emerald-400">{Math.round(totalGMV).toLocaleString()} €</strong>
          </div>
          <div className="border-l border-slate-800 pl-6">
            <span className="text-[10px] text-slate-400 block uppercase">Taux Réussite MOQ</span>
            <strong className="text-lg font-bold text-teal-300">{moqSuccessRate}%</strong>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successNotice}
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 text-sm gap-4">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'kpis' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          KPIs & Cockpit Exécutif
        </button>
        <button
          onClick={() => setActiveTab('economics')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'economics' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Modèle Économique (Commissions & Abonnements)
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'campaigns' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Gestion des Campagnes ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'suppliers' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Validation Fournisseurs KYB ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`pb-3 font-semibold transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
            activeTab === 'certifications' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Contrôle Documentaire & Certifications
        </button>
      </div>

      {/* Tab 1 : KPIs Exécutifs */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block uppercase font-medium">Volume Total Agrégé</span>
              <div className="text-2xl font-black text-white">{totalVolumeAggregated.toLocaleString()} u</div>
              <span className="text-xs text-emerald-400 font-medium">Réparti sur {campaigns.length} campagnes</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block uppercase font-medium">Économies Générées PME</span>
              <div className="text-2xl font-black text-emerald-400">{totalSmeSavings.toLocaleString()} €</div>
              <span className="text-xs text-slate-400 font-medium">Moyenne de -44.2% vs prix solo</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block uppercase font-medium">Revenus EcoPool (Take Rate)</span>
              <div className="text-2xl font-black text-white">{platformCommissionRevenue.toLocaleString()} €</div>
              <span className="text-xs text-teal-400 font-medium">Commission de {economicConfig.commissionRatePct}%</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 block uppercase font-medium">Taux Atteinte MOQ</span>
              <div className="text-2xl font-black text-amber-400">{moqSuccessRate}%</div>
              <span className="text-xs text-slate-400 font-medium">{moqReachedCount} campagnes sécurisées</span>
            </div>
          </div>

          {/* Detailed Procurement Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Performances des Campagnes Actives</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Campagne</th>
                    <th className="pb-3 font-semibold">Fournisseur</th>
                    <th className="pb-3 font-semibold">Réservé / MOQ</th>
                    <th className="pb-3 font-semibold">Progression</th>
                    <th className="pb-3 font-semibold">Prix Palier</th>
                    <th className="pb-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {campaigns.map(c => (
                    <tr key={c.id}>
                      <td className="py-3 font-semibold text-white">{c.title}</td>
                      <td className="py-3 text-slate-400">{c.supplier.name}</td>
                      <td className="py-3">{c.reservedVolume.toLocaleString()} / {c.moq.toLocaleString()} u</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-400 rounded-full" 
                              style={{ width: `${Math.min(100, (c.reservedVolume / c.moq) * 100)}%` }} 
                            />
                          </div>
                          <span>{Math.round((c.reservedVolume / c.moq) * 100)}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-emerald-400 font-bold">{c.currentUnitPrice.toFixed(2)} €</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2 : Modèle Économique (Section 19 du cahier des charges) */}
      {activeTab === 'economics' && (
        <div className="space-y-6">
          {/* Section Commission 5 à 8% */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  Commission Transactionnelle EcoPool (5% à 8%)
                </h3>
                <p className="text-xs text-slate-400">
                  L'administrateur définit le take rate prélevé sur le volume transactionnel brut négocié.
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center">
                <span className="text-2xl font-black text-amber-400 block">{economicConfig.commissionRatePct.toFixed(1)}%</span>
                <span className="text-[10px] text-amber-300">Taux Actif</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <input
                type="range"
                min="5.0"
                max="8.0"
                step="0.1"
                value={economicConfig.commissionRatePct}
                onChange={handleCommissionChange}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Minimum contractuel : 5.0%</span>
                <span>Taux recommandé : 6.5%</span>
                <span>Plafond : 8.0%</span>
              </div>
            </div>
          </div>

          {/* Section Abonnements Configurables (99€, 199€, 299€) */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Offres d'Abonnement SaaS B2B Configurables</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {economicConfig.subscriptionPlans.map(plan => (
                <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-white text-base">{plan.name}</h4>
                      <span className="text-xs text-slate-400">Mensuel</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        value={plan.monthlyPriceEuro}
                        onChange={(e) => handlePriceUpdate(plan.id, parseInt(e.target.value) || 0)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xl font-black text-emerald-400 w-24 text-center"
                      />
                      <span className="text-sm font-semibold text-slate-300">€ / mois</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>

                    <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3 : Campagnes & Modération */}
      {activeTab === 'campaigns' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Modération & Transitions d'État des Campagnes</h3>
          <div className="space-y-3">
            {campaigns.map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{c.title}</h4>
                  <span className="text-slate-400">
                    {c.supplier.name} • {c.reservedVolume.toLocaleString()} / {c.moq.toLocaleString()} u • Statut actuel : <strong>{c.status.replace('_', ' ')}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={c.status}
                    onChange={(e) => {
                      updateCampaignStatus(c.id, e.target.value as CampaignStatus);
                      setSuccessNotice(`Statut de la campagne modifié.`);
                      setTimeout(() => setSuccessNotice(null), 3000);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white cursor-pointer font-medium"
                  >
                    <option value="ouverte">Ouverte</option>
                    <option value="presque_financee">Presque Financée</option>
                    <option value="moq_atteinte">MOQ Atteinte</option>
                    <option value="objectif_atteint">Objectif Atteint</option>
                    <option value="commande_confirmee">Commande Confirmée</option>
                    <option value="production">En Production</option>
                    <option value="controle_qualite">Contrôle Qualité</option>
                    <option value="expedition_hub">Expédition Hub</option>
                    <option value="repartition">Répartition</option>
                    <option value="livree">Livrée</option>
                    <option value="cloturee">Clôturée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4 : Fournisseurs & KYB */}
      {activeTab === 'suppliers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Agrément KYB & Statut des Usines</h3>
          <div className="space-y-3">
            {suppliers.map(s => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{s.name} ({s.companyName})</h4>
                  <span className="text-slate-400">
                    {s.city}, {s.country} • SIREN : {s.siren} • Certifications valides : {s.certifications.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={s.status}
                    onChange={(e) => {
                      updateSupplierStatus(s.id, e.target.value as SupplierStatus);
                      setSuccessNotice(`Statut fournisseur mis à jour.`);
                      setTimeout(() => setSuccessNotice(null), 3000);
                    }}
                    className={`border rounded-lg px-3 py-1.5 font-bold cursor-pointer ${
                      s.status === 'verifie' 
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
                        : 'bg-amber-950 border-amber-600 text-amber-300'
                    }`}
                  >
                    <option value="verifie">🟢 Vérifié</option>
                    <option value="en_verification">🟠 En vérification</option>
                    <option value="non_verifie">⚪ Non vérifié</option>
                    <option value="suspendu">🔴 Suspendu</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5 : Certifications Documentaires */}
      {activeTab === 'certifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Audit des Certificats Industriels</h3>
          <div className="space-y-3">
            {suppliers.flatMap(s => s.certifications.map(cert => ({ supplier: s, cert }))).map(({ supplier, cert }) => (
              <div key={cert.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{cert.name}</span>
                    <span className="text-slate-400">({supplier.name})</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Organisme : {cert.authority} • Licence : {cert.licenseNumber} • Expiration : {cert.expiresAt}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={cert.status}
                    onChange={(e) => {
                      updateCertificationStatus(supplier.id, cert.id, e.target.value as CertificationStatus);
                      setSuccessNotice(`Statut documentaire actualisé.`);
                      setTimeout(() => setSuccessNotice(null), 3000);
                    }}
                    className={`border rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer ${
                      cert.status === 'verified'
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : cert.status === 'pending'
                        ? 'bg-amber-950 border-amber-600 text-amber-300'
                        : 'bg-rose-950 border-rose-600 text-rose-300'
                    }`}
                  >
                    <option value="verified">🟢 Vérifié</option>
                    <option value="pending">🟠 À vérifier</option>
                    <option value="expired">🔴 Expiré</option>
                    <option value="insufficient_data">⚠️ Données insuffisantes</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
