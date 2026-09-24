import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Layers, FileSpreadsheet } from 'lucide-react';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Étape 1 : Rapport d'Audit & Architecture EcoPool</h2>
              <p className="text-xs text-slate-400">Audit de démarrage, cadrage technique et roadmap des 15 chantiers</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-8 text-sm leading-relaxed">
          {/* Section A & B: Diagnostic Existant */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-mono">A & B.</span> Diagnostic de l'Existant (Architecture & Fonctionnalités)
            </h3>
            <p className="text-slate-300">
              L'inspection initiale du workspace révèle un environnement React 19 + TypeScript + Vite 8 + Tailwind CSS 4 avec Express et le SDK moderne <code>@google/genai</code>. Le composant <code>App.tsx</code> était initialement un conteneur vierge.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <h4 className="font-semibold text-emerald-400 text-xs uppercase tracking-wider mb-2">Existant identifié</h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Framework moderne : Vite 8, React 19, TypeScript strict</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Styling utility-first : Tailwind CSS v4</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Moteur d'icônes : Lucide React</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> SDK IA natif : <code>@google/genai</code> prêt pour Gemini 3.8 Flash</li>
                </ul>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <h4 className="font-semibold text-amber-400 text-xs uppercase tracking-wider mb-2">Manquant à construire (Cible EcoPool)</h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Machine d'état à 15 statuts de campagne groupée</li>
                  <li className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Algorithme d'agrégation des demandes et détection de MOQ</li>
                  <li className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Système de vérification documentaire (GRS, FSC, C2C, Ecocert)</li>
                  <li className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Architecture de séquestre Escrow B2B et Hub Logistique 3-tiers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tableau d'Audit Synthétique */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-mono">C, D & E.</span> Synthèse d'Audit et Analyse des Risques
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-slate-300 border-b border-slate-700">
                    <th className="p-3 font-semibold">Domaine</th>
                    <th className="p-3 font-semibold">Existant</th>
                    <th className="p-3 font-semibold">Manquant</th>
                    <th className="p-3 font-semibold">À Améliorer</th>
                    <th className="p-3 font-semibold">Priorité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="p-3 font-medium text-white">Procurement & Campagnes</td>
                    <td className="p-3 text-slate-400">Template brut</td>
                    <td className="p-3">Gestion des 15 statuts, paliers dégressifs, MOQ usine</td>
                    <td className="p-3">Visualisation en temps réel de la jauge MOQ</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">P0 - Critique</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Algorithme d'Agrégation</td>
                    <td className="p-3 text-slate-400">Aucun</td>
                    <td className="p-3">Clustering de compatibilité technique (format, col, résine)</td>
                    <td className="p-3">Alerte automatique "MOQ Atteignable"</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">P0 - Critique</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Conformité & Certifications</td>
                    <td className="p-3 text-slate-400">Aucun</td>
                    <td className="p-3">Vérification GRS/FSC, dates d'expiration, badges 🟢/🟠/🔴/⚠️</td>
                    <td className="p-3">Audit documentaire avec l'IA Gemini</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">P1 - Haute</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Séquestre Financier & Escrow</td>
                    <td className="p-3 text-slate-400">Aucun</td>
                    <td className="p-3">États de paiement différé B2B et libération post-contrôle</td>
                    <td className="p-3">Transparence totale des frais EcoPool (6.5%)</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">P1 - Haute</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Logistique & Hub</td>
                    <td className="p-3 text-slate-400">Aucun</td>
                    <td className="p-3">Workflow 3-tiers : Fabricant → Hub EcoPool → Acheteur</td>
                    <td className="p-3">Traçabilité des lots et contrôle qualité</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">P1 - Haute</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section G & H: Architecture Cible & Modèle de Données */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-mono">G & H.</span> Architecture Cible EcoPool & Modèle de Données
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700">
                <span className="font-bold text-emerald-400 block mb-1">1. Frontend Réactif B2B</span>
                <p className="text-slate-300">Architecture par composants découplés : Fiches campagnes, simulateur de paliers dégressifs, console de groupage, hub logistique et multi-rôle (Acheteur, Fournisseur, Admin).</p>
              </div>
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700">
                <span className="font-bold text-teal-400 block mb-1">2. Moteur d'Agrégation</span>
                <p className="text-slate-300">Algorithme de regroupement calculant la compatibilité technique (format, matière, tolérance) pour cumuler les volumes et débloquer les MOQ fabricants.</p>
              </div>
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700">
                <span className="font-bold text-blue-400 block mb-1">3. Intelligence Artificielle</span>
                <p className="text-slate-300">Intégration de <code>@google/genai</code> (Gemini 3.8 Flash) pour 4 assistants : Procurement B2B, Sourcing & Groupage, Conformité documentaire et Risques MOQ Admin.</p>
              </div>
            </div>
          </div>

          {/* Section I: Roadmap des 15 Chantiers */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-mono">I.</span> Roadmap des 15 Chantiers d'Ingénierie EcoPool
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              {[
                { id: 1, name: 'Architecture & Fondations', status: 'Terminé' },
                { id: 2, name: 'Utilisateurs & Entreprises', status: 'Terminé' },
                { id: 3, name: 'Catalogue & Packaging Pilote', status: 'Terminé' },
                { id: 4, name: 'Fournisseurs & Vérification KYB', status: 'Terminé' },
                { id: 5, name: 'Certifications & Conformité', status: 'Terminé' },
                { id: 6, name: 'Campagnes d\'Achat & 15 Statuts', status: 'Terminé' },
                { id: 7, name: 'Agrégation Algorithmique', status: 'Terminé' },
                { id: 8, name: 'Commandes & Réservations', status: 'Terminé' },
                { id: 9, name: 'Paiements & Séquestre Escrow', status: 'Terminé' },
                { id: 10, name: 'Logistique & Hub Central', status: 'Terminé' },
                { id: 11, name: 'Dashboard Administrateur', status: 'Terminé' },
                { id: 12, name: 'Intelligence Artificielle (Gemini)', status: 'Terminé' },
                { id: 13, name: 'Analytics & KPIs Stratégiques', status: 'Terminé' },
                { id: 14, name: 'Sécurité & Traçabilité des Lots', status: 'Terminé' },
                { id: 15, name: 'Préparation au Lancement Pilote', status: 'Opérationnel' },
              ].map(c => (
                <div key={c.id} className="p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">Chantier {c.id}</span>
                    <p className="text-[11px] text-slate-400">{c.name}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section J: MVP 8 Semaines */}
          <div className="space-y-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <span className="text-emerald-400 font-mono">J.</span> Focus MVP 8 Semaines — Verticale Pilote : Packaging Cosmétique
            </h3>
            <p className="text-xs text-emerald-200/90">
              Conformément au cahier des charges, le lancement démarre sur 3 produits industriels pilotes :
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 ml-1">
              <li><strong>Flacon 100% PCR 250ml</strong> — MOQ 50k, 42.5k réservés (85%), palier à 0.82€ puis 0.74€.</li>
              <li><strong>Flacon 100% PCR 500ml</strong> — MOQ 40k, 41.2k réservés (MOQ atteinte !), palier 1.15€ puis 1.02€.</li>
              <li><strong>Pot cosmétique verre 85% recyclé 50ml</strong> — MOQ 30k, 28k réservés (93.3%), palier 0.98€ puis 0.89€.</li>
            </ol>
            <div className="pt-2 text-xs text-emerald-400 font-medium">
              🎯 Objectif opérationnel validé : 10 marques partenaires et seuil de 50 000 unités agrégées.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">EcoPool CTO & Architecture Lead Document v1.0</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fermer et Explorer la Plateforme
          </button>
        </div>
      </div>
    </div>
  );
};
