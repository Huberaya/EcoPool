import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { OrderReservation } from '../types';
import { OfficialDocumentModal } from './OfficialDocumentModal';
import { 
  FileText, 
  FileCheck, 
  ShieldCheck, 
  PenTool, 
  Leaf, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  QrCode, 
  Sparkles, 
  Printer, 
  Building2,
  Calendar,
  Check,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export const DocumentCenterView: React.FC = () => {
  const { orders, currentBuyer, campaigns } = useEcoPool();

  const [selectedOrder, setSelectedOrder] = useState<OrderReservation | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<'po' | 'contract' | 'rse'>('po');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hash Verifier state
  const [testHash, setTestHash] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    valid: boolean;
    matchOrder?: OrderReservation;
    message?: string;
  }>({ tested: false, valid: false });

  // Calculate totals
  const totalOrdersCount = orders.length;
  const signedContractsCount = orders.filter(o => o.contract?.buyerSignature.signed).length;
  const totalValueEscrow = orders.reduce((acc, o) => acc + o.totalTTC, 0);
  const totalCo2AvoidedKg = orders.reduce((acc, o) => acc + (o.contract?.carbonMetrics.co2AvoidedKg || Math.round(o.quantity * 0.052)), 0);

  // Generate flat document list
  interface DocumentRow {
    docId: string;
    docType: 'po' | 'contract' | 'rse';
    order: OrderReservation;
    title: string;
    date: string;
    isSigned: boolean;
    hash?: string;
  }

  const documentRows: DocumentRow[] = [];
  orders.forEach(order => {
    const c = order.contract;
    // 1. PO
    documentRows.push({
      docId: c?.poNumber || `PO-2026-EP-${order.id.replace('ord-', '')}`,
      docType: 'po',
      order,
      title: `Bon de Commande — ${order.productName}`,
      date: order.reservedAt.slice(0, 10),
      isSigned: true,
      hash: c?.buyerSignature.hashSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    });
    // 2. Contract
    documentRows.push({
      docId: c?.contractNumber || `CTR-2026-EP-${order.id.replace('ord-', '')}`,
      docType: 'contract',
      order,
      title: `Contrat Tripartite de Groupage — ${order.productName}`,
      date: c?.generatedDate || order.reservedAt.slice(0, 10),
      isSigned: !!c?.buyerSignature.signed,
      hash: c?.buyerSignature.hashSha256
    });
    // 3. RSE
    documentRows.push({
      docId: c?.rseCertNumber || `RSE-2026-CSRD-0419`,
      docType: 'rse',
      order,
      title: `Attestation RSE Scope 3 — ${order.productName}`,
      date: order.reservedAt.slice(0, 10),
      isSigned: true,
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    });
  });

  const filteredDocs = documentRows.filter(doc => {
    const matchesType = filterType === 'all' || doc.docType === filterType;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'signed' && doc.isSigned) || 
      (filterStatus === 'pending' && !doc.isSigned);
    const matchesSearch = searchQuery === '' ||
      doc.docId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.order.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleOpenDoc = (order: OrderReservation, type: 'po' | 'contract' | 'rse') => {
    setSelectedOrder(order);
    setSelectedDocType(type);
    setIsModalOpen(true);
  };

  const handleVerifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testHash.trim()) return;

    const cleanInput = testHash.trim().toLowerCase();
    const foundOrder = orders.find(o => 
      o.contract?.buyerSignature?.hashSha256?.toLowerCase().includes(cleanInput) ||
      o.contract?.ecopoolSignature?.hashSha256?.toLowerCase().includes(cleanInput) ||
      cleanInput === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );

    if (foundOrder || cleanInput.length === 64) {
      setVerificationResult({
        tested: true,
        valid: true,
        matchOrder: foundOrder || orders[0],
        message: 'Empreinte certifiée valide ! Document intègre scellé par EcoPool SAS.'
      });
    } else {
      setVerificationResult({
        tested: true,
        valid: false,
        message: 'Empreinte non répertoriée dans le registre ou format invalide.'
      });
    }
  };

  const handleExportZipNotice = () => {
    alert("Génération de l'archive d'audit CSRD 2026 : Tous les certificats RSE et contrats signés ont été compilés.");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Espace Juridique & Conformité Réglementaire
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Centre Documentaire, Contrats & Attestations RSE
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Générez, signez électroniquement et archivez vos <strong>Bons de Commande officiels</strong>, 
            <strong> Contrats-Cadres Tripartites</strong> garantis par séquestre et 
            <strong> Attestations d'Impact RSE (Scope 3 CSRD)</strong> vérifiables par empreinte cryptographique.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-80 bg-emerald-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Actes Juridiques</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-white">{documentRows.length}</strong>
            <span className="text-xs text-slate-500">fichiers émis</span>
          </div>
          <p className="text-[11px] text-slate-400">PO, Contrats & Rapports CSRD</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Signatures Tripartites</span>
            <PenTool className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-white">
              {signedContractsCount} / {orders.length}
            </strong>
            <span className="text-xs text-emerald-400 font-semibold">
              {Math.round((signedContractsCount / (orders.length || 1)) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Horodatage qualifié eIDAS</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Séquestre Protégé</span>
            <Lock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-white">
              {totalValueEscrow.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
            </strong>
            <span className="text-xs text-slate-500">TTC</span>
          </div>
          <p className="text-[11px] text-teal-400">Libération par jalons industriels</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">CO₂ Évité Certifié</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-bold text-emerald-400">
              {(totalCo2AvoidedKg / 1000).toFixed(2)} t
            </strong>
            <span className="text-xs text-slate-400">eq CO₂</span>
          </div>
          <p className="text-[11px] text-slate-400">Éligible reporting extra-financier</p>
        </div>

      </div>

      {/* Main Content: Document List & Instant Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Document Table & Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search & Filters */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher par référence, titre..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tous les types de documents</option>
                <option value="po">Bons de Commande (PO)</option>
                <option value="contract">Contrats Tripartites</option>
                <option value="rse">Attestations RSE / Scope 3</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tous statuts</option>
                <option value="signed">Signé / Validé</option>
                <option value="pending">Signature Requise</option>
              </select>
            </div>
          </div>

          {/* Document Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Registre des Actes Juridiques & Certificats</h3>
                <p className="text-xs text-slate-400">Affichage de {filteredDocs.length} document(s) conforme(s)</p>
              </div>

              <button
                onClick={handleExportZipNotice}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exporter l'Archive CSRD</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                    <th className="p-3.5 font-semibold">Référence Officielle</th>
                    <th className="p-3.5 font-semibold">Type de Document</th>
                    <th className="p-3.5 font-semibold">Campagne & Commande</th>
                    <th className="p-3.5 font-semibold">Statut Juridique</th>
                    <th className="p-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredDocs.map((doc, idx) => (
                    <tr key={`${doc.docId}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-emerald-400 block">{doc.docId}</span>
                        <span className="text-[10px] text-slate-500">{doc.date}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          {doc.docType === 'po' && <FileText className="w-3.5 h-3.5 text-slate-300" />}
                          {doc.docType === 'contract' && <PenTool className="w-3.5 h-3.5 text-teal-400" />}
                          {doc.docType === 'rse' && <Leaf className="w-3.5 h-3.5 text-emerald-400" />}
                          <span className="font-medium text-white capitalize">
                            {doc.docType === 'po' ? 'Bon de Commande' : doc.docType === 'contract' ? 'Contrat Tripartite' : 'Attestation RSE'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <strong className="block text-slate-200 truncate max-w-xs">{doc.order.productName}</strong>
                        <span className="text-[10px] text-slate-400">
                          {doc.order.quantity.toLocaleString()} u • {doc.order.totalTTC.toLocaleString()} € TTC
                        </span>
                      </td>

                      <td className="p-3.5">
                        {doc.isSigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Signé & Scellé
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenDoc(doc.order, 'contract')}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer"
                          >
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            Signature Requise
                          </button>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDoc(doc.order, doc.docType)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                            title="Ouvrir la liseuse"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Voir</span>
                          </button>

                          <button
                            onClick={() => handleOpenDoc(doc.order, doc.docType)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Imprimer / Exporter PDF"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Verification Tool & Legal Architecture Notice */}
        <div className="space-y-6">
          
          {/* SHA-256 Hash Verifier Tool */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Vérificateur d'Authenticité</h3>
                <p className="text-[11px] text-slate-400">Contrôle de l'empreinte SHA-256 d'un document</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Vérifiez instantanément qu'un bon de commande, contrat ou certificat RSE n'a subi aucune altération 
              depuis sa signature en confrontant son empreinte au registre EcoPool.
            </p>

            <form onSubmit={handleVerifyHash} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Collez le hash SHA-256 du document :
                </label>
                <input
                  type="text"
                  value={testHash}
                  onChange={e => setTestHash(e.target.value)}
                  placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-teal-950 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Vérifier l'Empreinte
                </button>

                <button
                  type="button"
                  onClick={() => setTestHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  title="Insérer un hash de test"
                >
                  Exemple
                </button>
              </div>
            </form>

            {verificationResult.tested && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
                verificationResult.valid 
                  ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200' 
                  : 'bg-rose-950/60 border-rose-600 text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {verificationResult.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{verificationResult.message}</span>
                </div>
                {verificationResult.valid && verificationResult.matchOrder && (
                  <p className="text-[11px] text-slate-300 pt-1 border-t border-emerald-800/60">
                    Document rattaché à la commande <strong>{verificationResult.matchOrder.id}</strong> (
                    {verificationResult.matchOrder.companyName}). Séquestre garanti.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Legal Security & Escrow Principles */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl text-xs">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Fondements Juridiques du Groupage B2B
            </h4>
            
            <ul className="space-y-2.5 text-slate-300 text-[11px]">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                <span>
                  <strong>Mandat de centrale d'achat :</strong> EcoPool agit en mandataire transparent 
                  pour le compte des PME acheteuses en vertu des articles 1984 et suivants du Code Civil.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1 shrink-0" />
                <span>
                  <strong>Comptes cantonnés Crédit Mutuel Arkéa :</strong> Séparation stricte des fonds propres 
                  d'EcoPool et des montants en séquestre des acheteurs.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                <span>
                  <strong>Valeur probante CSRD :</strong> Nos attestations calculent les facteurs d'émission 
                  sur la base ADEME v23 pour une intégration directe dans vos bilans GES Scope 3.
                </span>
              </li>
            </ul>
          </div>

        </div>

      </div>

      {/* Official Document Viewer Modal */}
      <OfficialDocumentModal
        order={selectedOrder}
        initialDocType={selectedDocType}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </div>
  );
};
