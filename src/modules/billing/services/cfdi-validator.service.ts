import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CfdiValidatorService {
  private readonly RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

  constructor(private readonly prisma: PrismaService) {}

  async validateIssue(params: {
    empresaId: string;
    ordenTrabajoId: string;
    receptorRfc: string;
    detalles: Array<{ cantidad: number; descripcion: string; precioUnitario: number }>;
  }) {
    const { empresaId, ordenTrabajoId, receptorRfc } = params;

    if (!receptorRfc || !this.RFC_REGEX.test(receptorRfc)) {
      throw new BadRequestException('RFC del receptor inválido. Debe tener 12 o 13 caracteres.');
    }

    const empresa = await this.prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    if (!empresa.rfc || !this.RFC_REGEX.test(empresa.rfc)) {
      throw new BadRequestException('La empresa no tiene un RFC válido registrado');
    }
    if (!empresa.regimenFiscal) {
      throw new BadRequestException('La empresa no tiene régimen fiscal registrado');
    }

    const csd = await this.prisma.certificadoFiscal.findUnique({ where: { empresaId } });
    if (!csd || !csd.activo) {
      throw new BadRequestException('No hay un CSD activo para esta empresa. Cargue uno en Fiscal > CSD.');
    }
    if (csd.vigenciaHasta < new Date()) {
      throw new BadRequestException('El CSD está vencido');
    }

    const orden = await this.prisma.ordenTrabajo.findUnique({
      where: { id: ordenTrabajoId },
      include: { pagos: true },
    });
    if (!orden || orden.empresaId !== empresaId) {
      throw new BadRequestException('Orden de trabajo no encontrada');
    }
    if (orden.estado !== 'FACTURADO' && orden.estado !== 'ENTREGADO') {
      throw new BadRequestException('La orden debe estar en estado FACTURADO o ENTREGADO');
    }

    if (params.detalles.length === 0) {
      throw new BadRequestException('Debe incluir al menos un concepto');
    }

    for (const det of params.detalles) {
      if (det.cantidad <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a 0');
      }
      if (det.precioUnitario < 0) {
        throw new BadRequestException('El precio unitario no puede ser negativo');
      }
      if (!det.descripcion || det.descripcion.trim().length === 0) {
        throw new BadRequestException('La descripción del concepto es requerida');
      }
    }

    return { empresa, csd, orden };
  }

  async validateCancel(facturaId: string, empresaId: string) {
    const factura = await this.prisma.facturaFiscal.findUnique({
      where: { id: facturaId },
    });

    if (!factura) {
      throw new BadRequestException('Factura no encontrada');
    }
    if (factura.empresaId !== empresaId) {
      throw new BadRequestException('Factura no encontrada en esta empresa');
    }
    if (factura.estado !== 'TIMBRADA') {
      throw new BadRequestException('Solo se pueden cancelar facturas en estado TIMBRADA');
    }

    return factura;
  }
}
