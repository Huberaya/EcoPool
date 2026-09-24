import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  DollarSign, 
  RotateCcw, 
  ArrowRight,
  TrendingDown,
  Clock,
  Layers,
  FileText,
  BadgePercent
} from 'lucide-react';
import { EscrowStatus, OrderReservation } from '../types';

export const EscrowSecurityView: React.FC = () => {
  const { orders, economicConfig } = useEcoPool();

  const [activeTab, setActiveTab] = useState<'transactions' | 'architecture' | 'conditions'>('transactions');
  const [filterEscrow, setFilterEscrow] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderReservation | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Escrow statistics
  const totalEscrowHold = orders.reduce((sum, o) => {
    if (o.escrowStatus === 'paiement_securise' || o.escrowStatus === 'autorisation') {
      return sum + o.totalTTC;
    }
    return sum;
  }, 0);

  const totalCommissionHold = Math.round(totalEscrowHold * (economicConfig.commissionRatePct / 100));

  const filteredOrders = orders.filter(o => {
    if (filterEscrow === 'all') return true;
    return o.escrowStatus === filterEscrow;
  });

  const getEscrowBadge = (status: EscrowStatus) => {
    switch (status) {
      case 'paiement_securise':
        return { label: 'Séquestré Cantonnée', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'autorisation':
        return { label: 'Autorisation Bancaire Active', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'paiement_libere':
        return { label: 'Fonds Libérés Fabricant', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'remboursement':
        return { label: 'Remboursement Intégral', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'paiement_en_attente':
        return { label: 'En attente mandat SEPA', bg: 'bg-slate-700 text-slate-300 border-slate-600' };
      case 'echec':
        return { label: 'Échec Transaction', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
    }
  };

  const handleSimulateRefund = (orderId: string) => {
    setActionNotice(`Ordre de restitution immédiate transmis au PSP pour la commande ${orderId}. Zéro frais prélevés.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSimulateRelease = (orderId: string) => {
    setActionNotice(`Fonds séquestrés libérés avec succès vers l'IBAN industriel suite à la conformité QA au Hub.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">Séquestre B2B & Garantie des Fonds (Escrow)</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Conforme ACPR / DSP2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Protection bilatérale PME & Fabricants : les fonds sont réservés et cantonnés sur un compte de séquestre indépendant. 
              Si la MOQ industrielle n'est pas atteinte, le remboursement à 100% est automatique et sans pénalité.
            </p>
          </div>
        </div>

        {/* Global Escrow Balance */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex gap-6 text-center shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Fonds Cantonnés</span>
            <strong className="text-lg font-bold text-emerald-400">{totalEscrowHold.toLocaleString()} €</strong>
          </div>
          <div className="border-l border-slate-800 pl-6">
            <span className="text-[10px] text-slate-400 block uppercase">Sécurité MOQ</span>
            <strong className="text-lg font-bold text-teal-300">100% Garanti</strong>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {actionNotice}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-sm gap-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'transactions' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Engagements Sous Séquestre ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'architecture' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Mécanisme & Cycle de Libération B2B
        </button>
        <button
          onClick={() => setActiveTab('conditions')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'conditions' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Clauses d'Annulation & Protection Trésorerie
        </button>
      </div>

      {/* Tab 1 : Transactions sous Séquestre */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'all', label: 'Toutes les lignes' },
                { id: 'paiement_securise', label: 'Fonds Séquestrés (Actifs)' },
                { id: 'paiement_libere', label: 'Fonds Libérés' },
                { id: 'remboursement', label: 'Remboursements' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterEscrow(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    filterEscrow === f.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-slate-400">
              Prélèvement SEPA B2B interentreprises et virements Escrow certifiés
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map(order => {
              const badge = getEscrowBadge(order.escrowStatus);
              return (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold">{order.id}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 font-semibold">{order.companyName}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{order.campaignTitle}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Unités Réservées</span>
                      <strong className="text-white text-sm">{order.quantity.toLocaleString()} u</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Prix Unitaire Garanti</span>
                      <strong className="text-emerald-400 text-sm">{order.unitPrice.toFixed(2)} € / u</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Marchandises Net</span>
                      <strong className="text-white text-sm">{order.goodsTotal.toLocaleString()} €</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Frais EcoPool ({economicConfig.commissionRatePct}%)</span>
                      <span className="text-slate-300 text-sm">+{order.ecopoolFee.toLocaleString()} €</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Séquestré</span>
                      <strong className="text-white text-sm">{order.totalTTC.toLocaleString()} € TTC</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Mode de règlement : <strong>Prélèvement SEPA B2B interentreprises</strong> (Débit différé validation MOQ)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSimulateRelease(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Simuler Libération Usine (Post-QA)
                      </button>
                      <button
                        onClick={() => handleSimulateRefund(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Simuler Restitution (Si MOQ non atteinte)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2 : Architecture du Séquestre */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-emerald-400 font-bold block text-sm">1. Pré-Autorisation</span>
              <p className="text-slate-300 leading-relaxed">
                Lors de la réservation par la PME, une empreinte bancaire ou mandat SEPA B2B est signé. 
                Aucun fonds n'est immédiatement transféré à l'usine.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-teal-400 font-bold block text-sm">2. Seuil MOQ Atteint</span>
              <p className="text-slate-300 leading-relaxed">
                Dès que le cumul des commandes franchit la MOQ du fabricant (ex: 50 000 u), les fonds sont appelés et cantonnés sur le compte séquestre EcoPool.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-blue-400 font-bold block text-sm">3. Acompte de Fabrication</span>
              <p className="text-slate-300 leading-relaxed">
                Un acompte industriel (30% à 50% selon contrat usine) est libéré au fabricant pour l'achat des matières premières (HDPE PCR certifié GRS).
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-purple-400 font-bold block text-sm">4. Solde Post-Contrôle</span>
              <p className="text-slate-300 leading-relaxed">
                Le solde est versé au fabricant uniquement après réception au Hub EcoPool et validation du contrôle qualité (tolérance bague 24/410 et étanchéité).
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs leading-relaxed text-slate-300">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Garantie Anti-Risque Trésorerie pour PME
            </h4>
            <p>
              Contrairement aux centrales d'achat traditionnelles qui exigent 100% de paiement immédiat avant de lancer la fabrication, 
              le mécanisme EcoPool garantit qu'aucun centime n'est perdu par la PME si le volume collectif reste en-deçà du seuil usine.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3 : Conditions et Clauses */}
      {activeTab === 'conditions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs leading-relaxed text-slate-300">
          <h3 className="text-base font-bold text-white">Clauses Contractuelles d'Achat Groupé B2B</h3>
          <ul className="space-y-3 list-disc list-inside">
            <li>
              <strong>Clause de Dégressivité Rétroactive</strong> : Tout volume supplémentaire apporté par un nouveau participant qui permet de franchir un palier supérieur (ex: passage de 0.82€ à 0.74€) bénéficie à l'ensemble des acheteurs déjà engagés dans la campagne.
            </li>
            <li>
              <strong>Clause de Non-Atteinte de MOQ</strong> : Si au terme de la date de clôture (ex: 12 jours), le volume n'atteint pas 100% de la MOQ et qu'aucun accord de prolongation n'est validé, la campagne bascule automatiquement en statut <em>Annulée</em> et toutes les autorisations sont annulées sans frais.
            </li>
            <li>
              <strong>Audit Documentaire Obligatoire</strong> : Aucun déblocage de fonds vers le fournisseur n'est autorisé si un certificat clé (GRS, FSC, ISO 14001) a expiré avant la date de livraison prévue.
            </li>
          </ul>
        </div>
      )}

    </div>
  );
};
