import crypto from 'crypto';
import { getState, setState } from './db';
import { SystemNotification } from '../types';
import { sseBroker } from './sse';

// ============================================================================
// PHASE 3.1 : MOTEUR FACTUR-X 2026 & CONNECTEURS PDP / CHORUS PRO
// Norme Franco-Allemande Factur-X (CII - Cross Industry Invoice / EN16931)
// ============================================================================

export type FacturXLifecycleStatus = 
  | 'BROUILLON'
  | 'DEPOSEE'         // Transmise à la Plateforme de Dématérialisation Partenaire (PDP)
  | 'ACHEMINEE'       // Reçue par la PDP de l'acheteur ou Chorus Pro
  | 'RECUE'           // Intégrée dans l'ERP comptable de l'acheteur
  | 'APPROUVEE'       // Validée pour mise en paiement
  | 'PAIEMENT_EMIS'   // Déblocage séquestre exécuté
  | 'LITIGE_SUSPENDUE'; // Contestée pour non-conformité

export interface FacturXInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  campaignId: string;
  issueDate: string;
  dueDate: string;
  seller: {
    name: string;
    siren: string;
    siret: string;
    vatNumber: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  buyer: {
    name: string;
    siren: string;
    vatNumber: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  lineItems: Array<{
    itemDescription: string;
    quantity: number;
    unitPriceHT: number;
    totalHT: number;
    vatRatePct: number;
    vatAmount: number;
    discountPct: number;
  }>;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  currency: string;
  escrowVirtualIban: string;
  status: FacturXLifecycleStatus;
  pdpRouting: {
    pdpProvider: string;
    chorusProId?: string;
    transmissionTimestamp?: string;
    acknowledgementReceipt?: string;
    sha256Digest: string;
  };
  xmlCiiPayload: string;
}

// In-memory store of Factur-X invoices
let generatedFacturXInvoices: FacturXInvoice[] = [];

/**
 * Calcul du hachage d'intégrité SHA-256
 */
function calculateSha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Générateur de XML sémantique Factur-X (Cross Industry Invoice - EN16931)
 */
export function generateCiiXml(invoice: Omit<FacturXInvoice, 'xmlCiiPayload' | 'pdpRouting'> & { pdpRouting?: any }): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  
  <!-- CONTEXTE RÉGLEMENTAIRE REFORME 2026 -->
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <!-- EN-TÊTE FACTURE -->
  <rsm:ExchangedDocument>
    <ram:ID>${invoice.invoiceNumber}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode> <!-- 380 = Facture commerciale standard -->
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${invoice.issueDate.replace(/-/g, '')}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>Mutualisation EcoPool - Achat Groupé Responsable. Paiement cantonnée sous séquestre ACPR.</ram:Content>
    </ram:IncludedNote>
  </rsm:ExchangedDocument>

  <!-- TRANSACTION COMMERCIALE -->
  <rsm:SupplyChainTradeTransaction>
    <!-- LIGNES DE FACTURATION -->
    ${invoice.lineItems.map((item, idx) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${idx + 1}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${item.itemDescription.replace(/&/g, '&amp;')}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${item.unitPriceHT.toFixed(4)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${item.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:RateApplicablePercent>${item.vatRatePct.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${item.totalHT.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    `).join('')}

    <!-- PARTIES PRENANTES : FOURNISSEUR & ACHETEUR -->
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${invoice.seller.name.replace(/&/g, '&amp;')}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${invoice.seller.siret}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${invoice.seller.postalCode}</ram:PostcodeCode>
          <ram:LineOne>${invoice.seller.street.replace(/&/g, '&amp;')}</ram:LineOne>
          <ram:CityName>${invoice.seller.city}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${invoice.seller.vatNumber}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>

      <ram:BuyerTradeParty>
        <ram:Name>${invoice.buyer.name.replace(/&/g, '&amp;')}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${invoice.buyer.siren}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${invoice.buyer.postalCode}</ram:PostcodeCode>
          <ram:LineOne>${invoice.buyer.street.replace(/&/g, '&amp;')}</ram:LineOne>
          <ram:CityName>${invoice.buyer.city}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${invoice.buyer.vatNumber}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <!-- LIVRAISON & DISPATCH HUB -->
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ShipToTradeParty>
        <ram:Name>Hub EcoPool Normandie Central</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>76000</ram:PostcodeCode>
          <ram:LineOne>Parc Logistique EcoPool</ram:LineOne>
          <ram:CityName>Rouen</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:ShipToTradeParty>
    </ram:ApplicableHeaderTradeDelivery>

    <!-- RÈGLEMENT & CANTONNEMENT SÉQUESTRE -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${invoice.currency}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>42</ram:TypeCode> <!-- 42 = Virement bancaire / SEPA Credit Transfer -->
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${invoice.escrowVirtualIban.replace(/\s+/g, '')}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
      </ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${invoice.totalVAT.toFixed(2)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${invoice.totalHT.toFixed(2)}</ram:BasisAmount>
        <ram:RateApplicablePercent>20.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${invoice.totalHT.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${invoice.totalHT.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${invoice.currency}">${invoice.totalVAT.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount currencyID="${invoice.currency}">${invoice.totalTTC.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount currencyID="${invoice.currency}">${invoice.totalTTC.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`.trim();
}

/**
 * Initialisation automatique des factures Factur-X pilotes à partir de l'état de la base
 */
function initFacturXInvoices() {
  if (generatedFacturXInvoices.length > 0) return;

  const state = getState();
  state.orders.forEach((order, idx) => {
    const totalTTC = order.totalTTC || 3500;
    const totalHT = Math.round((totalTTC / 1.20) * 100) / 100;
    const totalVAT = Math.round((totalTTC - totalHT) * 100) / 100;

    const invoiceNum = `FX-2026-${order.id.toUpperCase().replace(/\D/g, '').padEnd(5, '0').slice(0, 5)}`;
    const cleanId = order.id.replace(/\D/g, '').padEnd(6, '9').slice(0, 6);
    const virtualIban = `FR76 3000 4001 2345 ${cleanId.slice(0, 4)} ${cleanId.slice(4, 6)}89 42`;

    const baseInvoice: Omit<FacturXInvoice, 'xmlCiiPayload' | 'pdpRouting'> = {
      id: `inv-${Date.now()}-${idx}`,
      invoiceNumber: invoiceNum,
      orderId: order.id,
      campaignId: order.campaignId,
      issueDate: order.reservedAt ? order.reservedAt.split('T')[0] : '2026-03-01',
      dueDate: '2026-03-31',
      seller: {
        name: 'Plastinnov Normandie SAS (Fournisseur Fabricant)',
        siren: '521948210',
        siret: '52194821000028',
        vatNumber: 'FR48521948210',
        street: 'Parc Industriel de l’Estuaire',
        city: 'Gonfreville-l’Orcher',
        postalCode: '76700',
        country: 'FR'
      },
      buyer: {
        name: order.companyName || 'Laboratoires Botanica France SAS',
        siren: '428843130',
        vatNumber: 'FR23428843130',
        street: '45 rue des Éco-Laboratoires',
        city: 'Lyon',
        postalCode: '69007',
        country: 'FR'
      },
      lineItems: [
        {
          itemDescription: `Packaging Responsable mutualisé : ${order.productName || 'Flacons 100% PCR'} (Remise MOQ appliquée)`,
          quantity: order.quantity || 10000,
          unitPriceHT: order.unitPrice || 0.82,
          totalHT: order.goodsTotal || (totalHT * 0.9),
          vatRatePct: 20,
          vatAmount: Math.round(((order.goodsTotal || (totalHT * 0.9)) * 0.20) * 100) / 100,
          discountPct: 15
        },
        {
          itemDescription: `Frais de plateforme et séquestre cantonnée EcoPool SAS (${state.economicConfig?.commissionRatePct || 6.5}%)`,
          quantity: 1,
          unitPriceHT: order.ecopoolFee || (totalHT * 0.065),
          totalHT: order.ecopoolFee || (totalHT * 0.065),
          vatRatePct: 20,
          vatAmount: Math.round(((order.ecopoolFee || (totalHT * 0.065)) * 0.20) * 100) / 100,
          discountPct: 0
        }
      ],
      totalHT,
      totalVAT,
      totalTTC,
      currency: 'EUR',
      escrowVirtualIban: virtualIban,
      status: idx === 0 ? 'APPROUVEE' : idx === 1 ? 'ACHEMINEE' : 'DEPOSEE'
    };

    const xml = generateCiiXml(baseInvoice);
    const sha256Digest = calculateSha256(xml);

    generatedFacturXInvoices.push({
      ...baseInvoice,
      xmlCiiPayload: xml,
      pdpRouting: {
        pdpProvider: 'PDP Docaposte / Chorus Pro Gateway (Certifiée DGFIP)',
        chorusProId: `CPP-2026-FR-${Math.floor(1000000 + Math.random() * 9000000)}`,
        transmissionTimestamp: new Date().toISOString(),
        acknowledgementReceipt: `AR-DGFIP-2026-${sha256Digest.slice(0, 12).toUpperCase()}`,
        sha256Digest
      }
    });
  });
}

/**
 * Récupération de l'ensemble des factures Factur-X
 */
export function getFacturXInvoices(): FacturXInvoice[] {
  initFacturXInvoices();
  return generatedFacturXInvoices;
}

/**
 * Génération d'une facture Factur-X pour une commande donnée
 */
export function generateFacturXForOrder(orderId: string): FacturXInvoice {
  initFacturXInvoices();
  const existing = generatedFacturXInvoices.find(i => i.orderId === orderId);
  if (existing) return existing;

  const state = getState();
  const order = state.orders.find(o => o.id === orderId);
  if (!order) {
    throw new Error(`Commande ${orderId} introuvable pour générer la facture Factur-X.`);
  }

  const totalTTC = order.totalTTC || 3500;
  const totalHT = Math.round((totalTTC / 1.20) * 100) / 100;
  const totalVAT = Math.round((totalTTC - totalHT) * 100) / 100;

  const invoiceNum = `FX-2026-${order.id.toUpperCase().replace(/\D/g, '').padEnd(5, '0').slice(0, 5)}`;
  const cleanId = order.id.replace(/\D/g, '').padEnd(6, '9').slice(0, 6);
  const virtualIban = `FR76 3000 4001 2345 ${cleanId.slice(0, 4)} ${cleanId.slice(4, 6)}89 42`;

  const newInvoiceBase: Omit<FacturXInvoice, 'xmlCiiPayload' | 'pdpRouting'> = {
    id: `inv-${Date.now()}`,
    invoiceNumber: invoiceNum,
    orderId: order.id,
    campaignId: order.campaignId,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    seller: {
      name: 'Plastinnov Normandie SAS (Fournisseur Fabricant)',
      siren: '521948210',
      siret: '52194821000028',
      vatNumber: 'FR48521948210',
      street: 'Parc Industriel de l’Estuaire',
      city: 'Gonfreville-l’Orcher',
      postalCode: '76700',
      country: 'FR'
    },
    buyer: {
      name: order.companyName || 'Laboratoires Botanica France SAS',
      siren: '428843130',
      vatNumber: 'FR23428843130',
      street: '45 rue des Éco-Laboratoires',
      city: 'Lyon',
      postalCode: '69007',
      country: 'FR'
    },
    lineItems: [
      {
        itemDescription: `Packaging Responsable mutualisé : ${order.productName || 'Flacons 100% PCR'}`,
        quantity: order.quantity || 10000,
        unitPriceHT: order.unitPrice || 0.82,
        totalHT: order.goodsTotal || (totalHT * 0.9),
        vatRatePct: 20,
        vatAmount: Math.round(((order.goodsTotal || (totalHT * 0.9)) * 0.20) * 100) / 100,
        discountPct: 15
      },
      {
        itemDescription: `Commission plateforme & séquestre EcoPool (${state.economicConfig?.commissionRatePct || 6.5}%)`,
        quantity: 1,
        unitPriceHT: order.ecopoolFee || (totalHT * 0.065),
        totalHT: order.ecopoolFee || (totalHT * 0.065),
        vatRatePct: 20,
        vatAmount: Math.round(((order.ecopoolFee || (totalHT * 0.065)) * 0.20) * 100) / 100,
        discountPct: 0
      }
    ],
    totalHT,
    totalVAT,
    totalTTC,
    currency: 'EUR',
    escrowVirtualIban: virtualIban,
    status: 'DEPOSEE'
  };

  const xml = generateCiiXml(newInvoiceBase);
  const sha256Digest = calculateSha256(xml);

  const fullInvoice: FacturXInvoice = {
    ...newInvoiceBase,
    xmlCiiPayload: xml,
    pdpRouting: {
      pdpProvider: 'PDP Cegedim / Chorus Pro Gateway (Certifiée DGFIP)',
      chorusProId: `CPP-2026-FR-${Math.floor(1000000 + Math.random() * 9000000)}`,
      transmissionTimestamp: new Date().toISOString(),
      acknowledgementReceipt: `AR-DGFIP-2026-${sha256Digest.slice(0, 12).toUpperCase()}`,
      sha256Digest
    }
  };

  generatedFacturXInvoices.unshift(fullInvoice);

  sseBroker.broadcast('FACTURX_GENERATED', {
    invoiceId: fullInvoice.id,
    invoiceNumber: fullInvoice.invoiceNumber,
    orderId: fullInvoice.orderId,
    totalTTC: fullInvoice.totalTTC,
    status: fullInvoice.status
  });

  return fullInvoice;
}

/**
 * Transmission simulée à une Plateforme de Dématérialisation Partenaire (PDP)
 */
export function transmitInvoiceToPdp(invoiceId: string, pdpName?: string): { success: boolean; message: string; routing: any } {
  initFacturXInvoices();
  const invoice = generatedFacturXInvoices.find(i => i.id === invoiceId);
  if (!invoice) {
    throw new Error(`Facture ${invoiceId} introuvable.`);
  }

  const timestamp = new Date().toISOString();
  const provider = pdpName || 'PDP Docaposte / Chorus Pro Connect';
  const ack = `AR-PDP-CHORUS-2026-${Date.now().toString().slice(-8)}`;

  invoice.status = 'ACHEMINEE';
  invoice.pdpRouting = {
    ...invoice.pdpRouting,
    pdpProvider: provider,
    transmissionTimestamp: timestamp,
    acknowledgementReceipt: ack
  };

  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title: 'Factur-X Acheminée sur PDP / Chorus Pro',
    message: `La facture ${invoice.invoiceNumber} a été déposée et validée par le PPF/PDP (${provider}). Accusé de réception officiel : ${ack}.`,
    type: 'success',
    timestamp,
    read: false
  };

  const state = getState();
  setState({
    notifications: [newNotif, ...state.notifications]
  });

  sseBroker.broadcast('FACTURX_TRANSMITTED', {
    invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    pdpProvider: provider,
    acknowledgementReceipt: ack,
    status: 'ACHEMINEE',
    timestamp
  });

  return {
    success: true,
    message: `Facture ${invoice.invoiceNumber} transmise avec succès au portail ${provider}.`,
    routing: invoice.pdpRouting
  };
}

/**
 * Mise à jour du statut dans le cycle de vie légal de la facture 2026
 */
export function updateInvoiceLifecycle(invoiceId: string, newStatus: FacturXLifecycleStatus): FacturXInvoice {
  initFacturXInvoices();
  const invoice = generatedFacturXInvoices.find(i => i.id === invoiceId);
  if (!invoice) {
    throw new Error(`Facture ${invoiceId} introuvable.`);
  }

  invoice.status = newStatus;

  sseBroker.broadcast('FACTURX_STATUS_CHANGED', {
    invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    newStatus,
    timestamp: new Date().toISOString()
  });

  return invoice;
}
