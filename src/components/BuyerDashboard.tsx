import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { 
  Building2, 
  TrendingDown, 
  Package, 
  ShieldCheck, 
  Leaf, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle2, 
  Truck,
  ExternalLink
} from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { currentBuyer, orders, campaigns } = useEcoPool();

  const [activeTab, setActiveTab] = useState<'commandes' | 'historique' | 'documents'>('commandes');
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  // Aggregate user stats
  const totalUnits = orders.reduce((sum, o) => sum + o.quantity, 0);
  const totalSpend = orders.reduce((sum, o) => sum + o.totalTTC, 0);
  const totalSavings = Math.round(orders.reduce((sum, o) => {
    // Estimate solo price was around +40%
    const solo = o.goodsTotal * 1.68;
    return sum + (solo - o.goodsTotal);
  }, 0));

  const virginPlasticAvoidedKg = Math.round((totalUnits * 26) / 1000);
  const co2SavedKg = Math.round((totalUnits * 54) / 1000);

  const handleDownloadDoc = (docName: string) => {
    setDownloadMsg(`Téléchargement sécurisé du document "${docName}" initié.`);
    setTimeout(() => setDownloadMsg(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Buyer Company Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{currentBuyer.companyName}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Entreprise KYB Vérifiée
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              SIRET : {currentBuyer.siren} • Secteur : Cosmétique Naturelle (ICP 2) • Contact : {currentBuyer.contactName}
            </p>
            <p className="text-xs text-slate-400">
              Adresse de livraison enregistrée : {currentBuyer.deliveryAddress.street}, {currentBuyer.deliveryAddress.postalCode} {currentBuyer.deliveryAddress.city}
            </p>
          </div>
        </div>

        {/* ESG Highlights */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex gap-6 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Volume Acheté</span>
            <strong className="text-lg font-bold text-white">{totalUnits.toLocaleString()} u</strong>
          </div>
          <div className="border-l border-slate-800 pl-6">
            <span className="text-[10px] text-slate-400 block uppercase">Économies Réalisées</span>
            <strong className="text-lg font-bold text-emerald-400 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" /> {totalSavings.toLocaleString()} €
            </strong>
          </div>
        </div>
      </div>

      {/* ESG Impact Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-300 font-medium block">Plastique Vierge Évité</span>
            <strong className="text-base font-bold text-white">{virginPlasticAvoidedKg.toLocaleString()} kg</strong>
            <span className="text-[10px] text-emerald-400 block">Grâce au 100% PCR européen</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/50 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-teal-300 font-medium block">Réduction Empreinte Carbone</span>
            <strong className="text-base font-bold text-white">-{co2SavedKg.toLocaleString()} kg CO2 eq</strong>
            <span className="text-[10px] text-teal-400 block">Production relocalisée FR/EU</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-blue-300 font-medium block">Hub Central Mutualisé</span>
            <strong className="text-base font-bold text-white">Hub Normandie & Lyon</strong>
            <span className="text-[10px] text-blue-400 block">Cross-docking & contrôle qualité</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 text-sm gap-4">
        <button
          onClick={() => setActiveTab('commandes')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'commandes' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Mes Réservations & Commandes Actives ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'historique' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Mon Historique d'Achat Responsable
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 font-semibold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'documents' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Certificats & Factures Séquestre
        </button>
      </div>

      {downloadMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {downloadMsg}
        </div>
      )}

      {/* Tab 1 : Commandes en cours */}
      {activeTab === 'commandes' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="font-semibold text-white">Aucune réservation active pour le moment</p>
              <p className="text-xs text-slate-400 mt-1">Rejoignez une campagne groupée ouverte pour mutualiser vos achats.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-400 font-bold">{order.id}</span>
                      <span className="text-xs text-slate-400">• Réservé le {order.reservedAt}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{order.campaignTitle}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Escrow Sécurisé
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {order.logisticsStep.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Quantité commandée</span>
                    <strong className="text-white text-sm">{order.quantity.toLocaleString()} unités</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Prix unitaire groupé</span>
                    <strong className="text-emerald-400 text-sm">{order.unitPrice.toFixed(2)} € / u</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Montant Séquestre</span>
                    <strong className="text-white text-sm">{order.totalTTC.toLocaleString()} € TTC</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Suivi Hub Logistique</span>
                    <span className="font-mono text-slate-300">{order.hubTrackingNumber || 'HUB-PENDING'}</span>
                  </div>
                </div>

                {/* Logistics Tracking Timeline */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center text-slate-400 mb-2">
                    <span>Acheminement : Usine Fabricant → Hub EcoPool Normandie → Vos locaux</span>
                    <span className="text-emerald-400 font-semibold">Étape : {order.logisticsStep}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-[11px] text-center">
                    {['Réception Hub', 'Contrôle Qualité', 'Répartition Lot', 'Expédition', 'Livré'].map((step, idx) => (
                      <div key={step} className={`p-1.5 rounded-lg border ${
                        idx === 0 || (idx === 1 && order.logisticsStep === 'controle_lot')
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        {idx + 1}. {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2 : Historique d'Achat Responsable */}
      {activeTab === 'historique' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Mon Bilan d'Approvisionnement Responsable</h3>
              <p className="text-xs text-slate-400">Historique complet des volumes groupés, certifications associées et gains financiers.</p>
            </div>
            <button
              onClick={() => handleDownloadDoc('Bilan_RSE_Approvisionnement_2026.pdf')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Exporter le Bilan RSE
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Référence</th>
                  <th className="pb-3 font-semibold">Produit & Matière</th>
                  <th className="pb-3 font-semibold">Fournisseur</th>
                  <th className="pb-3 font-semibold">Volume</th>
                  <th className="pb-3 font-semibold">Prix Groupé</th>
                  <th className="pb-3 font-semibold">Économie (€)</th>
                  <th className="pb-3 font-semibold">Certifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="py-3 font-mono text-emerald-400 font-bold">{o.id}</td>
                    <td className="py-3 font-medium text-white">{o.productName}</td>
                    <td className="py-3 text-slate-400">Plastinnov Normandie</td>
                    <td className="py-3 font-semibold">{o.quantity.toLocaleString()} u</td>
                    <td className="py-3">{o.unitPrice.toFixed(2)} €</td>
                    <td className="py-3 text-emerald-400 font-bold">~{Math.round(o.goodsTotal * 0.45).toLocaleString()} €</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30">
                        GRS 4.0 & Ecolabel
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3 : Documents & Attestations */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Attestation_GRS_Plastinnov_Lot_2026.pdf', type: 'Certificat Matière Recyclée GRS', size: '1.4 Mo' },
            { name: 'Contrat_Escrow_B2B_EcoPool_Ord881.pdf', type: 'Contrat de Séquestre Bancaire', size: '420 Ko' },
            { name: 'Fiche_Technique_Flacon_250ml_PCR.pdf', type: 'Fiche Technique & Inertie Cosmétique', size: '890 Ko' },
            { name: 'Attestation_C2C_Silver_Verre_50ml.pdf', type: 'Certificat Cradle to Cradle', size: '1.1 Mo' }
          ].map(doc => (
            <div key={doc.name} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{doc.name}</h4>
                  <p className="text-[11px] text-slate-400">{doc.type} • {doc.size}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownloadDoc(doc.name)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Télécharger le document"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
