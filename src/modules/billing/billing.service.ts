import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { EmitirFacturaDto } from './dto/billing.dto';
import { CfdiXmlBuilderService } from './services/cfdi-xml-builder.service';
import { CfdiDigitalSignerService } from './services/cfdi-digital-signer.service';
import { CfdiPdfGeneratorService } from './services/cfdi-pdf-generator.service';
import { CfdiValidatorService } from './services/cfdi-validator.service';
import { CfdiCancellationService } from './services/cfdi-cancellation.service';
import type { StampingProvider } from './interfaces/stamping-provider.interface';
import { ConceptoData } from './interfaces/xml-builder.interface';

@Injectable()
export class BillingService {
  private readonly IVA_RATE = 0.16;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly xmlBuilder: CfdiXmlBuilderService,
    private readonly digitalSigner: CfdiDigitalSignerService,
    private readonly pdfGenerator: CfdiPdfGeneratorService,
    private readonly validator: CfdiValidatorService,
    private readonly cancellation: CfdiCancellationService,
    @Inject('STAMPING_PROVIDER') private readonly stampingProvider: StampingProvider,
  ) {}

  async issue(
    dto: EmitirFacturaDto,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const detallesDto = dto.detalles && dto.detalles.length > 0
      ? dto.detalles
      : [];

    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id: dto.ordenTrabajoId },
      include: { cliente: true, pagos: true },
    });
    if (!orden) throw new NotFoundException('Orden de trabajo no encontrada');

    const { empresa, csd } = await this.validator.validateIssue({
      empresaId,
      ordenTrabajoId: dto.ordenTrabajoId,
      receptorRfc: orden?.cliente?.rfc || '',
      detalles: detallesDto.length > 0
        ? detallesDto.map((d) => ({
            cantidad: d.cantidad,
            descripcion: d.descripcion,
            precioUnitario: d.precioUnitario,
          }))
        : [{ cantidad: 1, descripcion: 'Servicios de taller', precioUnitario: 0 }],
    });

    const folio = await this.generateFolio(empresaId, dto.serie);

    let conceptos: ConceptoData[] = [];
    if (detallesDto.length > 0) {
      conceptos = detallesDto.map((det) => {
        const importe = det.cantidad * det.precioUnitario;
        const descuento = det.descuento || 0;
        const base = importe - descuento;
        const iva = Math.round(base * this.IVA_RATE * 100) / 100;
        return {
          cantidad: det.cantidad,
          claveProdServ: det.claveProdServ || '78111805',
          claveUnidad: det.claveUnidad || 'E48',
          unidad: det.unidad || 'Servicio',
          noIdentificacion: det.noIdentificacion,
          descripcion: det.descripcion,
          precioUnitario: det.precioUnitario,
          importe: Math.round(importe * 100) / 100,
          descuento,
          iva,
          objetoImp: det.objetoImp || '02',
          base,
        };
      });
    } else {
      const totalPagado = orden.pagos.reduce((sum: number, p: any) => sum + Number(p.monto), 0);
      const base = totalPagado;
      const iva = Math.round(base * this.IVA_RATE * 100) / 100;
      conceptos = [{
        cantidad: 1,
        claveProdServ: '78111805',
        claveUnidad: 'E48',
        unidad: 'Servicio',
        descripcion: `Servicios de taller - Orden ${orden.folio}`,
        precioUnitario: base,
        importe: base,
        descuento: 0,
        iva,
        objetoImp: '02',
        base,
      }];
    }

    const subtotal = conceptos.reduce((s, c) => s + c.importe, 0);
    const descuentoTotal = conceptos.reduce((s, c) => s + c.descuento, 0);
    const ivaTotal = conceptos.reduce((s, c) => s + c.iva, 0);
    const total = conceptos.reduce((s, c) => s + c.importe + c.iva - c.descuento, 0);

    const tipoComprobante = dto.tipoComprobante || 'I';
    const exportacion = dto.exportacion || '01';
    const lugarExpedicion = empresa.codigoPostalFiscal;

    const xmlUnsigned = this.xmlBuilder.buildXml({
      emisor: {
        rfc: empresa.rfc,
        razonSocial: empresa.razonSocial,
        regimenFiscal: empresa.regimenFiscal,
        codigoPostalFiscal: empresa.codigoPostalFiscal,
        certificadoCer: csd.certificadoCer,
        numeroCertificado: csd.numeroCertificado || undefined,
      },
      receptor: {
        rfc: orden.cliente.rfc || '',
        nombre: orden.cliente.nombre || '',
        domicilioFiscalReceptor: empresa.codigoPostalFiscal,
        regimenFiscalReceptor: '616',
        usoCfdi: dto.usoCfdi || 'G03',
      },
      conceptos,
      folio,
      serie: dto.serie,
      lugarExpedicion,
      tipoComprobante,
      exportacion,
      formaPago: dto.formaPago || '01',
      metodoPago: dto.metodoPago || 'PUE',
      usoCfdi: dto.usoCfdi || 'G03',
      subtotal: Math.round(subtotal * 100) / 100,
      descuento: Math.round(descuentoTotal * 100) / 100,
      iva: Math.round(ivaTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      relacionTipo: dto.relacionTipo,
      relacionUuid: dto.relacionUuid,
    });

    const decryptedKey = this.decryptKey(csd.llaveKey);
    const password = csd.passwordHash;

    const xmlSigned = this.digitalSigner.sign(xmlUnsigned, decryptedKey, password);

    const stampingResult = await this.stampingProvider.timbrar(xmlSigned, {
      certificadoCer: csd.certificadoCer,
      llaveKey: decryptedKey,
      password,
    });

    const xmlTimbrado = this.xmlBuilder.insertTimbre(stampingResult.xmlTimbrado, {
      uuid: stampingResult.uuid,
      fechaTimbrado: stampingResult.fechaTimbrado.toISOString().replace(/\.\d{3}Z/, '-06:00'),
      selloCFD: stampingResult.selloSAT,
      noCertificadoSAT: stampingResult.noCertificadoSAT,
      selloSAT: stampingResult.selloSAT,
    });

    const factura = await this.prisma.facturaFiscal.create({
      data: {
        empresaId,
        ordenTrabajoId: dto.ordenTrabajoId,
        sucursalId: dto.sucursalId || null,
        folio,
        serie: dto.serie || null,
        uuid: stampingResult.uuid,
        estado: 'TIMBRADA',
        xmlTimbrado,
        fechaTimbrado: stampingResult.fechaTimbrado,
        tipoComprobante,
        lugarExpedicion,
        exportacion,
        objetoImp: '02',
        receptorRfc: orden.cliente.rfc || '',
        receptorNombre: orden.cliente.nombre || '',
        receptorDomicilio: orden.cliente.direccion || null,
        subtotal: Math.round(subtotal * 100) / 100,
        descuento: Math.round(descuentoTotal * 100) / 100,
        iva: Math.round(ivaTotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        metodoPago: dto.metodoPago || 'PUE',
        formaPago: dto.formaPago || '01',
        usoCfdi: dto.usoCfdi || 'G03',
        relacionTipo: dto.relacionTipo || null,
        relacionUuid: dto.relacionUuid || null,
        createdBy: user.id,
        detalles: {
          create: conceptos.map((c) => ({
            cantidad: c.cantidad,
            claveProdServ: c.claveProdServ,
            claveUnidad: c.claveUnidad,
            unidad: c.unidad,
            noIdentificacion: c.noIdentificacion || null,
            descripcion: c.descripcion,
            precioUnitario: c.precioUnitario,
            importe: c.importe,
            descuento: c.descuento,
            iva: c.iva,
            objetoImp: c.objetoImp,
            total: c.importe + c.iva - c.descuento,
          })),
        },
      },
      include: { detalles: true },
    });

    await this.auditoria.registrar({
      usuarioId: user.id, accion: 'TIMBRAR_CFDI', entidad: 'FacturaFiscal', entidadId: factura.id,
      payload: { folio, uuid: stampingResult.uuid, total }, contexto: `Orden: ${orden.folio}`, ip,
    });

    return {
      id: factura.id,
      folio: factura.folio,
      serie: factura.serie,
      uuid: factura.uuid,
      total: Number(factura.total),
      fechaTimbrado: factura.fechaTimbrado,
      estado: factura.estado,
    };
  }

  async findAll(
    user: { id: string; roles: string[]; companyId?: string | null },
    page = 1,
    limit = 20,
    filters?: { estado?: string; desde?: string; hasta?: string; q?: string },
  ) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const where: any = { empresaId };

    if (filters?.estado) {
      where.estado = filters.estado;
    }
    if (filters?.desde || filters?.hasta) {
      where.createdAt = {};
      if (filters.desde) where.createdAt.gte = new Date(filters.desde);
      if (filters.hasta) where.createdAt.lte = new Date(filters.hasta);
    }
    if (filters?.q) {
      where.OR = [
        { folio: { contains: filters.q } },
        { receptorNombre: { contains: filters.q, mode: 'insensitive' } },
        { receptorRfc: { contains: filters.q } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.facturaFiscal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ordenTrabajo: { select: { id: true, folio: true } },
          _count: { select: { detalles: true } },
        },
      }),
      this.prisma.facturaFiscal.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, user: { id: string; roles: string[]; companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const factura = await this.prisma.facturaFiscal.findUnique({
      where: { id },
      include: {
        detalles: true,
        ordenTrabajo: {
          include: { cliente: { select: { id: true, nombre: true, rfc: true, direccion: true, email: true } } },
        },
        empresa: { select: { id: true, nombre: true, rfc: true, razonSocial: true, regimenFiscal: true, codigoPostalFiscal: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
    });

    if (!factura || factura.empresaId !== empresaId) {
      return null;
    }

    return factura;
  }

  async download(
    id: string,
    format: string,
    user: { id: string; roles: string[]; companyId?: string | null },
  ) {
    const factura = await this.findOne(id, user);
    if (!factura) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (format === 'xml') {
      return { tipo: 'xml', contenido: factura.xmlTimbrado, nombre: `CFDI_${factura.uuid}.xml` };
    }

    if (format === 'pdf') {
      const pdfData = {
        folio: factura.folio,
        serie: factura.serie || undefined,
        uuid: factura.uuid || undefined,
        estado: factura.estado,
        fechaTimbrado: factura.fechaTimbrado || undefined,
        createdAt: factura.createdAt,
        tipoComprobante: factura.tipoComprobante,
        lugarExpedicion: factura.lugarExpedicion,
        exportacion: factura.exportacion,
        emisor: {
          rfc: factura.empresa.rfc,
          razonSocial: factura.empresa.razonSocial,
          regimenFiscal: factura.empresa.regimenFiscal,
          codigoPostalFiscal: factura.empresa.codigoPostalFiscal,
        },
        receptor: {
          rfc: factura.receptorRfc,
          nombre: factura.receptorNombre,
          domicilio: factura.receptorDomicilio || undefined,
        },
        conceptos: factura.detalles.map((d) => ({
          cantidad: Number(d.cantidad),
          claveProdServ: d.claveProdServ,
          claveUnidad: d.claveUnidad,
          unidad: d.unidad,
          descripcion: d.descripcion,
          precioUnitario: Number(d.precioUnitario),
          importe: Number(d.importe),
          descuento: Number(d.descuento),
          iva: Number(d.iva),
          total: Number(d.total),
        })),
        subtotal: Number(factura.subtotal),
        descuento: Number(factura.descuento),
        iva: Number(factura.iva),
        total: Number(factura.total),
        metodoPago: factura.metodoPago,
        formaPago: factura.formaPago,
        usoCfdi: factura.usoCfdi,
      };
      const pdfBuffer = await this.pdfGenerator.generate(pdfData);
      return { tipo: 'html', contenido: pdfBuffer.toString('utf8'), nombre: `CFDI_${factura.uuid}.html` };
    }

    throw new BadRequestException('Formato no soportado. Use "xml" o "pdf"');
  }

  async cancel(
    id: string,
    motivo: string,
    uuidSustituto: string | undefined,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    return this.cancellation.cancel(id, motivo, uuidSustituto, this.stampingProvider, user, ip);
  }

  async stats(user: { id: string; roles: string[]; companyId?: string | null }) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [emitidas, pendientes, canceladas, ingresosMes, ingresosAnio, recientes, ingresosPorDia] =
      await Promise.all([
        this.prisma.facturaFiscal.count({
          where: { empresaId, estado: 'TIMBRADA', createdAt: { gte: startOfMonth } },
        }),
        this.prisma.facturaFiscal.count({
          where: { empresaId, estado: 'GENERADA' },
        }),
        this.prisma.facturaFiscal.count({
          where: { empresaId, estado: 'CANCELADA', createdAt: { gte: startOfMonth } },
        }),
        this.prisma.facturaFiscal.aggregate({
          where: { empresaId, estado: 'TIMBRADA', createdAt: { gte: startOfMonth } },
          _sum: { total: true },
        }),
        this.prisma.facturaFiscal.aggregate({
          where: { empresaId, estado: 'TIMBRADA', createdAt: { gte: startOfYear } },
          _sum: { total: true },
        }),
        this.prisma.facturaFiscal.findMany({
          where: { empresaId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, folio: true, uuid: true, total: true, estado: true, createdAt: true, receptorNombre: true },
        }),
        this.prisma.$queryRaw`
          SELECT DATE(created_at) as fecha, SUM(total) as total
          FROM "FacturaFiscal"
          WHERE empresa_id = ${empresaId} AND estado = 'TIMBRADA'
            AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY fecha ASC
        `,
      ]);

    return {
      facturasEmitidas: emitidas,
      facturasPendientes: pendientes,
      facturasCanceladas: canceladas,
      ingresosFacturados: Number(ingresosMes._sum.total || 0),
      ingresosAnio: Number(ingresosAnio._sum.total || 0),
      facturasRecientes: recientes,
      ingresosPorDia,
    };
  }

  async getSatCatalogs() {
    const [regimenes, usos, formasPago, metodosPago, objetosImp, tiposRelacion, tiposComprobante] =
      await Promise.all([
        this.prisma.satRegimenFiscal.findMany({ orderBy: { codigo: 'asc' } }),
        this.prisma.satUsoCfdi.findMany({ orderBy: { codigo: 'asc' } }),
        this.prisma.satFormaPago.findMany({ orderBy: { codigo: 'asc' } }),
        this.prisma.satMetodoPago.findMany({ orderBy: { codigo: 'asc' } }),
        this.prisma.satObjetoImp.findMany({ orderBy: { codigo: 'asc' } }),
        this.prisma.satTipoRelacion.findMany({ orderBy: { codigo: 'asc' } }),
        this.prisma.satTipoComprobante.findMany({ orderBy: { codigo: 'asc' } }),
      ]);

    return {
      regimenesFiscales: regimenes,
      usosCfdi: usos,
      formasPago,
      metodosPago,
      objetosImpuesto: objetosImp,
      tiposRelacion,
      tiposComprobante,
    };
  }

  private async generateFolio(empresaId: string, serie?: string): Promise<string> {
    const prefix = serie || 'F';
    const count = await this.prisma.facturaFiscal.count({
      where: { empresaId, serie: serie || null },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private decryptKey(encryptedKey: string): string {
    try {
      const [ivHex, encrypted] = encryptedKey.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = require('crypto').scryptSync(
        process.env.CSD_ENCRYPTION_KEY || 'neoMotors-csd-encryption-key-32bytes!!',
        'csd-salt',
        32,
      );
      const decipher = require('crypto').createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedKey;
    }
  }
}
