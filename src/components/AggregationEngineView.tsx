import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { GroupingDemand, ICPSector } from '../types';
import { 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  PlusCircle, 
  Zap, 
  Target, 
  ShieldCheck, 
  Factory,
  Building2
} from 'lucide-react';

export const AggregationEngineView: React.FC = () => {
  const { 
    groupingDemands, 
    opportunities, 
    convertOpportunityToCampaign, 
    submitCustomDemand,
    campaigns,
    currentBuyer 
  } = useEcoPool();

  const [showDemandForm, setShowDemandForm] = useState(false);
  const [format, setFormat] = useState('Flacon 250 ml (col 24/410)');
  const [material, setMaterial] = useState('HDPE 100% Recyclé PCR');
  const [desiredQuantity, setDesiredQuantity] = useState(10000);
  const [maxBudgetUnit, setMaxBudgetUnit] = useState(0.85);
  const [sector, setSector] = useState<ICPSector>('cosmetique_naturelle');
  const [formSuccess, setFormSuccess] = useState(false);

  // Smart Matching simulation state
  const [selectedBuyerSector, setSelectedBuyerSector] = useState<ICPSector>('cosmetique_naturelle');
  const [selectedVolumeNeed, setSelectedVolumeNeed] = useState<number>(15000);

  const handleSubmitDemand = (e: React.FormEvent) => {
    e.preventDefault();
    submitCustomDemand({
      buyerId: currentBuyer.id,
      companyName: currentBuyer.companyName,
      sector,
      productCategory: 'Packaging Cosmétique',
      format,
      material,
      desiredQuantity,
      maxBudgetUnit,
      requiredCertifications: ['GRS', 'EU Ecolabel']
    });

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setShowDemandForm(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900 border border-emerald-800/60 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Moteur d'Agrégation Algorithmique & Smart Matching
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Groupage Intelligent de Volumes & Détection de MOQ
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            L'algorithme EcoPool analyse les demandes individuelles des PME et regroupe automatiquement les besoins sur la base de leur <strong>stricte compatibilité technique</strong> (formats, bagues, résines recyclées, normes GRS) pour débloquer les MOQ fabricants sans compromis.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setShowDemandForm(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Déposer un Besoin d'Achat à Agréger
            </button>
          </div>
        </div>

        <div className="hidden lg:block absolute -right-10 -bottom-10 opacity-20 pointer-events-none text-emerald-400">
          <Layers className="w-80 h-80" />
        </div>
      </div>

      {/* Modal / Form: Déposer un besoin */}
      {showDemandForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Exprimer un Besoin d'Achat B2B
              </h3>
              <button onClick={() => setShowDemandForm(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {formSuccess ? (
              <div className="p-6 text-center text-emerald-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <p className="font-bold">Demande intégrée à la file d'agrégation !</p>
                <p className="text-xs text-slate-400">L'algorithme recalcule les regroupements avec les autres PME.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDemand} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Format & Référence technique recherchée :</label>
                  <select 
                    value={format} 
                    onChange={e => setFormat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Flacon 250 ml (col 24/410)">Flacon Cylindrique 250 ml (col standard 24/410)</option>
                    <option value="Flacon 500 ml (col 28/410)">Flacon Grand Format 500 ml (col 28/410)</option>
                    <option value="Pot 50 ml bague 48/400">Pot Verre 50 ml bague GCMI 48/400</option>
                    <option value="Tube 100 ml biosourcé">Tube Souple 100 ml canne à sucre</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Matière & Résine responsable :</label>
                  <input 
                    type="text" 
                    value={material} 
                    onChange={e => setMaterial(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Quantité requise :</label>
                    <input 
                      type="number" 
                      min="1000" 
                      step="500" 
                      value={desiredQuantity} 
                      onChange={e => setDesiredQuantity(parseInt(e.target.value) || 1000)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Budget unitaire cible (€) :</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={maxBudgetUnit} 
                      onChange={e => setMaxBudgetUnit(parseFloat(e.target.value) || 0.8)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Secteur d'activité :</label>
                  <select 
                    value={sector} 
                    onChange={e => setSector(e.target.value as ICPSector)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="cosmetique_naturelle">Cosmétique naturelle (ICP 2)</option>
                    <option value="mode_ethique">Marque de mode éthique (ICP 1)</option>
                    <option value="dnvb">DNVB & Packaging (ICP 3)</option>
                    <option value="restauration_traiteur">Restauration & Traiteur (ICP 4)</option>
                    <option value="industriel_regional">Industriel Régional (ICP 5)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDemandForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                  >
                    Soumettre à l'Algorithme
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SECTION 8 : OPPORTUNITÉS D'AGRÉGATION DÉTECTÉES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Opportunités de Campagnes Détectées par le Groupage
            </h2>
            <p className="text-xs text-slate-400">
              Détection automatique lorsque le cumul des volumes compatibles franchit le seuil de MOQ imposé par le fabricant.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {opportunities.map(opp => {
            const isMoqReached = opp.status === 'moq_reached_ready';
            const progress = Math.min(100, Math.round((opp.aggregatedQuantity / opp.requiredMOQ) * 100));

            return (
              <div 
                key={opp.id} 
                className={`p-6 rounded-2xl border transition-all ${
                  isMoqReached 
                    ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/50 border-emerald-500 shadow-xl' 
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isMoqReached 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isMoqReached ? '⚡ MOQ Atteignable Détectée !' : 'En cours d\'agrégation'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {opp.category} • {opp.format}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {opp.productTitle}
                    </h3>

                    <p className="text-xs text-slate-300">
                      <strong>{opp.demandCount} PME compatibles</strong> ont cumulé leurs besoins. Fabricant ciblé : <strong className="text-white">{opp.targetSupplier}</strong>.
                    </p>

                    {/* Breakdown of participating demands matching the prompt: 8k + 5k + 12k + 7k + 10k + 6k + 4k = 52k */}
                    <div className="pt-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                      <span className="text-slate-500">Demandes agrégées :</span>
                      {opp.compatibleDemands.map((dem, idx) => (
                        <span key={dem.id} className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                          {dem.desiredQuantity / 1000}k u ({dem.companyName.split(' ')[0]})
                          {idx < opp.compatibleDemands.length - 1 ? ' +' : ''}
                        </span>
                      ))}
                      <span className="text-emerald-400 font-bold ml-1">
                        = {(opp.aggregatedQuantity).toLocaleString()} unités
                      </span>
                    </div>
                  </div>

                  {/* Volume Gauge & Action Button */}
                  <div className="lg:w-80 space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Cumul Agrégé :</span>
                      <strong className="text-white">{opp.aggregatedQuantity.toLocaleString()} u</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">MOQ Industrielle requise :</span>
                      <strong className="text-emerald-400">{opp.requiredMOQ.toLocaleString()} u</strong>
                    </div>

                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isMoqReached ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {isMoqReached ? (
                      <button
                        onClick={() => convertOpportunityToCampaign(opp.id)}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Créer la Campagne Groupée</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="text-center text-xs text-slate-400">
                        En attente de {(opp.requiredMOQ - opp.aggregatedQuantity).toLocaleString()} u complémentaires
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 9 : SMART MATCHING RECOMMANDATIONS */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-400" />
              Moteur de Smart Matching Acheteur
            </h2>
            <p className="text-xs text-slate-400">
              Score de compatibilité basé sur 7 critères techniques : matière, certification, format, quantité, prix, délai et localisation usine.
            </p>
          </div>
        </div>

        {/* Simulator controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-center text-xs">
          <span className="font-semibold text-slate-300">Simuler pour votre profil :</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Secteur :</span>
            <select 
              value={selectedBuyerSector}
              onChange={e => setSelectedBuyerSector(e.target.value as ICPSector)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
            >
              <option value="cosmetique_naturelle">Cosmétique Naturelle</option>
              <option value="mode_ethique">Mode Éthique</option>
              <option value="dnvb">DNVB E-commerce</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Besoin estimé :</span>
            <select 
              value={selectedVolumeNeed}
              onChange={e => setSelectedVolumeNeed(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white"
            >
              <option value={8000}>8 000 unités</option>
              <option value={15000}>15 000 unités</option>
              <option value={30000}>30 000 unités</option>
            </select>
          </div>
        </div>

        {/* Smart Matching Recommendations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                  Recommandation n°1
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  Flacon Cosmétique PCR 100% Recyclé — 250 ml
                </h4>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/50 text-center">
                <span className="text-lg font-black text-teal-300 block">87%</span>
                <span className="text-[10px] text-teal-400">de Match</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="font-semibold text-slate-200">Facteurs de compatibilité calculés :</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matière PCR 100% (100% match)
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Norme GRS & Ecolabel (100% match)
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Col 24/410 standard (100% match)
                </div>
                <div className="flex items-center gap-1.5 text-teal-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Prix : 0,82€ vs cible 0,85€
                </div>
                <div className="flex items-center gap-1.5 text-teal-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Usine Normandie (Circulaire FR)
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Délai : 5 semaines (acceptable)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Recommandation n°2
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  Pot Cosmétique Verre Allégé & Recyclé 85% — 50 ml
                </h4>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-center">
                <span className="text-lg font-black text-slate-200 block">74%</span>
                <span className="text-[10px] text-slate-400">de Match</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="font-semibold text-slate-200">Facteurs de compatibilité calculés :</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verre circulaire 85% recyclé
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Certifié Cradle to Cradle Silver
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Format pot (vs liquide)
                </div>
                <div className="flex items-center gap-1.5 text-teal-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Origine France (Rhône)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
