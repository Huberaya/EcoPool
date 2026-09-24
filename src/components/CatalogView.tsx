import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { Campaign } from '../types';
import { 
  Search, 
  Filter, 
  Layers, 
  Package, 
  ShieldCheck, 
  ArrowRight,
  Leaf
} from 'lucide-react';

interface CatalogViewProps {
  onSelectCampaign: (campaign: Campaign) => void;
  onOpenDemandForm: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ onSelectCampaign, onOpenDemandForm }) => {
  const { campaigns } = useEcoPool();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCert, setSelectedCert] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCampaigns = campaigns.filter(c => {
    const matchCat = selectedCategory === 'all' || c.product.category === selectedCategory;
    const matchCert = selectedCert === 'all' || c.certifications.some(cert => cert.name.toLowerCase().includes(selectedCert.toLowerCase()));
    const matchSearch = searchTerm === '' || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.product.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchCert && matchSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-2">
            <Package className="w-3.5 h-3.5" />
            Catalogue Industriel B2B Écoresponsable
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Matières Premières, Composants & Emballages</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Consultez les références certifiées disponibles pour vos groupages : flaconnage PCR, verre allégé, biomatériaux et textiles régénératifs.
          </p>
        </div>

        <button
          onClick={onOpenDemandForm}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
        >
          Proposer une nouvelle référence
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: 'Toutes Matières' },
            { id: 'packaging', label: 'Packaging (PCR & Verre)' },
            { id: 'textile', label: 'Textile (GOTS Bio)' },
            { id: 'composants', label: 'Composants & Biosourcé' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Certification Select */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher matière, format..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedCert}
            onChange={e => setSelectedCert(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Toutes Certifications</option>
            <option value="GRS">GRS (Global Recycled Standard)</option>
            <option value="FSC">FSC Recycled</option>
            <option value="GOTS">GOTS Coton Bio</option>
            <option value="Cradle">Cradle to Cradle</option>
            <option value="Ecolabel">EU Ecolabel</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map(c => (
          <div 
            key={c.id} 
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group transition-all"
          >
            <div>
              <div className="h-44 bg-slate-950 relative overflow-hidden">
                <img 
                  src={c.product.photos[0]} 
                  alt={c.product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                  {c.product.material.split(' ')[0]} {c.product.recycledPercentage > 0 ? `${c.product.recycledPercentage}% Recyclé` : 'Biosourcé'}
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {c.product.category} • {c.product.originCountry}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {c.product.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.subtitle}</p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fabricant :</span>
                    <strong className="text-white">{c.supplier.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seuil MOQ usine :</span>
                    <strong className="text-emerald-400">{c.moq.toLocaleString()} u</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prix groupé négocié :</span>
                    <strong className="text-white">Dès {c.priceTiers[c.priceTiers.length - 1].unitPrice.toFixed(2)} € / u</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => onSelectCampaign(c)}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Voir la Campagne d'Achat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
