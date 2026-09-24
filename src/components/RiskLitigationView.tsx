import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Lock, 
  RefreshCw, 
  HelpCircle, 
  ChevronRight, 
  Building2, 
  Scale, 
  Truck, 
  UserX, 
  Search, 
  Plus, 
  X,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Award
} from 'lucide-react';
import { RiskIncident, PilotWeekMilestone, RiskSeverity } from '../types';

export const RiskLitigationView: React.FC = () => {
  const { campaigns } = useEcoPool();
  const [activeTab, setActiveTab] = useState<'matrix' | 'incidents' | 'pilot_roadmap' | 'mediation'>('matrix');

  // Local notification toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'warning' | 'alert' | 'info' } | null>(null);

  const notify = (title: string, desc: string, type: 'success' | 'warning' | 'alert' | 'info' = 'info') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Incidents List
  const [incidents, setIncidents] = useState<RiskIncident[]>([
    {
      id: 'INC-2026-001',
      campaignId: 'camp-1',
      campaignTitle: 'Flacons Cosmétiques 250 ml - 100% PCR Blanc Opaque',
      category: 'retard_fournisseur',
      severity: 'moderee',
      title: 'Retard de 4 jours sur l\'approvisionnement granulat PCR rHDPE',
      description: 'Le fournisseur Plastinnov informe d\'un délai supplémentaire de 4 jours pour la livraison des granulés certifiés EuCertPlast chez le transformateur. Impact direct sur le calendrier de soufflage.',
      detectedAt: '2026-03-22',
      affectedBuyersCount: 4,
      totalValueAtRiskEuro: 17800,
      escrowStatusImpact: 'aucun_impact',
      status: 'investigation_hub',
      correctiveAction: 'Activation de l\'équipe de nuit sans surcoût par Plastinnov + notification groupée automatique aux 4 acheteurs. Réception finale au hub décalée de 48h seulement.',
      resolutionDeadline: '2026-03-28'
    },
    {
      id: 'INC-2026-002',
      campaignId: 'camp-2',
      campaignTitle: 'Pots Cosmétiques 50 ml - Verre Recyclé Ambré & Bambou',
      category: 'non_conformite_qa',
      severity: 'critique',
      title: 'Défaut de concentricité sur 1,2% des couvercles bambou (Lot QA-448)',
      description: 'Lors du contrôle par prélèvement statistique (AQL 1.0) au Hub EcoPool de Lyon, 60 couvercles bambou ont présenté un léger jeu de filetage pouvant compromettre l\'étanchéité.',
      detectedAt: '2026-03-20',
      affectedBuyersCount: 3,
      totalValueAtRiskEuro: 9350,
      escrowStatusImpact: 'bloque_sequestre',
      status: 'arbitrage_ecopool',
      correctiveAction: 'Séquestre usine gelé sur le montant des couvercles. Verreries Rhône-Alpes a réexpédié 500 unités conformes sous 48h. Aucun impact sur les flacons en verre.',
      resolutionDeadline: '2026-03-25'
    },
    {
      id: 'INC-2026-003',
      campaignId: 'camp-3',
      campaignTitle: 'Flacons Sérum 100 ml - Verre Borosilicate & Pipette',
      category: 'audit_certification',
      severity: 'faible',
      title: 'Mise à jour du certificat GRS en cours de renouvellement annuel',
      description: 'L\'organisme Ecocert effectue l\'audit annuel de conformité du fournisseur. Attestation temporaire fournie en attente du diplôme officiel renouvelé.',
      detectedAt: '2026-03-15',
      affectedBuyersCount: 2,
      totalValueAtRiskEuro: 4500,
      escrowStatusImpact: 'aucun_impact',
      status: 'resolu_clos',
      correctiveAction: 'Certificat officiel 2026-2027 reçu et téléversé dans la base EcoPool. Attestation de conformité validée par le service juridique.',
      resolutionDeadline: '2026-03-21'
    }
  ]);

  // Modal new incident
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [newIncidentData, setNewIncidentData] = useState<{
    campaignId: string;
    category: RiskIncident['category'];
    severity: RiskSeverity;
    title: string;
    description: string;
    affectedBuyersCount: number;
    totalValueAtRiskEuro: number;
    correctiveAction: string;
  }>({
    campaignId: 'camp-1',
    category: 'retard_fournisseur',
    severity: 'moderee',
    title: '',
    description: '',
    affectedBuyersCount: 3,
    totalValueAtRiskEuro: 4500,
    correctiveAction: ''
  });

  // 8-Week Roadmap Milestones
  const [pilotMilestones, setPilotMilestones] = useState<PilotWeekMilestone[]>([
    {
      week: 1,
      title: 'Sourcing & Qualification des 3 Fabricants Pilotes',
      phase: 'Préparation Industrielle',
      status: 'termine',
      progressPct: 100,
      kpis: [
        { label: 'Fournisseurs audités', current: '5', target: '3' },
        { label: 'Certifications validées (GRS, FSC)', current: '100%', target: '100%' },
        { label: 'Contrats cadre signés', current: '3', target: '3' }
      ],
      deliverables: [
        'Fiches techniques complètes standardisées (bague 24/410, tolérances AQL)',
        'Grilles tarifaires dégressives négociées dès 50 000 unités',
        'Contrat tripartite EcoPool - Fabricant - Séquestre bancaire finalisé'
      ]
    },
    {
      week: 2,
      title: 'Lancement des 3 Campagnes Pilotes Packaging Cosmétique',
      phase: 'Lancement de l\'Offre',
      status: 'termine',
      progressPct: 100,
      kpis: [
        { label: 'Campagnes ouvertes', current: '3', target: '3' },
        { label: 'Fiches produits avec photos 3D HD', current: '3', target: '3' },
        { label: 'Documentation RSE téléchargeable', current: '6', target: '6' }
      ],
      deliverables: [
        'Flacon 250 ml rHDPE PCR blanc opaque (MOQ 50 000)',
        'Pot cosmétique 50 ml verre recyclé 90% ambré (MOQ 20 000)',
        'Flacon pompe sérum 100 ml borosilicate (MOQ 15 000)'
      ]
    },
    {
      week: 3,
      title: 'Prospection Ciblée & Onboarding des PME Cosmétiques',
      phase: 'Acquisition & Groupage',
      status: 'termine',
      progressPct: 100,
      kpis: [
        { label: 'PME contactées', current: '42', target: '30' },
        { label: 'PME inscrites & vérifiées', current: '18', target: '15' },
        { label: 'Taux de conversion premier rendez-vous', current: '43%', target: '35%' }
      ],
      deliverables: [
        'Webinaire de présentation de la centrale d\'achat collaborative',
        'Vérification KYC / SIREN des acheteurs cosmétiques',
        'Collecte des expressions de besoins personnalisées'
      ]
    },
    {
      week: 4,
      title: 'Agrégation des Volumes & Clôture des Campagnes (Atteinte des MOQ)',
      phase: 'Agrégation & Financement',
      status: 'en_cours',
      progressPct: 92,
      kpis: [
        { label: 'Volume total agrégé', current: '84 500 u', target: '85 000 u' },
        { label: 'Campagnes ayant atteint le MOQ', current: '2 / 3', target: '3 / 3' },
        { label: 'Économie moyenne constatée vs prix solo', current: '-34,2%', target: '-25%' }
      ],
      deliverables: [
        'Flacon 250 ml à 48 500 / 50 000 (97% - clôture dans 3 jours)',
        'Pot 50 ml à 19 200 / 20 000 (96% - quasi financé)',
        'Flacon 100 ml à 16 800 / 15 000 (112% - MOQ dépassé, palier dégressif débloqué)'
      ]
    },
    {
      week: 5,
      title: 'Séquestre Escrow & Émission des Ordres de Production (PO)',
      phase: 'Sécurisation Financière',
      status: 'a_venir',
      progressPct: 10,
      kpis: [
        { label: 'Fonds cantonnés en séquestre', current: '42 500 €', target: '65 000 €' },
        { label: 'Taux d\'impayé / incidents bancaires', current: '0,0%', target: '< 0,5%' },
        { label: 'Déclenchement des acomptes usine (30%)', current: '0 / 3', target: '3 / 3' }
      ],
      deliverables: [
        'Génération automatique des bons de commande industriels unifiés',
        'Ajustement des factures au prorata du palier de volume optimal atteint',
        'Versement de l\'acompte matière première aux fabricants sous séquestre'
      ]
    },
    {
      week: 6,
      title: 'Suivi Production Usine, Audits Intermédiaires & Prélèvements',
      phase: 'Production Industrielle',
      status: 'a_venir',
      progressPct: 0,
      kpis: [
        { label: 'Rapports d\'avancement hebdomadaires', current: '0', target: '3' },
        { label: 'Conformité échantillons tête de série', current: '0%', target: '100%' },
        { label: 'Respect du planning de production', current: 'En attente', target: '> 95%' }
      ],
      deliverables: [
        'Envoi des photos et vidéos des premiers tirages en usine',
        'Contrôle dimensionnel préliminaire des bagues et filetages',
        'Mise à jour automatique des timelines dans l\'espace acheteur'
      ]
    },
    {
      week: 7,
      title: 'Réception au Hub Logistique EcoPool, Contrôle QA & Reconditionnement',
      phase: 'Logistique & Qualité',
      status: 'a_venir',
      progressPct: 0,
      kpis: [
        { label: 'Palettes réceptionnées au Hub Lyon', current: '0', target: '24' },
        { label: 'Taux de passage QA (AQL 1.0)', current: 'N/A', target: '> 99%' },
        { label: 'Délai d\'éclatement & préparation commandes', current: '0 h', target: '< 48 h' }
      ],
      deliverables: [
        'Rapport de contrôle qualité avec photos et relevé d\'épaisseur',
        'Éclatement des palettes usine vers les sous-lots individuels PME',
        'Impression des bordereaux de livraison unifiés EcoPool'
      ]
    },
    {
      week: 8,
      title: 'Expéditions Finales, Rétrocession Séquestre & Bilan Pilote',
      phase: 'Livraison & Bilan',
      status: 'a_venir',
      progressPct: 0,
      kpis: [
        { label: 'Commandes livrées sans réserve', current: '0', target: '18' },
        { label: 'Solde fabricant libéré sous séquestre', current: '0 €', target: '100%' },
        { label: 'NPS de satisfaction PME', current: 'N/A', target: '> 85' }
      ],
      deliverables: [
        'Livraison sur site des PME cosmétiques avec signature électronique',
        'Libération automatique des 70% restants sur le compte séquestre fabricant',
        'Livre blanc et publication des résultats du pilote EcoPool'
      ]
    }
  ]);

  // Actions for incidents
  const handleResolveIncident = (incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          status: 'resolu_clos',
          escrowStatusImpact: 'aucun_impact',
          correctiveAction: 'Litige clos après accord mutuel tripartite. Réserves levées et fonds sécurisés régularisés.'
        };
      }
      return inc;
    }));
    notify('Incident régularisé', 'Le litige a été résolu et archivé avec succès.', 'success');
  };

  const handleToggleFreezeEscrow = (incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        const newImpact = inc.escrowStatusImpact === 'bloque_sequestre' ? 'aucun_impact' : 'bloque_sequestre';
        return { ...inc, escrowStatusImpact: newImpact };
      }
      return inc;
    }));
    notify('Statut Séquestre mis à jour', 'L\'impact sur les fonds cantonnés en séquestre a été actualisé.', 'warning');
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentData.title || !newIncidentData.description) {
      notify('Champs incomplets', 'Veuillez saisir un titre et une description précise.', 'alert');
      return;
    }

    const campaign = campaigns.find(c => c.id === newIncidentData.campaignId) || campaigns[0];

    const newInc: RiskIncident = {
      id: `INC-2026-${String(incidents.length + 1).padStart(3, '0')}`,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      category: newIncidentData.category,
      severity: newIncidentData.severity,
      title: newIncidentData.title,
      description: newIncidentData.description,
      detectedAt: new Date().toISOString().split('T')[0],
      affectedBuyersCount: newIncidentData.affectedBuyersCount,
      totalValueAtRiskEuro: newIncidentData.totalValueAtRiskEuro,
      escrowStatusImpact: newIncidentData.severity === 'bloquante' || newIncidentData.severity === 'critique' ? 'bloque_sequestre' : 'aucun_impact',
      status: 'signale',
      correctiveAction: newIncidentData.correctiveAction || 'Ouverture du dossier d\'arbitrage EcoPool et convocation contradictoire.',
      resolutionDeadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
    };

    setIncidents([newInc, ...incidents]);
    setShowNewIncidentModal(false);
    setNewIncidentData({
      campaignId: 'camp-1',
      category: 'retard_fournisseur',
      severity: 'moderee',
      title: '',
      description: '',
      affectedBuyersCount: 3,
      totalValueAtRiskEuro: 4500,
      correctiveAction: ''
    });
    notify('Incident consigné', `Le dossier ${newInc.id} a été enregistré dans le registre des risques.`, 'info');
  };

  // Risk matrix items definitions
  const riskProtocols = [
    {
      title: '1. Défaillance de paiement ou désistement d\'acheteur',
      riskLevel: 'Éliminé par conception (0%)',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: UserX,
      problem: 'Une PME participante refuse de payer ou dépose le bilan après l\'atteinte du MOQ, risquant de bloquer la commande pour les autres participants.',
      protocol: 'Grâce au compte séquestre bancaire B2B préalable, 100% des fonds sont cantonnés avant l\'émission de l\'ordre de production. Aucun fabricant ne lance la production sans séquestre garanti. En cas de désistement exceptionnel avant clôture, le volume est réaffecté ou le palier recalculé en toute transparence.',
      guarantee: 'Zéro risque d\'impayé pour les autres PME et zéro risque financier pour l\'industriel.'
    },
    {
      title: '2. Retard de fabrication usine ou pénurie matière',
      riskLevel: 'Pénalités & Plan de Continuité',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
      problem: 'Le transformateur industriel subit un retard de calibrage ou un arrivage tardif de polymères PCR certifiés.',
      protocol: 'Contrat cadre imposant des pénalités de retard automatisées déduites du solde séquestre (-1,5% par semaine de retard imputable au fabricant, reversées sous forme de remise aux acheteurs). EcoPool assure une communication unifiée hebdomadaire évitant à chaque PME de relancer l\'usine.',
      guarantee: 'Indemnisation financière directe des PME et priorité de fabrication contractuelle.'
    },
    {
      title: '3. Non-conformité qualité détectée au Hub EcoPool',
      riskLevel: 'Quarantaine & Remplacement Garanti',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: ShieldAlert,
      problem: 'Un lot présente des micro-rayures ou une tolérance de goulot non conforme au cahier des charges (AQL > 1.0).',
      protocol: 'La centralisation au Hub EcoPool permet un contrôle statistique indépendant AVANT l\'expédition aux PME. Si non-conformité avérée : mise en quarantaine immédiate, blocage irréversible du virement séquestre usine, prélèvements contradictoires et obligation de re-fabrication sous 7 jours ou remboursement.',
      guarantee: 'Aucune PME ne reçoit un produit défectueux à ses frais. La trésorerie reste protégée au centime près.'
    },
    {
      title: '4. Avarie de transport ou perte de colis',
      riskLevel: 'Assurance Cargo Ad Valorem 100%',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: Truck,
      problem: 'Casse d\'une palette de flacons de verre ou dommage d\'humidité pendant l\'acheminement final vers l\'entrepôt de la marque.',
      protocol: 'Assurance cargo mutualisée EcoPool Ad Valorem incluse dans toutes les commandes. Stock tampon de sécurité de 3% systématiquement conservé au Hub EcoPool pour expédition de remplacement en 24h chrono, sans attendre l\'expertise d\'assurance.',
      guarantee: 'Continuité de production pour la PME sans rupture de chaîne de conditionnement.'
    },
    {
      title: '5. Non-conformité des certifications écologiques',
      riskLevel: 'Audit documentaire préalable & Registres tiers',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      icon: Award,
      problem: 'Risque de greenwashing ou faux certificats (FSC, GRS, Ecocert) fournis par un sous-traitant.',
      protocol: 'Contrôle systématique des numéros de licence dans les registres publics (base officielle GOTS, base FSC Public Certificate Search, EuCertPlast). Vérification du scope et des dates de validité. Statuts visibles publiquement par tous les acheteurs.',
      guarantee: 'Dossier de conformité légale et allégations RSE audités et opposables aux autorités.'
    }
  ];

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-start gap-3 max-w-md animate-in fade-in slide-in-from-top-4 ${
          toastMessage.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-200' :
          toastMessage.type === 'warning' ? 'bg-amber-950 border-amber-500 text-amber-200' :
          toastMessage.type === 'alert' ? 'bg-rose-950 border-rose-500 text-rose-200' :
          'bg-slate-900 border-slate-700 text-slate-200'
        }`}>
          <div className="flex-1 text-xs">
            <strong className="font-bold block text-sm mb-0.5">{toastMessage.title}</strong>
            {toastMessage.desc}
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-rose-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                Section 22 & 23 — Risques, Litiges & Rétroplanning
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Séquestre Bancaire Actif
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Gestion des Risques B2B, Litiges & Exécution Pilote
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Dans les achats groupés industriels, la confiance repose sur des protocoles inconditionnels : cantonnement séquestre anti-défaillance, contrôle qualité indépendant au Hub, pénalités usine automatisées et arbitrage sous 72h.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewIncidentModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/25 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Déclarer un Incident / Litige
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Taux d'impayé acheteur</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">0,00 %</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Éliminé via séquestre
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Incidents en cours</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {incidents.filter(i => i.status !== 'resolu_clos').length} cas
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-amber-400" /> Délai moy. résolution 48h
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Montant sous séquestre gelé</div>
            <div className="text-xl font-bold text-rose-300 mt-0.5">9 350 €</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-rose-400" /> Protection acheteurs
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Avancement Pilote (Semaine 4)</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">92 %</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-emerald-400" /> 84 500 / 85 000 u.
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Matrice des 5 Risques & Protocoles
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'incidents'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Centre d'Incidents & Litiges ({incidents.filter(i => i.status !== 'resolu_clos').length})
        </button>

        <button
          onClick={() => setActiveTab('pilot_roadmap')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'pilot_roadmap'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Rétroplanning Pilote (8 Semaines)
        </button>

        <button
          onClick={() => setActiveTab('mediation')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'mediation'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Scale className="w-4 h-4" />
          Clauses Contractuelles & Médiation
        </button>
      </div>

      {/* TAB 1: Matrice des Risques & Protocoles Automatisés */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                Cartographie des Risques Majeurs dans les Achats Groupés Industriels
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chaque risque est associé à une barrière d'ingénierie financière ou logistique pour garantir la résilience du groupage.
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
              5 Protocoles Validés
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {riskProtocols.map((risk, index) => {
              const IconComp = risk.icon;
              return (
                <div 
                  key={index}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400 border border-slate-700">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{risk.title}</h4>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border mt-1 inline-block ${risk.badgeColor}`}>
                            {risk.riskLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="font-semibold text-rose-300 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Problème opérationnel :
                        </span>
                        <p className="text-slate-400 leading-relaxed">{risk.problem}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="font-semibold text-emerald-300 flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Protocole EcoPool :
                        </span>
                        <p className="text-slate-300 leading-relaxed">{risk.protocol}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Garantie offerte :</span>
                    <span className="font-medium text-emerald-400 text-right">{risk.guarantee}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Centre d'Incidents & Arbitrage B2B */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Registre Actif des Incidents & Arbitrages
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Suivi transparent des écarts de production, non-conformités de laboratoire et actions de compensation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                {incidents.length} dossiers archivés
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {incidents.map((incident) => (
              <div 
                key={incident.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                  incident.status === 'resolu_clos' 
                    ? 'border-slate-800 opacity-70' 
                    : incident.severity === 'critique' || incident.severity === 'bloquante'
                    ? 'border-rose-500/40'
                    : 'border-amber-500/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl mt-0.5 ${
                      incident.severity === 'critique' || incident.severity === 'bloquante'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : incident.severity === 'moderee'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                          {incident.id}
                        </span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                          incident.severity === 'critique' || incident.severity === 'bloquante'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          Gravité {incident.severity}
                        </span>
                        <span className="text-xs text-slate-400">
                          Détecté le {incident.detectedAt}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {incident.title}
                      </h4>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">
                        Campagne concernée : {incident.campaignTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Impact séquestre :</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        incident.escrowStatusImpact === 'bloque_sequestre'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {incident.escrowStatusImpact === 'bloque_sequestre' ? '🔒 Séquestre Gelé' : '✓ Fonds Actifs'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Valeur engagée : <strong className="text-white">{incident.totalValueAtRiskEuro.toLocaleString()} €</strong> ({incident.affectedBuyersCount} PME)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="font-semibold text-slate-300 block mb-1">Constat & Analyse technique :</span>
                    <p className="text-slate-400 leading-relaxed">{incident.description}</p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <span className="font-semibold text-emerald-400 block mb-1">Mesure corrective & Arbitrage EcoPool :</span>
                    <p className="text-slate-300 leading-relaxed">{incident.correctiveAction}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Échéance de régularisation : <strong className="text-slate-200">{incident.resolutionDeadline}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFreezeEscrow(incident.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        incident.escrowStatusImpact === 'bloque_sequestre'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {incident.escrowStatusImpact === 'bloque_sequestre' ? 'Dégeler le séquestre' : 'Geler le séquestre'}
                    </button>

                    {incident.status !== 'resolu_clos' && (
                      <button
                        onClick={() => handleResolveIncident(incident.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Clôturer l'incident (Accord tripartite)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Rétroplanning Pilote (8 Semaines) */}
      {activeTab === 'pilot_roadmap' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Plan d'Exécution Opérationnel du Pilote (Verticale Cosmétique - 8 Semaines)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chaque semaine déclenche des jalons contraignants pour atteindre le seuil de 85 000 unités et sécuriser l'approvisionnement des PME.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Progression globale :</span>
              <span className="font-bold text-emerald-400">Semaine 4 en cours (65% du temps)</span>
            </div>
          </div>

          <div className="space-y-3">
            {pilotMilestones.map((milestone) => (
              <div 
                key={milestone.week}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                  milestone.status === 'en_cours'
                    ? 'border-emerald-500/50 bg-slate-900/90 ring-1 ring-emerald-500/30'
                    : milestone.status === 'termine'
                    ? 'border-slate-800 opacity-90'
                    : 'border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      milestone.status === 'termine'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : milestone.status === 'en_cours'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      S{milestone.week}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {milestone.phase}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          milestone.status === 'termine'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : milestone.status === 'en_cours'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {milestone.status === 'termine' ? '✓ Terminé' : milestone.status === 'en_cours' ? '● En cours' : 'À venir'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        {milestone.title}
                      </h4>
                    </div>
                  </div>

                  <div className="w-44 text-right">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Complétion</span>
                      <span className="font-bold text-white">{milestone.progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          milestone.status === 'termine' ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                        style={{ width: `${milestone.progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* KPIs and Deliverables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300 block mb-2">KPIs & Métriques clés :</span>
                    <div className="space-y-1.5">
                      {milestone.kpis.map((kpi, kIdx) => (
                        <div key={kIdx} className="flex items-center justify-between text-slate-400">
                          <span>{kpi.label}</span>
                          <span className="font-semibold text-white">
                            {kpi.current} <span className="text-slate-500 font-normal">/ {kpi.target}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-300 block mb-2">Livrables opérationnels :</span>
                    <ul className="space-y-1 text-slate-400">
                      {milestone.deliverables.map((deliv, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                            milestone.status === 'termine' ? 'text-emerald-400' : 'text-slate-600'
                          }`} />
                          <span className={milestone.status === 'termine' ? 'text-slate-300' : 'text-slate-400'}>{deliv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Clauses Contractuelles & Médiation */}
      {activeTab === 'mediation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Cadre Juridique Tripartite EcoPool (Acheteur - Centrale - Fournisseur)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Régit les relations contractuelles, le séquestre financier et les garanties d'approvisionnement responsable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
            <div className="space-y-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Article 1 : Séquestre Bancaire & Inaliénabilité des Fonds
                </h4>
                <p className="text-slate-400">
                  Les sommes versées par les Acheteurs sont cantonnées sur un compte séquestre dédié ouvert auprès d'un établissement de crédit agréé ACPR. Les fonds sont indisponibles pour EcoPool et le Fabricant tant que le contrôle qualité au Hub EcoPool n'a pas validé la conformité du lot complet (AQL 1.0).
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Article 2 : Dégressivité Rétroactive du Tarif
                </h4>
                <p className="text-slate-400">
                  Le prix facturé à chaque PME correspond au palier final le plus avantageux atteint à la clôture de la campagne. Si un volume initialement réservé à 1,10 €/u franchit le palier supérieur à 0,72 €/u, la facture finale est automatiquement ajustée à la baisse pour tous les participants.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Article 3 : Pénalités de Retard et Recours Contre le Fabricant
                </h4>
                <p className="text-slate-400">
                  Tout retard de livraison au Hub supérieur à 5 jours ouvrés entraîne une pénalité forfaitaire de 1,5% par tranche de 7 jours de retard, plafonnée à 15% du montant de la commande industrielle. Cette pénalité est directement déduite du solde libéré au fabricant et redistribuée aux PME.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-400" />
                  Article 4 : Médiation Accélérée & Arbitrage sous 72h
                </h4>
                <p className="text-slate-400">
                  En cas de litige relatif à la conformité technique, un prélèvement d'échantillon scellé au Hub EcoPool est soumis à un laboratoire tiers indépendant agréé sous 48 heures. La décision du laboratoire s'impose aux deux parties. En cas de non-conformité, remboursement intégral sous 5 jours.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Incident Form */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Déclarer un Incident ou Litige Opérationnel
              </h3>
              <button 
                onClick={() => setShowNewIncidentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Campagne concernée</label>
                <select
                  value={newIncidentData.campaignId}
                  onChange={(e) => setNewIncidentData({ ...newIncidentData, campaignId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Catégorie du risque</label>
                  <select
                    value={newIncidentData.category}
                    onChange={(e: any) => setNewIncidentData({ ...newIncidentData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="retard_fournisseur">Retard Fournisseur</option>
                    <option value="non_conformite_qa">Non-conformité Qualité QA Hub</option>
                    <option value="avarie_transport">Avarie de Transport</option>
                    <option value="defaillance_acheteur">Défaut Acheteur</option>
                    <option value="audit_certification">Audit & Certification RSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gravité</label>
                  <select
                    value={newIncidentData.severity}
                    onChange={(e: any) => setNewIncidentData({ ...newIncidentData, severity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="faible">Faible (Informationnel)</option>
                    <option value="moderee">Modérée (Retard mineur)</option>
                    <option value="critique">Critique (Gel séquestre requis)</option>
                    <option value="bloquante">Bloquante (Arrêt production)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Objet du litige / Titre court</label>
                <input
                  type="text"
                  placeholder="ex: Défaut d'étanchéité bague 24/410 sur lot pilote"
                  value={newIncidentData.title}
                  onChange={(e) => setNewIncidentData({ ...newIncidentData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description détaillée des faits</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez les résultats du contrôle au Hub, les numéros de lots, les tolérances mesurées..."
                  value={newIncidentData.description}
                  onChange={(e) => setNewIncidentData({ ...newIncidentData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PME impactées (estimation)</label>
                  <input
                    type="number"
                    min="1"
                    value={newIncidentData.affectedBuyersCount}
                    onChange={(e) => setNewIncidentData({ ...newIncidentData, affectedBuyersCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Montant à risque (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newIncidentData.totalValueAtRiskEuro}
                    onChange={(e) => setNewIncidentData({ ...newIncidentData, totalValueAtRiskEuro: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mesure conservatoire recommandée</label>
                <input
                  type="text"
                  placeholder="ex: Mise en quarantaine lot + prélèvement contradictoire sous 24h"
                  value={newIncidentData.correctiveAction}
                  onChange={(e) => setNewIncidentData({ ...newIncidentData, correctiveAction: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewIncidentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-all shadow-lg shadow-rose-600/25"
                >
                  Enregistrer & Ouvrir l'Arbitrage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
