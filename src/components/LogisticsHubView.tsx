import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { 
  Truck, 
  Warehouse, 
  CheckCircle2, 
  ShieldCheck, 
  Package, 
  Layers, 
  Search, 
  ArrowRight,
  Barcode,
  Clock,
  AlertCircle
} from 'lucide-react';
import { HubInventoryItem } from '../types';

export const LogisticsHubView: React.FC = () => {
  const { hubInventory, updateHubItemStatus, orders } = useEcoPool();

  const [searchFilter, setSearchFilter] = useState('');
  const [activeItem, setActiveItem] = useState<HubInventoryItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredItems = hubInventory.filter(item => 
    item.productName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleUpdateStatus = (itemId: string, newStatus: HubInventoryItem['dispatchStatus']) => {
    updateHubItemStatus(itemId, newStatus);
    setSuccessMsg(`Statut du lot mis à jour : ${newStatus.replace(/_/g, ' ')}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Hub Infrastructure Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
            <Warehouse className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">Hub Logistique Central EcoPool</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Plateforme Normandie & Sud Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Plateforme de cross-docking, contrôle qualité dimensionnel et répartition mutualisée pour PME & ETI.
            </p>
            <p className="text-xs text-slate-400">
              Workflow : <strong>Fabricant Industriel</strong> → <strong>Hub EcoPool</strong> (QA & Dégroupage) → <strong>Acheteurs Individuels</strong>
            </p>
          </div>
        </div>

        {/* Hub Capacity & QA Stats */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex gap-6 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Unités Réceptionnées</span>
            <strong className="text-lg font-bold text-white">
              {hubInventory.reduce((s, i) => s + i.totalReceivedUnits, 0).toLocaleString()} u
            </strong>
          </div>
          <div className="border-l border-slate-800 pl-6">
            <span className="text-[10px] text-slate-400 block uppercase">Conformité QA</span>
            <strong className="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> 99.8%
            </strong>
          </div>
        </div>
      </div>

      {/* 3-Tier Logistics Flow Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-400" />
          Schéma Directeur des Flux Physiques EcoPool
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-white">Étape 1 : Réception Usine</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Fret Amont</span>
            </div>
            <p className="text-slate-300">
              Livraison en camions complets depuis l'usine du fabricant partenaire (ex: Plastinnov Le Havre) vers le Hub EcoPool.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-emerald-400">Étape 2 : Contrôle & Dégroupage Hub</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">EcoPool Hub</span>
            </div>
            <p className="text-slate-300">
              Pesée, test d'étanchéité bague 24/410, prélèvement d'échantillons et reconditionnement par lots personnalisés PME.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-white">Étape 3 : Acheminement PME</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">Fret Aval</span>
            </div>
            <p className="text-slate-300">
              Expéditions individuelles en messagerie ou demi-palette directement vers les entrepôts de chaque marque cliente.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Hub Inventory & Quality Testing Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Barcode className="w-5 h-5 text-teal-400" />
              Inventaire des Lots au Hub & Contrôles Qualité
            </h3>
            <p className="text-xs text-slate-400">Suivi des batches reçus, contrôle laboratoire et état des expéditions.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Filtrer par lot ou produit..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">N° de Lot (Batch)</th>
                <th className="pb-3 font-semibold">Produit & Référence</th>
                <th className="pb-3 font-semibold">Fournisseur Usine</th>
                <th className="pb-3 font-semibold">Unités Reçues</th>
                <th className="pb-3 font-semibold">Échantillons Testés</th>
                <th className="pb-3 font-semibold">Conformité QA</th>
                <th className="pb-3 font-semibold">Zone Stockage</th>
                <th className="pb-3 font-semibold">Statut Dégroupage</th>
                <th className="pb-3 font-semibold text-right">Action Hub</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td className="py-3.5 font-mono text-emerald-400 font-bold">{item.batchNumber}</td>
                  <td className="py-3.5 font-medium text-white">{item.productName}</td>
                  <td className="py-3.5 text-slate-400">{item.supplierName}</td>
                  <td className="py-3.5 font-semibold text-white">{item.totalReceivedUnits.toLocaleString()} u</td>
                  <td className="py-3.5">{item.inspectedUnits} unités</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      {item.qaPassRatePct}% Conforme
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-400">{item.storageZone}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.dispatchStatus === 'conforme_en_repartition' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.dispatchStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {item.dispatchStatus === 'en_attente_qa' ? (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'conforme_en_repartition')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                      >
                        Valider QA & Dégroupage
                      </button>
                    ) : item.dispatchStatus === 'conforme_en_repartition' ? (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'expeditions_en_cours')}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
                      >
                        Lancer Expéditions PME
                      </button>
                    ) : (
                      <span className="text-slate-500">Lot Clôturé</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
