import React from 'react';
import { Campaign, CampaignStatus } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  TrendingDown, 
  Users, 
  ArrowRight,
  Factory,
  Sparkles
} from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  onSelect: (campaign: Campaign) => void;
}

export const getStatusBadge = (status: CampaignStatus) => {
  switch (status) {
    case 'moq_atteinte':
      return { label: 'MOQ Atteinte !', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    case 'objectif_atteint':
      return { label: 'Objectif Atteint', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
    case 'presque_financee':
      return { label: 'Presque Financée', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    case 'ouverte':
      return { label: 'Campagne Ouverte', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    case 'production':
      return { label: 'En Production Usine', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    case 'controle_qualite':
      return { label: 'Contrôle Qualité Hub', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    case 'expedition_hub':
      return { label: 'Acheminement Hub', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
    case 'repartition':
      return { label: 'Répartition PME', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    case 'livree':
      return { label: 'Livrée', bg: 'bg-emerald-600/30 text-emerald-200 border-emerald-400/50' };
    case 'cloturee':
      return { label: 'Campagne Clôturée', bg: 'bg-slate-700 text-slate-300 border-slate-600' };
    default:
      return { label: status.replace('_', ' '), bg: 'bg-slate-700 text-slate-300 border-slate-600' };
  }
};

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onSelect }) => {
  const statusInfo = getStatusBadge(campaign.status);
  const moqProgressPct = Math.min(100, Math.round((campaign.reservedVolume / campaign.moq) * 100));
  const isMoqReached = campaign.reservedVolume >= campaign.moq;
  const unitsToMoq = Math.max(0, campaign.moq - campaign.reservedVolume);

  // Calculate discount vs solo price
  const discountPct = Math.round(((campaign.marketSoloPrice - campaign.currentUnitPrice) / campaign.marketSoloPrice) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group">
      {/* Image & Badges */}
      <div className="relative h-52 bg-slate-950 overflow-hidden">
        <img 
          src={campaign.product.photos[0]} 
          alt={campaign.product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>
          {campaign.featured && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" />
              Pilote MVP
            </span>
          )}
        </div>

        {/* Supplier pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-300">
          <Factory className="w-3.5 h-3.5 text-emerald-400" />
          <span>{campaign.supplier.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{campaign.supplier.country}</span>
        </div>

        {/* Pricing badge */}
        <div className="absolute bottom-3 right-3 text-right">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-700/60 text-white backdrop-blur-md">
            <span className="text-xs text-slate-400 block line-through">
              Solo : {campaign.marketSoloPrice.toFixed(2)} €
            </span>
            <span className="text-sm font-bold text-emerald-400">
              {campaign.currentUnitPrice.toFixed(2)} € <span className="text-[10px] text-slate-300 font-normal">/ unité</span>
            </span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Category & Certs */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              {campaign.product.category} • {campaign.product.subCategory}
            </span>
            <div className="flex items-center gap-1">
              {campaign.certifications.slice(0, 2).map(c => (
                <span 
                  key={c.id} 
                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1"
                  title={`${c.name} - ${c.status}`}
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {c.name.split(' ')[0]}
                </span>
              ))}
            </div>
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
            {campaign.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {campaign.subtitle}
          </p>
        </div>

        {/* Volume & Progression Meter */}
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Volume Réservé :</span>
            <span className="font-bold text-white">
              {campaign.reservedVolume.toLocaleString()} <span className="text-slate-400 font-normal">/ {campaign.moq.toLocaleString()} u (MOQ)</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isMoqReached 
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400' 
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
              style={{ width: `${moqProgressPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{moqProgressPct}% de la MOQ</span>
            {isMoqReached ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Seuil usine sécurisé
              </span>
            ) : (
              <span className="text-amber-400 font-medium">
                Reste {unitsToMoq.toLocaleString()} u
              </span>
            )}
          </div>
        </div>

        {/* Key Metrics / Highlights */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 border-t border-b border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block">Économie</span>
            <span className="font-bold text-emerald-400 flex items-center justify-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> -{discountPct}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Participants</span>
            <span className="font-bold text-white flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-slate-400" /> {campaign.participantsCount} PME
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Échéance</span>
            <span className="font-bold text-slate-300 flex items-center justify-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-400" /> 12 j
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(campaign)}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white cursor-pointer shadow-md"
        >
          <span>Rejoindre ou Simuler la Commande</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
