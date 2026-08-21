/**
 * PROS Official Invoice & Receipt PDF Downloader & Print Engine
 * Generates and downloads 100% Compliant Binary %PDF-1.4 Documents in A4 Portrait Format
 * Triggers Native Browser Printing for Invoices & Receipts
 */

import type { OrderInvoiceData } from '../server/invoiceApi';
import type { PublicTrackingResponse } from '../server/trackingApi';
import { generateInvoicePdfBuffer } from '../server/pdfEngine';
import { generateQrCodeSvg } from './qrcode';

// MAIN DOWNLOAD PDF INVOICE FUNCTION (SECTIONS 1, 2, 3, 6, 13, 14, 15)
export function downloadInvoicePdf(invoice: OrderInvoiceData): void {
  const filename = `PROS-FACTURE-${invoice.trackingNumber}.pdf`;

  // 1. Generate 100% Compliant %PDF-1.4 Binary Buffer (Section 13)
  const pdfBytes = generateInvoicePdfBuffer(invoice);

  // 2. Strict Signature Verification: First 5 bytes MUST BE %PDF- (Section 3 & 13)
  const headerSignature = String.fromCharCode(...pdfBytes.subarray(0, 5));
  if (headerSignature !== '%PDF-') {
    console.error('PDF Signature Check Failed. Received header:', headerSignature);
    throw new Error('Échec de la génération du document PDF : Signature binaire invalide.');
  }

  // 3. Create Authentic Blob with Content-Type: application/pdf (Section 2 & 14)
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

  if (blob.size === 0) {
    throw new Error('Le document PDF généré est vide (0 octets).');
  }

  // 4. Trigger Direct Browser File Download of PROS-FACTURE-PROS-DAK-3436.pdf (Section 6)
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup Blob URL memory
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}

// NATIVE BROWSER RECEIPT PRINTING ENGINE (SECTION 10, 11, 12)
export function printOrderReceiptWindow(invoice: OrderInvoiceData): void {
  const qrSvg = generateQrCodeSvg(invoice.trackingUrl, 130);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>REÇU DE COMMANDE ${invoice.trackingNumber} — PROS</title>
      <style>
        @page {
          size: A4 portrait !important;
          margin: 10mm !important;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0A0A0A;
          background: #FFFFFF;
          margin: 0;
          padding: 20px;
          font-size: 11px;
          line-height: 1.5;
        }
        .receipt-box {
          max-width: 190mm;
          margin: 0 auto;
          background: #FFFFFF;
          border: 1px solid #E8E8E8;
          padding: 30px;
        }
        .hdr {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0A0A0A;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .logo { font-size: 32px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; }
        .tagline { font-size: 10px; color: #C9A45C; font-weight: 700; text-transform: uppercase; }
        .meta { text-align: right; font-family: monospace; font-size: 11px; color: #555555; }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 14px;
          background: #F9F9F8;
          border: 1px solid #E8E8E8;
          margin-bottom: 20px;
        }
        .grid strong { display: block; font-size: 9px; font-family: monospace; color: #C9A45C; text-transform: uppercase; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #0A0A0A; color: #FFFFFF; padding: 8px 10px; font-size: 9px; text-transform: uppercase; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #E8E8E8; font-size: 11px; }
        .summary { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
        .pay-card { flex: 1; background: #E6F4ED; border: 1px solid #0A9F68; padding: 14px; }
        .pay-title { font-size: 11px; font-weight: 800; color: #0A9F68; text-transform: uppercase; }
        .totals { width: 250px; font-size: 11px; }
        .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
        .grand-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; color: #0A9F68; border-top: 2px solid #0A0A0A; padding-top: 6px; margin-top: 6px; }
        .qr-card { display: flex; justify-content: space-between; align-items: center; background: #F9F9F8; border: 1px dashed #C9A45C; padding: 14px 20px; margin-bottom: 20px; }
        .ftr { text-align: center; border-top: 1px solid #E8E8E8; padding-top: 14px; font-size: 9px; font-family: monospace; color: #777777; text-transform: uppercase; }
        @media print {
          body { padding: 0; }
          .receipt-box { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-box">
        <div class="hdr">
          <div>
            <div class="logo">${invoice.vendor.companyName}</div>
            <div class="tagline">${invoice.vendor.subTitle}</div>
          </div>
          <div class="meta">
            <strong style="font-size:16px;color:#0A0A0A;display:block;">REÇU OFFICIEL DE COMMANDE</strong>
            <div>FACTURE N° : ${invoice.invoiceNumber}</div>
            <div>COMMANDE N° : ${invoice.trackingNumber}</div>
            <div>DATE : ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <strong>ÉMETTEUR (PROS STORE)</strong>
            <span style="font-weight:700;">PROS Store Sénégal</span><br/>
            ${invoice.vendor.address}<br/>
            ${invoice.vendor.city}, ${invoice.vendor.country}<br/>
            <span style="font-family:monospace;">Tél: ${invoice.vendor.phone}</span>
          </div>
          <div>
            <strong>FACTURÉ À (CLIENT)</strong>
            <span style="font-weight:700;">${invoice.customer.name}</span><br/>
            ${invoice.customer.address}<br/>
            ${invoice.customer.city}, ${invoice.customer.region} — ${invoice.customer.country}<br/>
            <span style="font-family:monospace;">Tél: ${invoice.customer.phone}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>PRODUIT</th>
              <th>DÉTAILS</th>
              <th style="text-align:center;">QTÉ</th>
              <th style="text-align:right;">PRIX UNITAIRE</th>
              <th style="text-align:right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((it) => `
              <tr>
                <td><strong style="text-transform:uppercase;">${it.name}</strong></td>
                <td style="color:#666666;">Taille: ${it.size} • Couleur: ${it.color}</td>
                <td style="text-align:center;font-weight:700;">${it.quantity}</td>
                <td style="text-align:right;font-family:monospace;">${it.unitPrice.toLocaleString('fr-FR')} FCFA</td>
                <td style="text-align:right;font-family:monospace;font-weight:700;">${it.totalPrice.toLocaleString('fr-FR')} FCFA</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="pay-card">
            <div class="pay-title">✓ STATUT DU PAIEMENT : ${invoice.paymentStatus}</div>
            <div>Mode de Règlement : <strong>${invoice.paymentMethod}</strong></div>
          </div>

          <div class="totals">
            <div class="totals-row"><span>Sous-total:</span><strong>${invoice.financials.subtotal.toLocaleString('fr-FR')} FCFA</strong></div>
            <div class="totals-row"><span>Livraison (${invoice.customer.city}):</span><span>${invoice.financials.shippingCost.toLocaleString('fr-FR')} FCFA</span></div>
            <div class="grand-total"><span>TOTAL RÉGLÉ:</span><span>${invoice.financials.grandTotal.toLocaleString('fr-FR')} FCFA</span></div>
          </div>
        </div>

        <div class="qr-card">
          <div>
            <strong style="font-size:11px;text-transform:uppercase;display:block;">SUIVI EN TEMPS RÉEL DE VOTRE LIVRAISON</strong>
            <p style="margin:2px 0 0 0;font-size:10px;color:#666666;">Scannez ce QR Code pour consulter l'état en direct de votre livraison sur pros-store.sn.</p>
            <p style="font-family:monospace;font-size:10px;color:#C9A45C;font-weight:bold;margin:4px 0 0 0;">SUIVI N° : ${invoice.trackingNumber}</p>
          </div>
          <div style="background:#FFFFFF;border:1px solid #E8E8E8;padding:6px;text-align:center;">
            ${qrSvg}
            <div style="font-size:8px;font-weight:bold;color:#C9A45C;margin-top:2px;">SCANNEZ POUR SUIVRE</div>
          </div>
        </div>

        <div class="ftr">
          REÇU OFFICIEL DE COMMANDE — PROS STORE SÉNÉGAL • support@pros.sn • Tél: ${invoice.vendor.phone}
        </div>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(htmlContent);
    printWin.document.close();
  } else {
    window.print();
  }
}

// BACKWARDS COMPATIBILITY HANDLERS
export function printOrderReceipt(data: PublicTrackingResponse): void {
  const invoiceData: OrderInvoiceData = {
    invoiceNumber: `INV-2026-${data.trackingNumber.replace(/[^0-9]/g, '').padStart(6, '0')}`,
    orderId: data.rawOrder?.id || data.trackingNumber,
    trackingNumber: data.trackingNumber,
    trackingToken: data.trackingToken,
    createdAt: data.createdAt,
    generatedAt: new Date().toISOString(),
    vendor: {
      companyName: 'PROS',
      subTitle: 'Maison d\'Édition & E-Commerce Premium',
      address: 'Avenue Cheikh Anta Diop, Fann Résidence',
      city: 'Dakar',
      country: 'Sénégal',
      email: 'support@pros.sn',
      phone: '+221 77 000 00 00',
    },
    customer: {
      name: data.customerDisplayName,
      email: data.rawOrder?.customer?.email || 'client@pros.sn',
      phone: data.maskedPhone,
      address: data.deliveryAddress,
      city: data.deliveryCity,
      region: data.deliveryRegion,
      country: 'Sénégal',
    },
    items: data.items.map((i, idx) => ({
      id: `item-${idx}`,
      name: i.name,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      unitPrice: i.price,
      totalPrice: i.price * i.quantity,
    })),
    financials: {
      subtotal: data.subtotal,
      discount: 0,
      shippingCost: data.shippingFee,
      taxes: 0,
      grandTotal: data.total,
    },
    paymentStatus: data.paymentStatus,
    paymentMethod: data.paymentMethod,
    trackingUrl: `https://pros-store.sn/order-tracking?tracking=${data.trackingNumber}`,
    qrCodeSvg: '',
    rawOrder: data.rawOrder,
  };

  printOrderReceiptWindow(invoiceData);
}

export function downloadReceiptPdf(data: PublicTrackingResponse): void {
  printOrderReceipt(data);
}
