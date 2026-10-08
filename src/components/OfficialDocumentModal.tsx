import React, { useState } from 'react';
import { useEcoPool } from '../context/EcoPoolContext';
import { OrderReservation } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  PenTool, 
  Leaf, 
  Copy, 
  Check, 
  QrCode, 
  Lock, 
  Building2, 
  Factory, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface OfficialDocumentModalProps {
  order: OrderReservation | null;
  initialDocType?: 'po' | 'contract' | 'rse';
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialDocumentModal: React.FC<OfficialDocumentModalProps> = ({
  order,
  initialDocType = 'po',
  isOpen,
  onClose
}) => {
  const { currentBuyer, campaigns, signContract } = useEcoPool();
  const [docType, setDocType] = useState<'po' | 'contract' | 'rse'>(initialDocType);
  const [copiedHash, setCopiedHash] = useState(false);
  
  // Signature form state
  const [signName, setSignName] = useState(currentBuyer.contactName || 'Dr. Hélène Mercier');
  const [signTitle, setSignTitle] = useState('Directrice Achats & RSE');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signingSuccess, setSigningSuccess] = useState(false);

  // Sync initial doc type when opened
  React.useEffect(() => {
    if (initialDocType) {
      setDocType(initialDocType);
    }
  }, [initialDocType, isOpen]);

  if (!isOpen || !order) return null;

  const campaign = campaigns.find(c => c.id === order.campaignId);
  const contract = order.contract;
  const isBuyerSigned = contract?.buyerSignature?.signed;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadJSON = () => {
    const exportData = {
      orderId: order.id,
      poNumber: contract?.poNumber || `PO-2026-EP-${order.id.replace('ord-', '')}`,
      contractNumber: contract?.contractNumber || `CTR-2026-EP-${order.id.replace('ord-', '')}`,
      rseCertNumber: contract?.rseCertNumber || `RSE-2026-CSRD-0419`,
      buyer: {
        name: currentBuyer.companyName,
        siren: currentBuyer.siren,
        contact: currentBuyer.contactName,
        address: currentBuyer.deliveryAddress
      },
      supplier: campaign?.supplier.name || 'Fabricant Certifié EcoPool',
      product: {
        name: order.productName,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        material: campaign?.product.material,
        recycledPct: campaign?.product.recycledPercentage
      },
      financials: {
        goodsTotal: order.goodsTotal,
        ecopoolCommission: order.ecopoolFee,
        logisticsCrossDocking: order.logisticsFee,
        totalTTC: order.totalTTC,
        escrowStatus: order.escrowStatus
      },
      signatures: contract ? {
        buyer: contract.buyerSignature,
        ecopool: contract.ecopoolSignature,
        supplier: contract.supplierSignature
      } : null,
      carbonMetrics: contract?.carbonMetrics
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract?.poNumber || order.id}_export_officiel.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms || !signName) return;

    signContract(order.id, signName, signTitle);
    setSigningSuccess(true);
    setTimeout(() => setSigningSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Top Modal Header (Hidden on Print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Éditeur & Certificats Juridiques B2B</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {order.id.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">Documents officiels vérifiables par tiers de confiance séquestre.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Imprimer ou enregistrer en PDF via le navigateur"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Exporter les données structurées"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs between Documents (Hidden on Print) */}
        <div className="px-6 pt-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0 no-print">
          <button
            onClick={() => setDocType('po')}
            className={`pb-3 px-3 font-semibold transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              docType === 'po'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            1. Bon de Commande (Purchase Order B2B)
          </button>

          <button
            onClick={() => setDocType('contract')}
            className={`pb-3 px-3 font-semibold transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap relative ${
              docType === 'contract'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
            2. Contrat-Cadre Tripartite & Signature
            {isBuyerSigned ? (
              <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            ) : (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[10px] rounded-full border border-amber-500/40">
                À signer
              </span>
            )}
          </button>

          <button
            onClick={() => setDocType('rse')}
            className={`pb-3 px-3 font-semibold transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              docType === 'rse'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Leaf className="w-4 h-4 text-emerald-400" />
            3. Attestation RSE & Bilan Scope 3 (CSRD)
          </button>
        </div>

        {/* Scrollable Printable Document Viewport */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-950/50">
          
          {/* Printable Document Paper Card */}
          <div className="printable-document max-w-3xl mx-auto bg-white text-slate-900 rounded-xl shadow-xl p-6 sm:p-10 border border-slate-200">
            
            {/* ============================================================ */}
            {/* VIEW 1: BON DE COMMANDE OFFICIEL (PURCHASE ORDER B2B) */}
            {/* ============================================================ */}
            {docType === 'po' && (
              <div className="space-y-6 text-xs text-slate-700">
                
                {/* Official Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-base">
                        EP
                      </div>
                      <span className="text-xl font-extrabold text-slate-900 tracking-tight">EcoPool SAS</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Centrale d'Achat Collaborative B2B Responsable</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                      42 Avenue de l'Éco-Industrie, 75011 Paris • SIREN : 921 448 302<br />
                      TVA : FR 88 921448302 • Agrément Mandataire d'Achat Groupé B2B
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-100 rounded-md font-mono font-bold text-sm text-slate-900 border border-slate-300">
                      {contract?.poNumber || `PO-2026-EP-${order.id.replace('ord-', '')}`}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">Date d'émission : {order.reservedAt.slice(0, 10)}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">Statut : Fonds cantonnés en séquestre</p>
                  </div>
                </div>

                {/* Parties (Acheteur PME & Fabricant Adjudicataire) */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Donneur d'Ordre (Acheteur PME)
                    </span>
                    <strong className="text-sm text-slate-900 block">{currentBuyer.companyName}</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      SIREN : {currentBuyer.siren} • Contact : {currentBuyer.contactName}<br />
                      {currentBuyer.deliveryAddress.street}, {currentBuyer.deliveryAddress.postalCode} {currentBuyer.deliveryAddress.city}<br />
                      Email : {currentBuyer.email}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Fabricant Industriel Partenaire
                    </span>
                    <strong className="text-sm text-slate-900 block">
                      {campaign?.supplier.name || 'Plastinnov Normandie'}
                    </strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Usine : {campaign?.supplier.factoryLocation || 'Site de Dieppe (76)'}<br />
                      Certifications : GRS 4.0 (Global Recycled Standard), FSC-C1294<br />
                      Régime Logistique : Cross-docking Hub EcoPool Normandie
                    </p>
                  </div>
                </div>

                {/* Product & Pricing Table */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wide">
                    Désignation de la Commande Groupée
                  </h4>
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px]">
                        <th className="p-2.5 font-semibold">Référence & Description</th>
                        <th className="p-2.5 font-semibold text-right">Matière & Grade</th>
                        <th className="p-2.5 font-semibold text-right">Volume</th>
                        <th className="p-2.5 font-semibold text-right">Prix Unitaire Groupé</th>
                        <th className="p-2.5 font-semibold text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      <tr>
                        <td className="p-2.5 font-medium">
                          <strong className="block text-slate-900">{order.productName}</strong>
                          <span className="text-[10px] text-slate-500">
                            Campagne : {order.campaignTitle}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-[11px]">
                          {campaign?.product.material || 'HDPE 100% Recyclé PCR'}
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          {order.quantity.toLocaleString()} u
                        </td>
                        <td className="p-2.5 text-right font-semibold text-emerald-700">
                          {order.unitPrice.toFixed(2)} €
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          {order.goodsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary & Breakdown */}
                <div className="flex justify-end pt-2">
                  <div className="w-72 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Sous-total Matières HT :</span>
                      <span>{order.goodsTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Frais Frais Plateforme EcoPool (6.5%) :</span>
                      <span>{order.ecopoolFee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Acheminement & Cross-docking Hub :</span>
                      <span>{order.logisticsFee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-2 font-bold text-slate-900 text-sm">
                      <span>Net à Payer Séquestre TTC :</span>
                      <span className="text-emerald-700">
                        {order.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 pt-1">
                      Mode de règlement : {order.paymentMethod === 'prelevement_sepa_b2b' ? 'Prélèvement SEPA B2B Escrow' : 'Virement Bancaire Séquestre'}
                    </p>
                  </div>
                </div>

                {/* Legal & Escrow Terms */}
                <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Conditions de Séquestre & Garantie de Livraison :</p>
                  <p>
                    Les fonds versés sont cantonnés sur le compte séquestre dédié d'EcoPool SAS (IBAN FR76 1820 6002 0000 8829 104) 
                    auprès de l'établissement bancaire partenaire. Les fonds ne seront transférés au fabricant qu'après validation 
                    du contrôle qualité AQL 1.5 au Hub EcoPool Normandie et délivrance du bon de livraison émargé.
                  </p>
                  <div className="flex items-center justify-between pt-3">
                    <span className="font-mono text-[9px] text-slate-400">
                      Horodatage système : {order.reservedAt} • Réf Hub : {order.hubTrackingNumber || 'HUB-NRM-2026'}
                    </span>
                    <span className="font-semibold text-emerald-800">
                      Document certifié conforme par EcoPool SAS
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 2: CONTRAT-CADRE TRIPARTITE & SIGNATURE ÉLECTRONIQUE */}
            {/* ============================================================ */}
            {docType === 'contract' && (
              <div className="space-y-6 text-xs text-slate-700">
                
                {/* Contract Header */}
                <div className="text-center border-b border-slate-200 pb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] mb-2 uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Contrat-Cadre de Mutualisation Tripartite B2B
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Accord de Groupage d’Achat Industriel & Séquestre
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    RÉFÉRENCE CONTRAT : {contract?.contractNumber || `CTR-2026-EP-${order.id.replace('ord-', '')}`}
                  </p>
                </div>

                {/* Contract Articles */}
                <div className="space-y-4 text-justify leading-relaxed text-slate-700 text-[11px]">
                  <div>
                    <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                      Préambule & Parties Signataires
                    </h5>
                    <p>
                      Le présent contrat est conclu entre : <strong>{currentBuyer.companyName}</strong> (ci-après l'Acheteur), 
                      <strong> EcoPool SAS</strong> (ci-après le Mandataire Centralisateur), et 
                      <strong> {campaign?.supplier.name || 'Plastinnov Normandie'}</strong> (ci-après l'Industriel Fabricant).
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                      Article 1 — Objet & Rôle du Mandataire
                    </h5>
                    <p>
                      L'Acheteur mandate expressément EcoPool SAS pour agréger son volume de commande de 
                      <strong> {order.quantity.toLocaleString()} unités</strong> avec les volumes des co-acheteurs de la campagne 
                      afin de franchir la Quantité Minimale de Commande (MOQ) de {campaign?.moq.toLocaleString()} unités et 
                      bénéficier du tarif industriel dégressif négocié de {order.unitPrice.toFixed(2)} € HT/unité.
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                      Article 2 — Mécanisme de Déblocage Échelonné par Jalons (Escrow)
                    </h5>
                    <p>
                      Conformément à la politique de sécurisation EcoPool, les fonds cantonné de 
                      <strong> {order.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € TTC</strong> sont 
                      libérés au fabricant selon trois jalons industriels stricts :
                    </p>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
                      <li><strong>Jalon 1 (30%) :</strong> Approvisionnement de la matière certifiée (PCR / GRS) et calage des moules.</li>
                      <li><strong>Jalon 2 (50%) :</strong> Réception au Hub central EcoPool et validation du contrôle qualité (AQL 1.5).</li>
                      <li><strong>Jalon 3 (20%) :</strong> Expédition finale vers les entrepôts de l'Acheteur et émargement du bordereau.</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                      Article 3 — Garantie d'Exécution & Non-Défaillance
                    </h5>
                    <p>
                      EcoPool SAS garantit le maintien du tarif négocié pour l'Acheteur. En cas de désistement imprévu d'un co-acheteur 
                      participant à la même campagne, le fonds de réserve EcoPool prend en charge le différentiel de volume 
                      sans aucun surcoût ni annulation pour les acheteurs signataires.
                    </p>
                  </div>
                </div>

                {/* Tripartite Signatures Grid */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs mb-3 uppercase tracking-wide">
                    Signatures Électroniques Tripartites (Conformes eIDAS)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* 1. Acheteur PME */}
                    <div className={`p-3 rounded-xl border text-[11px] ${
                      isBuyerSigned 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold uppercase text-[9px] tracking-wider text-slate-500">
                          1. Acheteur PME
                        </span>
                        {isBuyerSigned ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      
                      {isBuyerSigned ? (
                        <div className="space-y-1">
                          <strong className="block text-slate-900">{contract?.buyerSignature.signatoryName}</strong>
                          <span className="text-[10px] text-slate-600 block">{contract?.buyerSignature.signatoryTitle}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            ✓ Signé le {contract?.buyerSignature.signedAt}
                          </span>
                          <div className="mt-2 font-mono text-[8px] text-slate-400 truncate">
                            SHA-256: {contract?.buyerSignature.hashSha256?.slice(0, 20)}...
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <strong className="block text-amber-900">{currentBuyer.companyName}</strong>
                          <span className="text-[10px] text-amber-700 block">En attente de signature</span>
                          <span className="text-[9px] text-amber-600 italic block">Voir module de signature ci-dessous</span>
                        </div>
                      )}
                    </div>

                    {/* 2. EcoPool SAS */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-[11px] text-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold uppercase text-[9px] tracking-wider text-slate-500">
                          2. EcoPool Mandataire
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <strong className="block text-slate-900">{contract?.ecopoolSignature?.signatoryName || 'Alexandre Roche (EcoPool)'}</strong>
                      <span className="text-[10px] text-slate-600 block">Direction Juridique & Conformité</span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        ✓ Contre-seing eIDAS validé
                      </span>
                      <div className="mt-2 font-mono text-[8px] text-slate-400 truncate">
                        SHA: {contract?.ecopoolSignature?.hashSha256?.slice(0, 20)}...
                      </div>
                    </div>

                    {/* 3. Industriel Fabricant */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 text-[11px] text-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold uppercase text-[9px] tracking-wider text-slate-500">
                          3. Industriel Fabricant
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <strong className="block text-slate-900">{contract?.supplierSignature?.signatoryName || campaign?.supplier.name}</strong>
                      <span className="text-[10px] text-slate-600 block">Direction d'Usine & Ordonnancement</span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        ✓ Bon de fabrication accepté
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-2">Capacité industrielle garantie</span>
                    </div>

                  </div>
                </div>

                {/* Interactive Electronic Signature Widget (if not signed) */}
                {!isBuyerSigned && (
                  <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white border border-slate-700 space-y-3 no-print">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <PenTool className="w-4 h-4" />
                      Signer électroniquement ce contrat tripartite
                    </div>
                    
                    <form onSubmit={handleExecuteSign} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Nom du signataire habilité</label>
                          <input
                            type="text"
                            value={signName}
                            onChange={(e) => setSignName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            placeholder="ex: Dr. Hélène Mercier"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Qualité / Fonction</label>
                          <input
                            type="text"
                            value={signTitle}
                            onChange={(e) => setSignTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                            placeholder="ex: Directrice Achats & RSE"
                            required
                          />
                        </div>
                      </div>

                      <label className="flex items-start gap-2 text-[11px] text-slate-300 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>
                          Je reconnais avoir pris connaissance des conditions de groupage, du mandat confié à EcoPool SAS 
                          et des modalités de séquestre bancaire, et j'appose ma signature électronique certifiée.
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={!acceptTerms || !signName}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                          acceptTerms && signName
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Apposer ma Signature Électronique Certifiée
                      </button>
                    </form>
                  </div>
                )}

                {signingSuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Contrat signé avec succès ! L'empreinte cryptographique horodatée a été générée.</span>
                  </div>
                )}

              </div>
            )}

            {/* ============================================================ */}
            {/* VIEW 3: ATTESTATION OFFICIELLE D'IMPACT RSE & BILAN SCOPE 3 */}
            {/* ============================================================ */}
            {docType === 'rse' && (
              <div className="space-y-6 text-xs text-slate-700">
                
                {/* Header with Eco Certificate Stamp */}
                <div className="flex justify-between items-start border-b-2 border-emerald-700 pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-700 text-white">
                        <Leaf className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-emerald-950 tracking-tight">
                          ATTESTATION D'ACHAT RESPONSABLE & BILAN SCOPE 3
                        </h3>
                        <p className="text-[11px] text-emerald-800 font-semibold">
                          Conforme aux exigences extra-financières CSRD & Décret AGEC
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-md font-mono text-emerald-900 font-bold text-xs">
                      {contract?.rseCertNumber || `RSE-2026-CSRD-0419`}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">Émis le : {order.reservedAt.slice(0, 10)}</p>
                    <p className="text-[10px] text-emerald-700 font-bold">Auditabilité Tierce Partie</p>
                  </div>
                </div>

                {/* Beneficiary Box */}
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-950 leading-relaxed">
                    Il est certifié par <strong>EcoPool SAS</strong>, centrale d'achat responsable agréée, que l'entreprise :
                  </p>
                  <div className="mt-2 text-sm font-bold text-slate-900">
                    {currentBuyer.companyName} (SIREN : {currentBuyer.siren})
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    a souscrit à la commande groupée de <strong>{order.quantity.toLocaleString()} unités</strong> de 
                    <strong> {order.productName}</strong> fabriquées en 
                    <strong> {campaign?.product.material || 'HDPE 100% Recyclé Post-Consommation'}</strong> 
                    auprès de l'usine certifiée <strong>{campaign?.supplier.name || 'Plastinnov Normandie'}</strong>.
                  </p>
                </div>

                {/* Key Environmental Metrics Grid */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 uppercase text-[11px] tracking-wide">
                    Indicateurs d'Impact Évités Validés (Calcul Référentiel ADEME Base Carbone®)
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                        CO₂ Évité (Scope 3)
                      </span>
                      <strong className="text-lg font-black text-emerald-700 block mt-1">
                        {contract?.carbonMetrics?.co2AvoidedKg || Math.round(order.quantity * 0.052)} kg
                      </strong>
                      <span className="text-[9px] text-slate-500">eq. matière vierge évitée</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                        Plastique Vierge Évité
                      </span>
                      <strong className="text-lg font-black text-teal-700 block mt-1">
                        {contract?.carbonMetrics?.virginPlasticAvoidedKg || Math.round(order.quantity * 0.026)} kg
                      </strong>
                      <span className="text-[9px] text-slate-500">ressource fossile préservée</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                        Taux de Circularité
                      </span>
                      <strong className="text-lg font-black text-blue-700 block mt-1">
                        {contract?.carbonMetrics?.recycledContentPct || 100}%
                      </strong>
                      <span className="text-[9px] text-slate-500">Matière PCR certifiée</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                        Eau Préservée
                      </span>
                      <strong className="text-lg font-black text-indigo-700 block mt-1">
                        {contract?.carbonMetrics?.waterSavedLiters || Math.round(order.quantity * 0.13)} L
                      </strong>
                      <span className="text-[9px] text-slate-500">cycle industriel fermé</span>
                    </div>

                  </div>
                </div>

                {/* Audit & Traceability Evidence */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Numéro de Licence Certification :</span>
                    <span className="font-mono text-slate-700">GRS-ID-7729103 (Control Union) & FSC-C1294</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Recyclabilité en Fin de Vie :</span>
                    <span className="font-mono text-emerald-800 font-bold">100% Recyclable Filière Standard (Code 2 HDPE)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Optimisation Fret Amont (Hub Normandie) :</span>
                    <span className="font-mono text-slate-700">-62% de kilomètres logistiques par groupage palette</span>
                  </div>
                </div>

                {/* Cryptographic Seal & CSRD Disclosure Stamp */}
                <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Preuve Numérique Infalsifiable
                      </span>
                      <span className="font-mono text-[9px] text-slate-600 block">
                        SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        Validé pour le bilan carbone de fin d'exercice
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-center">
                      <span className="text-[9px] font-bold text-emerald-900 block uppercase">
                        Sceau d’Audit EcoPool SAS
                      </span>
                      <span className="text-[8px] text-emerald-700 block">Direction RSE & Neutralité</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Bottom Security Fingerprint Bar (Hidden on Print) */}
          <div className="max-w-3xl mx-auto mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 no-print">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px]">
                Preuve d'intégrité : {contract?.buyerSignature?.hashSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </span>
            </div>

            <button
              onClick={() => handleCopyHash(contract?.buyerSignature?.hashSha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Empreinte Copiée !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le Hash SHA-256</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
