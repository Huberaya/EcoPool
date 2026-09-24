import React, { useState } from 'react';
import { Campaign, CampaignStatus } from '../types';
import { useEcoPool } from '../context/EcoPoolContext';
import { getStatusBadge } from './CampaignCard';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Factory, 
  Truck, 
  Lock, 
  TrendingDown, 
  FileText, 
  Leaf, 
  HelpCircle,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

interface CampaignDetailModalProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSuccessOrder?: (orderId: string) => void;
}

const ALL_STATUSES: { key: CampaignStatus; label: string }[] = [
  { key: 'brouillon', label: 'Brouillon' },
  { key: 'preparation', label: 'Préparation' },
  { key: 'ouverte', label: 'Ouverte' },
  { key: 'presque_financee', label: 'Presque Financée' },
  { key: 'moq_atteinte', label: 'MOQ Atteinte' },
  { key: 'objectif_atteint', label: 'Objectif Atteint' },
  { key: 'cloturee', label: 'Clôturée' },
  { key: 'commande_confirmee', label: 'Commande Usine' },
  { key: 'production', label: 'Production' },
  { key: 'controle_qualite', label: 'Contrôle Hub' },
  { key: 'expedition_hub', label: 'Expédition Hub' },
  { key: 'repartition', label: 'Répartition' },
  { key: 'livree', label: 'Livrée' },
  { key: 'terminee', label: 'Terminée' }
];

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  campaign,
  onClose,
  onSuccessOrder
}) => {
  const { joinCampaign, calculateSavings, currentBuyer } = useEcoPool();

  // Reservation quantity state
  const [quantity, setQuantity] = useState<number>(10000);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{ orderId: string; total: number } | null>(null);

  if (!campaign) return null;

  const currentStatusIndex = ALL_STATUSES.findIndex(s => s.key === campaign.status);
  const statusBadge = getStatusBadge(campaign.status);

  // Dynamic calculations
  const calc = calculateSavings(campaign, quantity);
  const moqProgressPct = Math.min(100, Math.round((campaign.reservedVolume / campaign.moq) * 100));

  const handleConfirmReservation = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const res = joinCampaign(campaign.id, quantity, notes);
      setIsSubmitting(false);
      if (res.success && res.orderId) {
        setOrderConfirmation({ orderId: res.orderId, total: calc.totalAmount });
        if (onSuccessOrder) onSuccessOrder(res.orderId);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Réf : {campaign.product.id} • Fabricant : {campaign.supplier.name} ({campaign.supplier.country})
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8 text-sm">

          {orderConfirmation ? (
            /* Confirmation Screen */
            <div className="bg-emerald-950/60 border border-emerald-800 rounded-2xl p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Réservation B2B Sécurisée !</h3>
                <p className="text-sm text-emerald-300 mt-1">
                  Votre engagement de volume a été enregistré sous la référence <strong>{orderConfirmation.orderId}</strong>.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Entreprise :</span>
                  <span className="font-semibold text-white">{currentBuyer.companyName}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Volume réservé :</span>
                  <span className="font-semibold text-white">{quantity.toLocaleString()} unités</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Prix unitaire garanti :</span>
                  <span className="font-semibold text-emerald-400">{calc.applicableUnitPrice.toFixed(2)} € / u</span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-2 font-bold">
                  <span className="text-white">Montant Séquestre Escrow :</span>
                  <span className="text-emerald-400">{orderConfirmation.total.toLocaleString()} € TTC</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Les fonds restent cantonnés sur le compte séquestre EcoPool jusqu'à l'atteinte de la clôture et la validation du contrôle qualité au Hub de Normandie.
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Fermer et Consulter mes Commandes
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Hero Header */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Image Gallery */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="rounded-2xl overflow-hidden h-72 bg-slate-950 border border-slate-800 relative">
                    <img 
                      src={campaign.product.photos[0]} 
                      alt={campaign.product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{campaign.product.material}</span>
                    </div>
                  </div>
                  {campaign.product.photos[1] && (
                    <div className="h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img src={campaign.product.photos[1]} alt="Vue secondaire" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Primary Overview & Progress */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                      {campaign.product.category} • {campaign.product.subCategory}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                      {campaign.title}
                    </h1>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {campaign.subtitle}
                    </p>
                  </div>

                  {/* Volume Gauge */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-400">Volume Réservé : </span>
                        <strong className="text-white text-sm">{campaign.reservedVolume.toLocaleString()} u</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">MOQ Fabricant : </span>
                        <strong className="text-emerald-400 text-sm">{campaign.moq.toLocaleString()} u</strong>
                      </div>
                    </div>

                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${moqProgressPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Progression : <strong className="text-white">{moqProgressPct}%</strong></span>
                      <span>{campaign.participantsCount} entreprises participantes</span>
                      <span>Échéance : <strong className="text-amber-400">12 jours</strong></span>
                    </div>
                  </div>

                  {/* Paliers Tarifaires Dégressifs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Grille Tarifaire Négociée par Paliers de Volume
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {campaign.priceTiers.map((tier, idx) => {
                        const isUnlocked = (campaign.reservedVolume + quantity) >= tier.volume;
                        return (
                          <div 
                            key={idx}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isUnlocked 
                                ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md' 
                                : 'bg-slate-800/40 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className="text-[11px] block font-medium">Dès {tier.volume.toLocaleString()} u</span>
                            <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                              {tier.unitPrice.toFixed(2)} €
                            </span>
                            <span className="text-[10px] text-slate-400">
                              -{tier.discountPct}% vs solo
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 15-Step Campaign Lifecycle Timeline */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Processus d'Approvisionnement B2B (Cycle de Vie Formel)
                  </h4>
                  <span className="text-xs text-emerald-400 font-medium">
                    Étape actuelle : {statusBadge.label}
                  </span>
                </div>

                {/* Horizontal Step Indicator */}
                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center min-w-[700px] gap-2 text-xs">
                    {ALL_STATUSES.map((step, idx) => {
                      const isPast = idx < currentStatusIndex;
                      const isCurrent = idx === currentStatusIndex;
                      return (
                        <div key={step.key} className="flex items-center gap-1.5 shrink-0">
                          <div className={`px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 ${
                            isCurrent 
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md' 
                              : isPast 
                              ? 'bg-slate-800 text-emerald-400 border-emerald-800/60' 
                              : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            <span>{idx + 1}. {step.label}</span>
                          </div>
                          {idx < ALL_STATUSES.length - 1 && (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Technical Specifications & Certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specifications Techniques */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Fiche Technique & Matériaux
                  </h4>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <dt className="text-slate-500">Matière première</dt>
                      <dd className="font-semibold text-white mt-0.5">{campaign.product.material}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Taux de matière recyclée</dt>
                      <dd className="font-semibold text-emerald-400 mt-0.5">{campaign.product.recycledPercentage}% Post-Consommation</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Contenance & Bague</dt>
                      <dd className="font-semibold text-white mt-0.5">{campaign.product.capacity || 'N/A'} • {campaign.product.neckFinish || 'Standard'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Poids unitaire & Coloris</dt>
                      <dd className="font-semibold text-white mt-0.5">{campaign.product.weightGrams}g • {campaign.product.color}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Contact cosmétique</dt>
                      <dd className="font-semibold text-white mt-0.5">Certifié grade alimentaire/cosmétique</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Filière de tri (Bac Jaune)</dt>
                      <dd className="font-semibold text-white mt-0.5">{campaign.product.recyclabilityIndex}</dd>
                    </div>
                  </dl>
                  
                  {/* ESG Gains */}
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/60 text-emerald-300">
                      <strong>-{campaign.product.co2SavedPerUnitGrams}g CO2 / unité</strong> vs plastique vierge fossile
                    </div>
                    <div className="p-2 rounded-lg bg-teal-950/30 border border-teal-900/60 text-teal-300">
                      <strong>{campaign.product.virginPlasticAvoidedGrams}g de plastique vierge</strong> évité par unité
                    </div>
                  </div>
                </div>

                {/* Certifications & Conformité */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Certifications & Conformité Documentaire
                  </h4>
                  <div className="space-y-2.5">
                    {campaign.certifications.map(c => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {c.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            🟢 Vérifié par {c.authority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{c.scope}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 pt-1 border-t border-slate-800">
                          <span>Licence : {c.licenseNumber}</span>
                          <span>Valide jusqu'au {c.expiresAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fournisseur & Logistique Hub */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Factory className="w-4 h-4 text-emerald-400" />
                    Fournisseur Industriel Partenaire
                  </h4>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fabricant :</span>
                      <strong className="text-white">{campaign.supplier.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Usine :</span>
                      <span>{campaign.supplier.factoryLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Délai fabrication :</span>
                      <span>{campaign.supplier.leadTimeWeeks} semaines après clôture</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Historique EcoPool :</span>
                      <span className="text-emerald-400 font-semibold">{campaign.supplier.totalPoolsCompleted} commandes groupées livrées</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    Logistique & Hub Central EcoPool
                  </h4>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hub Central :</span>
                      <strong className="text-white">{campaign.logisticsConditions.hubLocation}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Conditionnement :</span>
                      <span>{campaign.logisticsConditions.unitsPerBox} u / carton ({campaign.logisticsConditions.boxesPerPallet} cartons/palette)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contrôle qualité :</span>
                      <span className="text-emerald-400">Contrôle dimensionnel & étanchéité au Hub</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Acheminement PME :</span>
                      <span>Expédition finale direct vers vos entrepôts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Purchase Simulator (Étape 5 du parcours acheteur) */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/60 border-2 border-emerald-500/50 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      Calculateur de Volume & Sécurisation de Commande
                    </h3>
                    <p className="text-xs text-slate-400">
                      Achetez uniquement le volume nécessaire pour <strong>{currentBuyer.companyName}</strong>.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Prix unitaire applicable</span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      {calc.applicableUnitPrice.toFixed(2)} € <span className="text-xs text-slate-300 font-normal">/ u</span>
                    </span>
                  </div>
                </div>

                {/* Quantity Input & Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Quantité souhaitée pour votre entreprise (unités) :
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      min="1000"
                      step="500"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(500, parseInt(e.target.value) || 0))}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500 w-48 shadow-inner"
                    />
                    <div className="flex items-center gap-2">
                      {[5000, 10000, 15000, 20000].map(vol => (
                        <button
                          key={vol}
                          type="button"
                          onClick={() => setQuantity(vol)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                            quantity === vol
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          +{vol.toLocaleString()} u
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transparent Financial Breakdown */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Montant net des marchandises ({quantity.toLocaleString()} x {calc.applicableUnitPrice.toFixed(2)} €) :</span>
                    <span className="font-semibold text-white">{calc.groupTotal.toLocaleString()} €</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      Frais de service EcoPool ({campaign.ecopoolFeePct}%)
                      <span title="Plateforme, négociation B2B et gestion du compte séquestre" className="cursor-help">
                        <HelpCircle className="w-3 h-3 text-slate-500 inline" />
                      </span> :
                    </span>
                    <span>+{calc.ecopoolFee.toLocaleString()} €</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Frais logistiques mutualisés Hub (estimation) :</span>
                    <span>+{calc.logisticsEst.toLocaleString()} €</span>
                  </div>
                  
                  {/* Total & Savings Highlight */}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400 block">Total Engagement Séquestre Escrow B2B :</span>
                      <strong className="text-lg font-bold text-white">{calc.totalAmount.toLocaleString()} € TTC</strong>
                    </div>
                    <div className="bg-emerald-950 border border-emerald-700/80 px-3 py-1.5 rounded-xl text-right">
                      <span className="text-[10px] text-emerald-300 block">Économie réalisée vs commande solo :</span>
                      <strong className="text-emerald-400 text-sm font-bold flex items-center justify-end gap-1">
                        <TrendingDown className="w-3.5 h-3.5" /> {calc.savingsEuro.toLocaleString()} € (-{calc.savingsPct}%)
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Notes and Special Requirements */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Remarques ou contraintes de livraison pour vos entrepôts (optionnel) :
                  </label>
                  <input 
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Hayon nécessaire, livraison entre 9h et 16h au dépôt de Lyon..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Escrow Disclaimer & Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Séquestre B2B garanti : aucun débit réel avant confirmation de la MOQ usine.</span>
                  </div>
                  <button
                    onClick={handleConfirmReservation}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-950 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Sécurisation de l'engagement...</span>
                    ) : (
                      <>
                        <span>Rejoindre la Campagne & Réserver ({quantity.toLocaleString()} u)</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
