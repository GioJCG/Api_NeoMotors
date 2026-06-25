import { Injectable, Logger } from '@nestjs/common';
import { PdfGenerator, PdfInvoiceData } from '../interfaces/pdf-generator.interface';

@Injectable()
export class CfdiPdfGeneratorService implements PdfGenerator {
  private readonly logger = new Logger(CfdiPdfGeneratorService.name);

  async generate(data: PdfInvoiceData): Promise<Buffer> {
    const html = this.buildHtml(data);
    return Buffer.from(html, 'utf8');
  }

  private buildHtml(data: PdfInvoiceData): string {
    const rows = data.conceptos
      .map(
        (c) =>
          `<tr>
            <td>${c.cantidad}</td>
            <td>${this.escapeHtml(c.claveProdServ)}</td>
            <td>${this.escapeHtml(c.descripcion)}</td>
            <td>$${c.precioUnitario.toFixed(2)}</td>
            <td>$${c.importe.toFixed(2)}</td>
            <td>$${c.iva.toFixed(2)}</td>
            <td>$${c.total.toFixed(2)}</td>
          </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm 15mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a237e; padding-bottom: 15px; margin-bottom: 20px; }
  .header .emisor h2 { margin: 0 0 5px; color: #1a237e; font-size: 16px; }
  .header .emisor p { margin: 2px 0; font-size: 10px; }
  .header .folio { text-align: right; }
  .header .folio h1 { margin: 0; font-size: 20px; color: #1a237e; }
  .header .folio p { margin: 2px 0; font-size: 10px; color: #666; }
  .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .info-box { width: 48%; border: 1px solid #ddd; border-radius: 4px; padding: 10px; }
  .info-box h3 { margin: 0 0 8px; font-size: 11px; color: #1a237e; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .info-box p { margin: 3px 0; font-size: 10px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  table.items thead th { background: #1a237e; color: #fff; padding: 6px 8px; font-size: 9px; text-align: left; text-transform: uppercase; }
  table.items tbody td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
  table.items tbody tr:nth-child(even) { background: #f9f9f9; }
  .totals { text-align: right; margin-top: 10px; padding-top: 10px; border-top: 2px solid #1a237e; }
  .totals p { margin: 3px 0; font-size: 11px; }
  .totals .grand-total { font-size: 16px; font-weight: bold; color: #1a237e; }
  .footer { margin-top: 30px; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: bold; }
  .badge.timbrada { background: #e8f5e9; color: #2e7d32; }
  .badge.cancelada { background: #ffebee; color: #c62828; }
  .badge.generada { background: #fff3e0; color: #ef6c00; }
</style>
</head>
<body>
<div class="header">
  <div class="emisor">
    ${data.emisor.logoUrl ? `<img src="${data.emisor.logoUrl}" height="50" style="margin-bottom:8px">` : ''}
    <h2>${this.escapeHtml(data.emisor.razonSocial)}</h2>
    <p>RFC: ${data.emisor.rfc}</p>
    <p>Régimen Fiscal: ${data.emisor.regimenFiscal}</p>
    <p>CP: ${data.emisor.codigoPostalFiscal}</p>
  </div>
  <div class="folio">
    <h1>Factura ${data.serie || ''}${data.folio}</h1>
    <p><span class="badge ${data.estado.toLowerCase()}">${data.estado}</span></p>
    <p>UUID: ${data.uuid || '—'}</p>
    <p>Emisión: ${new Date(data.createdAt).toLocaleDateString('es-MX')}</p>
    ${data.fechaTimbrado ? `<p>Timbrado: ${new Date(data.fechaTimbrado).toLocaleDateString('es-MX')}</p>` : ''}
  </div>
</div>

<div class="info-section">
  <div class="info-box">
    <h3>Emisor</h3>
    <p><strong>${this.escapeHtml(data.emisor.razonSocial)}</strong></p>
    <p>RFC: ${data.emisor.rfc}</p>
    <p>Régimen: ${data.emisor.regimenFiscal}</p>
    <p>CP: ${data.emisor.codigoPostalFiscal}</p>
  </div>
  <div class="info-box">
    <h3>Receptor</h3>
    <p><strong>${this.escapeHtml(data.receptor.nombre)}</strong></p>
    <p>RFC: ${data.receptor.rfc}</p>
    ${data.receptor.domicilio ? `<p>Domicilio: ${this.escapeHtml(data.receptor.domicilio)}</p>` : ''}
    <p>Uso CFDI: ${data.usoCfdi}</p>
  </div>
</div>

<table class="items">
  <thead>
    <tr><th>Cant</th><th>Clave</th><th>Descripción</th><th>P.U.</th><th>Importe</th><th>IVA</th><th>Total</th></tr>
  </thead>
  <tbody>
    ${rows || '<tr><td colspan="7" style="text-align:center;color:#999;">Sin conceptos</td></tr>'}
  </tbody>
</table>

<div class="info-section">
  <div style="font-size:10px;color:#666;">
    <p><strong>Forma de pago:</strong> ${data.formaPago}</p>
    <p><strong>Método de pago:</strong> ${data.metodoPago}</p>
    <p><strong>Tipo comprobante:</strong> ${data.tipoComprobante}</p>
    <p><strong>Exportación:</strong> ${data.exportacion}</p>
  </div>
  <div class="totals">
    <p>Subtotal: $${data.subtotal.toFixed(2)}</p>
    ${data.descuento > 0 ? `<p>Descuento: -$${data.descuento.toFixed(2)}</p>` : ''}
    <p>IVA (16%): $${data.iva.toFixed(2)}</p>
    <p class="grand-total">Total: $${data.total.toFixed(2)}</p>
    <p style="font-size:9px;color:#666;">Moneda: MXN</p>
  </div>
</div>

<div class="footer">
  <p>Comprobante Fiscal Digital CFDI 4.0</p>
  <p>Este documento es una representación impresa del CFDI</p>
  <p>Consulte en: https://verificacfdi.facturaelectronica.sat.gob.mx</p>
</div>
</body>
</html>`;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
