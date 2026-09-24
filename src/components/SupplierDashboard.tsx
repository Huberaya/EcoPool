import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { 
  Factory, 
  ShieldCheck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Clock, 
  TrendingUp, 
  FileText, 
  Upload,
  ArrowRight
} from 'lucide-react';
import { CampaignStatus } from '../types';

export const SupplierDashboard: React.FC = () => {
  const { 
    currentSupplier, 
    campaigns, 
    updateCampaignStatus, 
    updateCertificationStatus 
  } = useEcoPool();

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Filter campaigns belonging to this supplier
  const supplierCampaigns = campaigns.filter(c => c.supplier.id === currentSupplier.id);

  const totalUnitsReserved = supplierCampaigns.reduce((sum, c) => sum + c.reservedVolume, 0);
  const totalEscrowRevenue = supplierCampaigns.reduce((sum, c) => sum + (c.reservedVolume * c.currentUnitPrice), 0);

  const handleAdvanceStatus = (campaignId: string, newStatus: CampaignStatus) => {
    updateCampaignStatus(campaignId, newStatus);
    setNotificationMsg(`Statut mis à jour : ${newStatus.replace('_', ' ')}.`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleRenewCert = (certId: string) => {
    updateCertificationStatus(currentSupplier.id, certId, 'verified');
    setNotificationMsg('Dossier de renouvellement certifié et validé.');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Supplier Identity Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
            <Factory className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{currentSupplier.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fabricant Industriel Agréé EcoPool
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Site de production : {currentSupplier.factoryLocation} • SIREN : {currentSupplier.siren} • Délais moyens : {currentSupplier.leadTimeWeeks} semaines
            </p>
            <p className="text-xs text-slate-400">
              Conditions de livraison : {currentSupplier.logisticsConditions} • Réf : {currentSupplier.contactEmail}
            </p>
          </div>
        </div>

        {/* Supplier Metrics */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex gap-6 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Volume Commandé</span>
            <strong className="text-lg font-bold text-white">{totalUnitsReserved.toLocaleString()} u</strong>
          </div>
          <div className="border-l border-slate-800 pl-6">
            <span className="text-[10px] text-slate-400 block uppercase">CA Séquestré</span>
            <strong className="text-lg font-bold text-emerald-400 flex items-center gap-1">
              {totalEscrowRevenue.toLocaleString()} €
            </strong>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {notificationMsg}
        </div>
      )}

      {/* Campagnes Industrielles en cours */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Campagnes & Commandes Groupées Associées ({supplierCampaigns.length})
            </h2>
            <p className="text-xs text-slate-400">
              Pilotez le lancement de production et la validation des étapes industrielles vers le Hub EcoPool.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {supplierCampaigns.map(c => {
            const isMoqReached = c.reservedVolume >= c.moq;
            return (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                      {c.product.category} • {c.product.subCategory}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{c.title}</h3>
                    <span className="text-xs text-slate-400">
                      Réf Produit : {c.product.id} • {c.participantsCount} marques clientes engagées
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      isMoqReached ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Volume Réservé</span>
                    <strong className="text-white text-sm">{c.reservedVolume.toLocaleString()} / {c.moq.toLocaleString()} u</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prix Fabricant Net</span>
                    <strong className="text-emerald-400 text-sm">{c.currentUnitPrice.toFixed(2)} € / u</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Montant Bloqué Escrow</span>
                    <strong className="text-white text-sm">{(c.reservedVolume * c.currentUnitPrice).toLocaleString()} €</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Livraison Hub Prévue</span>
                    <span className="text-slate-300">{c.estimatedDeliveryDate}</span>
                  </div>
                </div>

                {/* Industrial Workflow Actions */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Action industrielle suivante pour votre usine :
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {c.status === 'moq_atteinte' && (
                      <button
                        onClick={() => handleAdvanceStatus(c.id, 'commande_confirmee')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
                      >
                        Valider le Bon de Commande Usine
                      </button>
                    )}
                    {c.status === 'commande_confirmee' && (
                      <button
                        onClick={() => handleAdvanceStatus(c.id, 'production')}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs cursor-pointer"
                      >
                        Lancer l'Extrusion / Production
                      </button>
                    )}
                    {c.status === 'production' && (
                      <button
                        onClick={() => handleAdvanceStatus(c.id, 'controle_qualite')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer"
                      >
                        Valider Lot & Expédier vers Hub EcoPool
                      </button>
                    )}
                    {c.status === 'presque_financee' && (
                      <span className="text-xs text-amber-400 font-medium">
                        En attente du franchissement des {(c.moq - c.reservedVolume).toLocaleString()} u restantes.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gestion des Certifications & Audits */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Passeport & Certifications de l'Usine
            </h2>
            <p className="text-xs text-slate-400">
              Chaque référence vendue sur EcoPool doit être couverte par une certification en cours de validité.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSupplier.certifications.map(cert => (
            <div key={cert.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm">{cert.name}</h4>
                  <p className="text-xs text-slate-400">Organisme : {cert.authority}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  cert.status === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {cert.status === 'verified' ? '🟢 Conforme & Audité' : '🟠 Audit en attente'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{cert.scope}</p>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Licence : {cert.licenseNumber}</span>
                <span className="text-slate-400">Expiration : {cert.expiresAt}</span>
              </div>

              {cert.status !== 'verified' && (
                <button
                  onClick={() => handleRenewCert(cert.id)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  Transmettre le Rapport d'Audit Renouvelé
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
