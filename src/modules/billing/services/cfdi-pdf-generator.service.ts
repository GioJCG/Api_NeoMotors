import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { PdfGenerator, PdfInvoiceData } from '../interfaces/pdf-generator.interface';

@Injectable()
export class CfdiPdfGeneratorService implements PdfGenerator {
  private readonly logger = new Logger(CfdiPdfGeneratorService.name);

  async generate(data: PdfInvoiceData): Promise<Buffer> {
    const qrBuffer = await QRCode.toBuffer(
      `https://verificacfdi.simulado.mx/cfdi?uuid=${data.uuid || ''}`,
      { width: 120, margin: 1, color: { dark: '#1a237e', light: '#ffffff' } },
    );

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 40, left: 50, right: 50, bottom: 40 },
          info: {
            Title: `Factura ${data.serie || ''}${data.folio}`,
            Author: 'NeoMotors SaaS',
            Subject: 'CFDI 4.0 Simulado',
            Keywords: 'factura, cfdi, mexico, simulado',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const leftMargin = doc.page.margins.left;
        let y = doc.page.margins.top;

        const primary = '#1a237e';
        const secondary = '#3949ab';
        const gray = '#666666';
        const lightGray = '#f5f5f5';
        const red = '#c62828';

        doc.font('Helvetica');

        // ── WATERMARK (diagonal background text) ──
        const watermarkText = 'CFDI SIMULADO - NO VÁLIDO PARA EFECTOS FISCALES';
        if (data.uuid) {
          doc.save();
          doc.fontSize(24);
          doc.fillColor('#e0e0e0');
          doc.rotate(-40, { origin: [doc.page.width / 2, doc.page.height / 2] });
          doc.text(watermarkText, doc.page.width / 2 - 180, doc.page.height / 2 - 60, {
            align: 'center',
          });
          doc.restore();
        }

        // ── HEADER ──
        // Red disclaimer bar
        if (data.uuid) {
          doc.rect(leftMargin, y, pageWidth, 20).fill(red);
          doc.fillColor('#ffffff');
          doc.fontSize(8);
          doc.font('Helvetica-Bold');
          doc.text('CFDI SIMULADO - NO VÁLIDO PARA EFECTOS FISCALES', leftMargin + 10, y + 5, {
            width: pageWidth - 20,
            align: 'center',
          });
          y += 28;
        }

        // Company header
        doc.fillColor(primary);
        doc.fontSize(18);
        doc.font('Helvetica-Bold');
        doc.text(data.emisor.razonSocial, leftMargin, y, { width: pageWidth * 0.6 });

        doc.fontSize(9);
        doc.font('Helvetica');
        doc.fillColor(gray);
        doc.text(`RFC: ${data.emisor.rfc}`, leftMargin, y + 22);
        doc.text(`Régimen Fiscal: ${data.emisor.regimenFiscal}`, leftMargin, y + 34);
        doc.text(`CP: ${data.emisor.codigoPostalFiscal}`, leftMargin, y + 46);

        // Folio + UUID section (right side)
        const rightX = leftMargin + pageWidth * 0.55;
        doc.fillColor(primary);
        doc.fontSize(14);
        doc.font('Helvetica-Bold');
        doc.text(`Factura ${data.serie || ''}${data.folio}`, rightX, y, { align: 'right' });

        doc.fontSize(9);
        doc.font('Helvetica');
        doc.fillColor(gray);
        const headerRightY = doc.y + 4;
        if (data.uuid) {
          doc.text(`UUID: ${data.uuid}`, rightX, headerRightY, { align: 'right', width: pageWidth * 0.45 });
          doc.text(`Emisión: ${this.formatDate(data.createdAt)}`, rightX, headerRightY + 12, { align: 'right', width: pageWidth * 0.45 });
          if (data.fechaTimbrado) {
            doc.text(`Timbrado: ${this.formatDate(data.fechaTimbrado)}`, rightX, headerRightY + 24, { align: 'right', width: pageWidth * 0.45 });
          }
        }

        y = Math.max(y + 65, doc.y + 15);

        // Separator line
        doc.strokeColor(primary).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
        y += 15;

        // ── EMISOR / RECEPTOR BOXES ──
        const boxWidth = (pageWidth - 15) / 2;
        const boxHeight = 80;

        // Emisor box
        doc.roundedRect(leftMargin, y, boxWidth, boxHeight, 4).fillColor('#fafafa').fill();
        doc.strokeColor('#e0e0e0').lineWidth(1).roundedRect(leftMargin, y, boxWidth, boxHeight, 4).stroke();
        doc.fillColor(primary);
        doc.fontSize(9);
        doc.font('Helvetica-Bold');
        doc.text('EMISOR', leftMargin + 8, y + 6);
        doc.fillColor('#333');
        doc.fontSize(8);
        doc.font('Helvetica');
        doc.text(data.emisor.razonSocial, leftMargin + 8, y + 20);
        doc.text(`RFC: ${data.emisor.rfc}`, leftMargin + 8, y + 33);
        doc.text(`Régimen: ${data.emisor.regimenFiscal}`, leftMargin + 8, y + 46);
        doc.text(`CP: ${data.emisor.codigoPostalFiscal}`, leftMargin + 8, y + 59);

        // Receptor box
        const receptorX = leftMargin + boxWidth + 15;
        doc.roundedRect(receptorX, y, boxWidth, boxHeight, 4).fillColor('#fafafa').fill();
        doc.strokeColor('#e0e0e0').lineWidth(1).roundedRect(receptorX, y, boxWidth, boxHeight, 4).stroke();
        doc.fillColor(primary);
        doc.fontSize(9);
        doc.font('Helvetica-Bold');
        doc.text('RECEPTOR', receptorX + 8, y + 6);
        doc.fillColor('#333');
        doc.fontSize(8);
        doc.font('Helvetica');
        doc.text(data.receptor.nombre, receptorX + 8, y + 20);
        doc.text(`RFC: ${data.receptor.rfc}`, receptorX + 8, y + 33);
        doc.text(`Uso CFDI: ${data.usoCfdi}`, receptorX + 8, y + 46);

        y += boxHeight + 20;

        // ── INVOICE INFO LINE ──
        doc.fontSize(8);
        doc.font('Helvetica');
        doc.fillColor(gray);
        doc.text(`Tipo: ${data.tipoComprobante}  |  Forma de pago: ${data.formaPago}  |  Método de pago: ${data.metodoPago}  |  Exportación: ${data.exportacion}`, leftMargin, y);
        y += 18;

        // ── CONCEPTOS TABLE ──
        const tableHeaders = ['Cant', 'Clave', 'Descripción', 'P.U.', 'Importe', 'IVA', 'Total'];
        const colWidths = [30, 55, 0, 60, 60, 55, 60];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const colPositions: number[] = [];
        let cx = leftMargin;
        for (const w of colWidths) {
          colPositions.push(cx);
          cx += w;
        }
        colPositions[2] = colPositions[1] + colWidths[1]; // descripción starts after clave
        // Reserve remaining space for description
        const remainingWidth = pageWidth - (tableWidth - colWidths[2]);
        colWidths[2] = remainingWidth;
        // Recalculate positions
        const newColPositions: number[] = [];
        let cx2 = leftMargin;
        for (const w of colWidths) {
          newColPositions.push(cx2);
          cx2 += w;
        }

        const rowHeight = 16;
        const headerHeight = 18;
        const tableTop = y;

        // Header
        doc.rect(leftMargin, tableTop, pageWidth, headerHeight).fill(primary);
        doc.fillColor('#ffffff');
        doc.fontSize(7);
        doc.font('Helvetica-Bold');
        for (let i = 0; i < tableHeaders.length; i++) {
          doc.text(tableHeaders[i], newColPositions[i] + 3, tableTop + 4, { width: colWidths[i] - 4, align: i >= 3 ? 'right' : 'left' });
        }

        let tableY = tableTop + headerHeight;

        // Rows
        for (const item of data.conceptos) {
          const bgColor = tableY % 2 === 0 ? '#ffffff' : '#fafafa';
          doc.rect(leftMargin, tableY, pageWidth, rowHeight).fillColor(bgColor).fill();

          doc.fillColor('#333');
          doc.fontSize(7);
          doc.font('Helvetica');
          doc.text(String(item.cantidad), newColPositions[0] + 4, tableY + 3, { width: colWidths[0] - 6, align: 'center' });
          doc.text(item.claveProdServ, newColPositions[1] + 3, tableY + 3, { width: colWidths[1] - 4 });
          doc.text(item.descripcion, newColPositions[2] + 3, tableY + 3, { width: colWidths[2] - 4 });
          doc.text(`$${item.precioUnitario.toFixed(2)}`, newColPositions[3] + 3, tableY + 3, { width: colWidths[3] - 6, align: 'right' });
          doc.text(`$${item.importe.toFixed(2)}`, newColPositions[4] + 3, tableY + 3, { width: colWidths[4] - 6, align: 'right' });
          doc.text(`$${item.iva.toFixed(2)}`, newColPositions[5] + 3, tableY + 3, { width: colWidths[5] - 6, align: 'right' });
          doc.text(`$${item.total.toFixed(2)}`, newColPositions[6] + 3, tableY + 3, { width: colWidths[6] - 6, align: 'right' });

          tableY += rowHeight;

          if (tableY > doc.page.height - 120) {
            doc.addPage();
            tableY = doc.page.margins.top;
          }
        }

        // Table bottom line
        doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(leftMargin, tableY).lineTo(leftMargin + pageWidth, tableY).stroke();
        y = tableY + 15;

        // ── TOTALS ──
        const totalX = leftMargin + pageWidth - 200;
        doc.fontSize(9);
        doc.font('Helvetica');
        doc.fillColor(gray);
        doc.text(`Subtotal:`, totalX, y, { width: 120, align: 'right' });
        doc.fillColor('#333');
        doc.text(`$${data.subtotal.toFixed(2)}`, totalX + 125, y, { width: 75, align: 'right' });
        y += 14;

        if (data.descuento > 0) {
          doc.fillColor(gray);
          doc.fontSize(9);
          doc.font('Helvetica');
          doc.text(`Descuento:`, totalX, y, { width: 120, align: 'right' });
          doc.fillColor('#333');
          doc.text(`-$${data.descuento.toFixed(2)}`, totalX + 125, y, { width: 75, align: 'right' });
          y += 14;
        }

        doc.fillColor(gray);
        doc.fontSize(9);
        doc.font('Helvetica');
        doc.text(`IVA (16%):`, totalX, y, { width: 120, align: 'right' });
        doc.fillColor('#333');
        doc.text(`$${data.iva.toFixed(2)}`, totalX + 125, y, { width: 75, align: 'right' });
        y += 14;

        doc.strokeColor(primary).lineWidth(1).moveTo(totalX, y).lineTo(totalX + 200, y).stroke();
        y += 8;

        doc.fontSize(14);
        doc.font('Helvetica-Bold');
        doc.fillColor(primary);
        doc.text(`Total MXN:`, totalX, y, { width: 120, align: 'right' });
        doc.text(`$${data.total.toFixed(2)}`, totalX + 125, y, { width: 75, align: 'right' });
        y += 28;

        // ── QR CODE + UUID / SELLO SECTION ──
        if (data.uuid) {
          // QR code on the right
          const qrSize = 90;
          const qrX = leftMargin + pageWidth - qrSize;
          doc.image(qrBuffer, qrX, y, { width: qrSize, height: qrSize });

          // QR label
          doc.fontSize(6);
          doc.font('Helvetica');
          doc.fillColor(gray);
          doc.text('QR Simulado', qrX, y + qrSize + 2, { width: qrSize, align: 'center' });

          // UUID + Sello on the left of QR
          const textX = leftMargin;
          const textWidth = pageWidth - qrSize - 15;

          doc.fontSize(8);
          doc.font('Helvetica-Bold');
          doc.fillColor(primary);
          doc.text('TIMBRE FISCAL DIGITAL', textX, y, { width: textWidth });
          y += 13;

          doc.fontSize(7);
          doc.font('Helvetica');
          doc.fillColor('#333');
          doc.text(`UUID: ${data.uuid}`, textX, y, { width: textWidth });
          y += 11;

          const sello = this.generateFakeSello(data.uuid, data.emisor.rfc);
          doc.text(`Sello SAT: ${sello.substring(0, 60)}...`, textX, y, { width: textWidth });
          y += 11;
          doc.text(`Sello SAT (cont): ${sello.substring(60, 120)}...`, textX, y, { width: textWidth });
          y += 11;

          doc.text(`No. Certificado SAT: 00001000000500000000`, textX, y, { width: textWidth });
          y += 11;

          const cadenaOriginal = this.buildCadenaOriginal(data);
          doc.fontSize(6.5);
          doc.fillColor(gray);
          doc.text(`Cadena Original:`, textX, y, { width: textWidth });
          y += 9;
          doc.fontSize(5.5);
          doc.text(cadenaOriginal.substring(0, 180), textX, y, { width: textWidth });
          y += 8;
          doc.text(cadenaOriginal.substring(180, 360), textX, y, { width: textWidth });

          y += 20;
        }

        // ── PAYMENT INFO ──
        doc.fontSize(8);
        doc.font('Helvetica');
        doc.fillColor(gray);
        doc.text(`Método de pago: ${data.metodoPago}  |  Forma de pago: ${data.formaPago}  |  Moneda: MXN`, leftMargin, y);

        // ── FOOTER ──
        const footerY = doc.page.height - 40;
        doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(leftMargin, footerY - 10).lineTo(leftMargin + pageWidth, footerY - 10).stroke();

        doc.fontSize(7);
        doc.font('Helvetica');
        doc.fillColor(gray);
        doc.text('Comprobante Fiscal Digital CFDI 4.0', leftMargin, footerY, { width: pageWidth, align: 'center' });
        doc.fontSize(6.5);
        doc.text('Este documento es una representación impresa de un CFDI simulado', leftMargin, footerY + 11, { width: pageWidth, align: 'center' });
        doc.text('No válido para efectos fiscales', leftMargin, footerY + 20, { width: pageWidth, align: 'center' });

        doc.fontSize(7);
        doc.font('Helvetica-Bold');
        doc.fillColor(red);
        doc.text('CFDI SIMULADO - NO VÁLIDO PARA EFECTOS FISCALES', leftMargin, footerY + 32, { width: pageWidth, align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private generateFakeSello(uuid: string, rfc: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(`${uuid}|${rfc}|${Date.now()}`).digest('hex');
    const sello = `WqY${hash}0f${rfc.replace(/[^A-Z0-9]/g, '')}${hash.substring(0, 30)}`;
    return sello.padEnd(130, '0').substring(0, 130);
  }

  private buildCadenaOriginal(data: PdfInvoiceData): string {
    const parts = [
      '||',
      '4.0',
      data.uuid || '',
      data.fechaTimbrado ? this.formatDate(data.fechaTimbrado) : '',
      data.emisor.rfc,
      '',
      data.emisor.regimenFiscal,
      data.receptor.rfc,
      '',
      '',
      data.receptor.nombre,
      '',
      '',
      '',
      '',
      '|',
    ];
    return parts.join('|');
  }
}
