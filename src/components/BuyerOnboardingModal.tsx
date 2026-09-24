import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { ICPSector, BuyerProfile } from '../types';
import { 
  Building2, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  TrendingUp, 
  Package,
  Layers,
  X
} from 'lucide-react';

interface BuyerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const BuyerOnboardingModal: React.FC<BuyerOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { currentBuyer, campaigns } = useEcoPool();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 : Identification Entreprise (KYB)
  const [companyName, setCompanyName] = useState(currentBuyer.companyName);
  const [siren, setSiren] = useState(currentBuyer.siren);
  const [sector, setSector] = useState<ICPSector>(currentBuyer.sector);
  const [country, setCountry] = useState(currentBuyer.country);
  const [website, setWebsite] = useState(currentBuyer.website);
  const [companySize, setCompanySize] = useState<'1-10' | '11-50' | '51-250' | '250+'>(currentBuyer.companySize);
  const [street, setStreet] = useState(currentBuyer.deliveryAddress.street);
  const [postalCode, setPostalCode] = useState(currentBuyer.deliveryAddress.postalCode);
  const [city, setCity] = useState(currentBuyer.deliveryAddress.city);

  // Step 2 : Profil d'Achat Responsable
  const [annualVolume, setAnnualVolume] = useState('50 000 à 100 000 unités/an');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([
    'HDPE 100% Recyclé (PCR)',
    'RPET Clarifié Grade Cosmétique'
  ]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([
    'GRS 4.0 (Global Recycled Standard)',
    'EU Ecolabel'
  ]);
  const [targetBudgetUnit, setTargetBudgetUnit] = useState<number>(0.85);

  if (!isOpen) return null;

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials(prev => 
      prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]
    );
  };

  const toggleCert = (cert: string) => {
    setSelectedCertifications(prev => 
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Parcours Acheteur B2B EcoPool (Section 6)</h2>
              <p className="text-xs text-slate-400">Création de compte, profil d'achat responsable & matching instantané</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Wizard Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className={`flex items-center gap-2 font-semibold ${step >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 1 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>1</span>
            <span>Identification & KYB</span>
          </div>

          <div className="w-12 h-0.5 bg-slate-800" />

          <div className={`flex items-center gap-2 font-semibold ${step >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>2</span>
            <span>Profil d'Achat Responsable</span>
          </div>

          <div className="w-12 h-0.5 bg-slate-800" />

          <div className={`flex items-center gap-2 font-semibold ${step >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>3</span>
            <span>Campagnes & Matchings Débloqués</span>
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
          
          {/* ÉTAPE 1 : IDENTIFICATION SOCIÉTÉ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white">Étape 1 — Identité de l'Entreprise & Données Légales</h3>
                <p className="text-xs text-slate-400">Vérification de l'existence juridique de votre société pour l'accès aux tarifs usines.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Raison Sociale :</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Numéro SIREN / SIRET :</label>
                  <input
                    type="text"
                    value={siren}
                    onChange={e => setSiren(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Secteur d'activité (ICP) :</label>
                  <select
                    value={sector}
                    onChange={e => setSector(e.target.value as ICPSector)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="cosmetique_naturelle">ICP 2 — Cosmétique naturelle & soins bio</option>
                    <option value="mode_ethique">ICP 1 — Marques de mode éthique & textiles</option>
                    <option value="dnvb">ICP 3 — DNVB & E-commerce responsable</option>
                    <option value="restauration_traiteur">ICP 4 — Traiteurs & restauration durable</option>
                    <option value="industriel_regional">ICP 5 — PME & Industriels régionaux</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Taille de l'entreprise :</label>
                  <select
                    value={companySize}
                    onChange={e => setCompanySize(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="1-10">1 à 10 salariés (TPE / Startup)</option>
                    <option value="11-50">11 à 50 salariés (PME)</option>
                    <option value="51-250">51 à 250 salariés (PME consolidée)</option>
                    <option value="250+">250+ salariés (ETI)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Site Web :</label>
                  <input
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-800">
                  <span className="font-semibold text-white block">Adresse de Livraison Entrepôt / Dépôt :</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Adresse / Voie"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      className="sm:col-span-2 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Code Postal"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Valider et Configurer le Profil d'Achat</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : PROFIL D'ACHAT RESPONSABLE */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white">Étape 2 — Besoins & Contraintes d'Approvisionnement</h3>
                <p className="text-xs text-slate-400">Renseignez vos matières prioritaires, exigences de certifications et budgets cibles.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Matières recherchées */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-2">
                    Matières et composants écoresponsables recherchés :
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'HDPE 100% Recyclé (PCR)',
                      'RPET Clarifié Grade Cosmétique',
                      'Verre blanc recyclé allégé (C2C)',
                      'Polyéthylène biosourcé canne à sucre',
                      'Carton ondulé double cannelure FSC',
                      'Toile de coton biologique GOTS'
                    ].map(mat => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => toggleMaterial(mat)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          selectedMaterials.includes(mat)
                            ? 'bg-emerald-950/60 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{mat}</span>
                        {selectedMaterials.includes(mat) && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Certifications requises */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-2">
                    Certifications obligatoires dans votre charte RSE :
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'GRS 4.0 (Global Recycled Standard)',
                      'EU Ecolabel',
                      'Cradle to Cradle Silver',
                      'FSC Recycled',
                      'GOTS Version 7.0',
                      'Ecocert / Cosmos Organic'
                    ].map(cert => (
                      <button
                        key={cert}
                        type="button"
                        onClick={() => toggleCert(cert)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          selectedCertifications.includes(cert)
                            ? 'bg-emerald-950/60 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{cert}</span>
                        {selectedCertifications.includes(cert) && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volumes & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Volume d'achat annuel estimé :</label>
                    <select
                      value={annualVolume}
                      onChange={e => setAnnualVolume(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                    >
                      <option value="10 000 à 30 000 unités/an">10 000 à 30 000 unités/an</option>
                      <option value="50 000 à 100 000 unités/an">50 000 à 100 000 unités/an</option>
                      <option value="150 000 à 300 000 unités/an">150 000 à 300 000 unités/an</option>
                      <option value="500 000+ unités/an">Plus de 500 000 unités/an</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Budget unitaire cible moyen (€) :</label>
                    <input
                      type="number"
                      step="0.01"
                      value={targetBudgetUnit}
                      onChange={e => setTargetBudgetUnit(parseFloat(e.target.value) || 0.8)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Calculer les Campagnes Compatibles</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : RÉSULTAT ET MATCHING */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Campagnes Détectées pour votre Profil d'Achat
                </h3>
                <p className="text-xs text-slate-400">
                  L'algorithme a identifié les campagnes d'achat collectif correspondant à vos matières et critères GRS.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {campaigns.slice(0, 3).map((camp, idx) => (
                  <div key={camp.id} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Match {idx === 0 ? '94%' : idx === 1 ? '88%' : '82%'}
                        </span>
                        <span className="text-slate-400">{camp.product.category} • {camp.product.material}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{camp.title}</h4>
                      <p className="text-slate-400 text-[11px]">
                        Prix négocié : <strong className="text-emerald-400">{camp.currentUnitPrice.toFixed(2)} € / u</strong> (au lieu de {camp.marketSoloPrice.toFixed(2)} € en commande individuelle)
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-400 block mb-1">
                        {camp.reservedVolume.toLocaleString()} / {camp.moq.toLocaleString()} u réservées
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800 block text-center">
                        MOQ en cours
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong>Profil d'acheteur certifié avec succès !</strong> Vos paramètres d'achat ont été enregistrés pour alimenter automatiquement le moteur de regroupement d'EcoPool.
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Modifier le profil
                </button>
                <button
                  onClick={handleFinish}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Accéder à mes Campagnes Groupées</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
