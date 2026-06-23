import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { EmitirFacturaDto } from './dto/billing.dto';

@Injectable()
export class BillingService {
  private readonly IVA_RATE = 0.16;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async issue(dto: EmitirFacturaDto, user: { id: string; roles: string[]; companyId?: string | null }, ip?: string) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');

    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id: dto.ordenTrabajoId },
      include: {
        cliente: { select: { id: true, nombre: true, rfc: true, direccion: true } },
        pagos: true,
      },
    });
    if (!orden || orden.empresaId !== empresaId) throw new NotFoundException('Orden no encontrada');
    if (orden.estado !== 'FACTURADO' && orden.estado !== 'ENTREGADO') {
      throw new BadRequestException('La orden debe estar en estado FACTURADO o ENTREGADO');
    }

    const csd = await this.prisma.certificadoFiscal.findUnique({ where: { empresaId } });
    if (!csd || !csd.activo || csd.vigenciaHasta < new Date()) {
      throw new BadRequestException('No hay un CSD vigente para esta empresa');
    }
    if (!orden.cliente.rfc) {
      throw new BadRequestException('El cliente no tiene RFC registrado');
    }

    const totalPagado = orden.pagos.reduce((sum, p) => sum + Number(p.monto), 0);
    if (totalPagado <= 0) throw new BadRequestException('La orden no tiene pagos registrados');

    // Generate folio
    const count = await this.prisma.facturaFiscal.count({ where: { empresaId } });
    const folio = `F${String(count + 1).padStart(4, '0')}`;

    // Build conceptos (detalles)
    const conceptos = dto.detalles && dto.detalles.length > 0
      ? dto.detalles.map((det) => {
          const importe = det.cantidad * det.precioUnitario;
          const descuento = det.descuento || 0;
          const base = importe - descuento;
          const iva = Math.round(base * this.IVA_RATE * 100) / 100;
          const total = Math.round((base + iva) * 100) / 100;
          return {
            cantidad: det.cantidad,
            claveProdServ: det.claveProdServ || '78111805',
            claveUnidad: det.claveUnidad || 'E48',
            unidad: det.unidad || 'Servicio',
            descripcion: det.descripcion,
            precioUnitario: Math.round(det.precioUnitario * 100) / 100,
            importe: Math.round(importe * 100) / 100,
            descuento,
            iva,
            total,
          };
        })
      : [{
          cantidad: 1,
          claveProdServ: '78111805',
          claveUnidad: 'E48',
          unidad: 'Servicio',
          descripcion: `Servicios de taller - Orden ${orden.folio}`,
          precioUnitario: Math.round(totalPagado * 100) / 100,
          importe: Math.round(totalPagado * 100) / 100,
          descuento: 0,
          iva: Math.round(totalPagado * this.IVA_RATE * 100) / 100,
          total: Math.round((totalPagado + totalPagado * this.IVA_RATE) * 100) / 100,
        }];

    const subtotal = conceptos.reduce((s, c) => s + c.importe, 0);
    const descuentoTotal = conceptos.reduce((s, c) => s + c.descuento, 0);
    const ivaTotal = conceptos.reduce((s, c) => s + c.iva, 0);
    const total = conceptos.reduce((s, c) => s + c.total, 0);

    // Generate UUID for timbrado simulation
    const uuid = crypto.randomUUID();

    // Generate XML CFDI 4.0
    const fecha = new Date().toISOString().replace(/\.\d{3}Z/, '-06:00');
    const xml = this.generateCfdiXml({
      folio,
      uuid,
      fecha,
      empresa,
      csd,
      cliente: orden.cliente,
      conceptos,
      subtotal: Math.round(subtotal * 100) / 100,
      descuento: Math.round(descuentoTotal * 100) / 100,
      iva: Math.round(ivaTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      usoCfdi: dto.usoCfdi || 'G03',
      formaPago: dto.formaPago || '01',
      metodoPago: dto.metodoPago || 'PUE',
      ordenFolio: orden.folio,
    });

    const factura = await this.prisma.facturaFiscal.create({
      data: {
        empresaId,
        ordenTrabajoId: dto.ordenTrabajoId,
        folio,
        uuid,
        estado: 'TIMBRADA',
        xmlTimbrado: xml,
        fechaTimbrado: new Date(),
        receptorRfc: orden.cliente.rfc,
        receptorNombre: orden.cliente.nombre,
        receptorDomicilio: orden.cliente.direccion,
        subtotal: Math.round(subtotal * 100) / 100,
        descuento: Math.round(descuentoTotal * 100) / 100,
        iva: Math.round(ivaTotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        metodoPago: dto.metodoPago || 'PUE',
        formaPago: dto.formaPago || '01',
        usoCfdi: dto.usoCfdi || 'G03',
        createdBy: user.id,
        detalles: {
          create: conceptos.map((c) => ({
            cantidad: c.cantidad,
            claveProdServ: c.claveProdServ,
            claveUnidad: c.claveUnidad,
            unidad: c.unidad,
            descripcion: c.descripcion,
            precioUnitario: c.precioUnitario,
            importe: c.importe,
            descuento: c.descuento,
            iva: c.iva,
            total: c.total,
          })),
        },
      },
      include: { detalles: true },
    });

    await this.auditoria.registrar({
      usuarioId: user.id, accion: 'TIMBRAR_CFDI', entidad: 'FacturaFiscal', entidadId: factura.id,
      payload: { folio, uuid, total }, contexto: `Orden: ${orden.folio}`, ip,
    });

    return {
      id: factura.id,
      folio: factura.folio,
      uuid: factura.uuid,
      total: Number(factura.total),
      fechaTimbrado: factura.fechaTimbrado,
    };
  }

  async findAll(user: { id: string; roles: string[]; companyId?: string | null }, page = 1, limit = 20) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const [data, total] = await Promise.all([
      this.prisma.facturaFiscal.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ordenTrabajo: { select: { id: true, folio: true } },
          _count: { select: { detalles: true } },
        },
      }),
      this.prisma.facturaFiscal.count({ where: { empresaId } }),
    ]);

    return { data, total, page, limit };
  }

  async download(id: string, format: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const factura = await this.prisma.facturaFiscal.findUnique({
      where: { id },
      include: { detalles: true, empresa: true, ordenTrabajo: { include: { cliente: true } } },
    });

    if (!factura) throw new NotFoundException('Factura no encontrada');
    if (factura.empresaId !== user.companyId && !user.roles.includes('SuperUsuario')) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (format === 'xml') {
      return { tipo: 'xml', contenido: factura.xmlTimbrado, nombre: `CFDI_${factura.uuid}.xml` };
    }

    if (format === 'pdf') {
      const pdfHtml = this.generatePdfHtml(factura);
      return { tipo: 'html', contenido: pdfHtml, nombre: `CFDI_${factura.uuid}.html` };
    }

    throw new BadRequestException('Formato no soportado. Use "xml" o "pdf"');
  }

  private generateCfdiXml(params: {
    folio: string; uuid: string; fecha: string;
    empresa: any; csd: any; cliente: any;
    conceptos: any[]; subtotal: number; descuento: number; iva: number; total: number;
    usoCfdi: string; formaPago: string; metodoPago: string; ordenFolio: string;
  }): string {
    const conceptosXml = params.conceptos.map((c) => `
      <cfdi:Concepto ClaveProdServ="${c.claveProdServ}" NoIdentificacion="" Cantidad="${c.cantidad}" ClaveUnidad="${c.claveUnidad}" Unidad="${c.unidad}" Descripcion="${this.escapeXml(c.descripcion)}" ValorUnitario="${c.precioUnitario.toFixed(2)}" Importe="${c.importe.toFixed(2)}" ObjetoImp="02">
        <cfdi:Impuestos>
          <cfdi:Traslados>
            <cfdi:Traslado Base="${(c.importe - c.descuento).toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${c.iva.toFixed(2)}" />
          </cfdi:Traslados>
        </cfdi:Impuestos>
      </cfdi:Concepto>`).join('');

    const baseIva = params.subtotal - params.descuento;

    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Folio="${params.folio}" Fecha="${params.fecha}" Sello="${this.generateSello(params)}" NoCertificado="${params.csd.numeroCertificado || '00000000000000000000'}" Certificado="${params.csd.certificadoCer.substring(0, 20)}..." SubTotal="${params.subtotal.toFixed(2)}" Descuento="${params.descuento.toFixed(2)}" Moneda="MXN" Total="${params.total.toFixed(2)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="${params.metodoPago}" FormaPago="${params.formaPago}" LugarExpedicion="${params.empresa.codigoPostalFiscal}">
  <cfdi:InformacionGlobal Anio="${new Date().getFullYear()}" Meses="01" Periodicidad="01" />
  <cfdi:CfdiRelacionados TipoRelacion="04">
    <cfdi:CfdiRelacionado UUID="${params.uuid}" />
  </cfdi:CfdiRelacionados>
  <cfdi:Emisor Rfc="${params.empresa.rfc}" Nombre="${this.escapeXml(params.empresa.razonSocial)}" RegimenFiscal="${params.empresa.regimenFiscal}" />
  <cfdi:Receptor Rfc="${params.cliente.rfc}" Nombre="${this.escapeXml(params.cliente.nombre)}" DomicilioFiscalReceptor="${params.empresa.codigoPostalFiscal}" RegimenFiscalReceptor="616" UsoCFDI="${params.usoCfdi}" />
  <cfdi:Conceptos>${conceptosXml}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${params.iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${baseIva.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${params.iva.toFixed(2)}" />
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="1.1" UUID="${params.uuid}" FechaTimbrado="${params.fecha}" SelloCFD="${this.generateSello(params)}" NoCertificadoSAT="00001000000500000000" SelloSAT="${this.generateSello(params)}" />
  </cfdi:Complemento>
</cfdi:Comprobante>`;
  }

  private generateSello(params: any): string {
    const hash = crypto.createHash('sha256').update(`${params.folio}${params.total}`).digest('hex');
    return hash;
  }

  private generatePdfHtml(factura: any): string {
    const d = factura.detalles || [];
    const rows = d.map((det: any) =>
      `<tr><td>${det.cantidad}</td><td>${this.escapeXml(det.descripcion)}</td><td>$${Number(det.precioUnitario).toFixed(2)}</td><td>$${Number(det.importe).toFixed(2)}</td><td>$${Number(det.iva).toFixed(2)}</td><td>$${Number(det.total).toFixed(2)}</td></tr>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CFDI ${factura.folio}</title><style>
      body { font-family: Arial,sans-serif; margin: 40px; }
      .header { text-align: center; margin-bottom: 30px; }
      .header h1 { font-size: 18px; }
      .info { margin-bottom: 20px; }
      .info table { width: 100%; border-collapse: collapse; }
      .info td { padding: 4px 8px; font-size: 13px; }
      table.items { width: 100%; border-collapse: collapse; margin: 20px 0; }
      table.items th, table.items td { border: 1px solid #ccc; padding: 8px; font-size: 12px; text-align: left; }
      table.items th { background: #f5f5f5; }
      .totals { text-align: right; margin-top: 20px; }
      .totals p { margin: 4px 0; font-size: 14px; }
      .qr { text-align: center; margin-top: 30px; font-size: 11px; color: #666; }
    </style></head><body>
      <div class="header">
        <h1>Factura Electrónica CFDI 4.0</h1>
        <p>Folio: ${factura.folio} | UUID: ${factura.uuid}</p>
        <p>Estado: ${factura.estado} | Fecha: ${new Date(factura.createdAt).toLocaleDateString('es-MX')}</p>
      </div>
      <div class="info">
        <table>
          <tr><td><strong>Emisor:</strong></td><td>${this.escapeXml(factura.empresa?.razonSocial || '')}</td></tr>
          <tr><td><strong>RFC:</strong></td><td>${factura.empresa?.rfc || ''}</td></tr>
          <tr><td><strong>Receptor:</strong></td><td>${this.escapeXml(factura.receptorNombre)}</td></tr>
          <tr><td><strong>RFC Receptor:</strong></td><td>${factura.receptorRfc}</td></tr>
        </table>
      </div>
      <table class="items">
        <tr><th>Cant</th><th>Descripción</th><th>P.U.</th><th>Importe</th><th>IVA</th><th>Total</th></tr>
        ${rows}
      </table>
      <div class="totals">
        <p><strong>Subtotal:</strong> $${Number(factura.subtotal).toFixed(2)}</p>
        <p><strong>Descuento:</strong> $${Number(factura.descuento).toFixed(2)}</p>
        <p><strong>IVA:</strong> $${Number(factura.iva).toFixed(2)}</p>
        <p style="font-size: 16px;"><strong>Total:</strong> $${Number(factura.total).toFixed(2)}</p>
      </div>
      <div class="qr">
        <p>Comprobante Fiscal Digital v4.0 | Sello: ${factura.uuid?.substring(0, 20)}...</p>
        <p>Consulte el SAT: https://verificacfdi.facturaelectronica.sat.gob.mx</p>
      </div>
    </body></html>`;
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
}
