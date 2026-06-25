import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditoriaService } from '../../auditoria/auditoria.service';
import { StampingProvider } from '../interfaces/stamping-provider.interface';

@Injectable()
export class CfdiCancellationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async cancel(
    facturaId: string,
    motivo: string,
    uuidSustituto: string | undefined,
    stampingProvider: StampingProvider,
    user: { id: string; roles: string[]; companyId?: string | null },
    ip?: string,
  ) {
    const empresaId = user.companyId;
    if (!empresaId) throw new ForbiddenException('Debe tener empresa activa');

    const factura = await this.prisma.facturaFiscal.findUnique({
      where: { id: facturaId },
      include: { empresa: true },
    });
    if (!factura) throw new NotFoundException('Factura no encontrada');
    if (factura.empresaId !== empresaId) throw new NotFoundException('Factura no encontrada');
    if (factura.estado !== 'TIMBRADA') {
      throw new BadRequestException('Solo se pueden cancelar facturas en estado TIMBRADA');
    }

    const csd = await this.prisma.certificadoFiscal.findUnique({ where: { empresaId } });
    if (!csd || !csd.activo) {
      throw new BadRequestException('No hay CSD activo para cancelar. Cargue uno en Fiscal.');
    }

    const result = await stampingProvider.cancelar(
      factura.uuid!,
      { certificadoCer: csd.certificadoCer, llaveKey: csd.llaveKey, password: csd.passwordHash },
      motivo,
      uuidSustituto,
    );

    const updated = await this.prisma.facturaFiscal.update({
      where: { id: facturaId },
      data: {
        estado: 'CANCELADA',
        motivoCancelacion: motivo,
        uuidSustituto: uuidSustituto,
        fechaCancelacion: result.fechaCancelacion,
        acuseCancelacion: result.acuse,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id,
      accion: 'CANCELAR_CFDI',
      entidad: 'FacturaFiscal',
      entidadId: facturaId,
      payload: { uuid: factura.uuid, motivo, estatusPAC: result.estatus },
      contexto: `Folio: ${factura.folio}`,
      ip,
    });

    return {
      id: updated.id,
      folio: updated.folio,
      uuid: updated.uuid,
      estado: updated.estado,
      fechaCancelacion: updated.fechaCancelacion,
    };
  }
}
