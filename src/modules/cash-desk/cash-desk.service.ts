import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  OpenCashDeskDto,
  CloseCashDeskDto,
  RegisterPaymentDto,
  RegisterTransactionDto,
} from './dto/cash-desk.dto';

@Injectable()
export class CashDeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async open(
    dto: OpenCashDeskDto,
    user: { id: string; roles: string[]; companyId?: string | null; branchId?: string | null },
    ip?: string,
  ) {
    const empresaId = user.companyId;
    const sucursalId = user.branchId;
    if (!empresaId || !sucursalId) throw new ForbiddenException('Debe tener empresa y sucursal activa');

    const active = await this.prisma.caja.findFirst({
      where: { empresaId, sucursalId, estado: 'ABIERTA' },
    });
    if (active) throw new BadRequestException('Ya existe una caja abierta en esta sucursal');

    const caja = await this.prisma.caja.create({
      data: {
        empresaId,
        sucursalId,
        saldoInicial: dto.saldoInicial,
        saldoActual: dto.saldoInicial,
        observaciones: dto.observaciones,
        operadorAperturaId: user.id,
        movimientos: {
          create: {
            tipo: 'APERTURA',
            monto: dto.saldoInicial,
            saldoAnterior: 0,
            saldoNuevo: dto.saldoInicial,
            observaciones: 'Apertura de caja',
            createdBy: user.id,
          },
        },
      },
      include: { movimientos: { orderBy: { createdAt: 'asc' } } },
    });

    await this.auditoria.registrar({
      usuarioId: user.id, accion: 'ABRIR_CAJA', entidad: 'Caja', entidadId: caja.id,
      payload: { saldoInicial: dto.saldoInicial }, contexto: `Sucursal: ${sucursalId}`, ip,
    });

    return caja;
  }

  async close(
    dto: CloseCashDeskDto,
    user: { id: string; roles: string[]; companyId?: string | null; branchId?: string | null },
    ip?: string,
  ) {
    const sucursalId = user.branchId;
    if (!sucursalId) throw new ForbiddenException('Debe tener sucursal activa');

    const caja = await this.prisma.caja.findFirst({
      where: { sucursalId, estado: 'ABIERTA' },
    });
    if (!caja) throw new NotFoundException('No hay caja abierta en esta sucursal');

    const diferencia = Number(dto.conteoFisico) - Number(caja.saldoActual);

    const updated = await this.prisma.caja.update({
      where: { id: caja.id },
      data: {
        estado: 'CERRADA',
        conteoFisico: dto.conteoFisico,
        diferencia,
        fechaCierre: new Date(),
        operadorCierreId: user.id,
        observaciones: dto.observaciones,
        movimientos: {
          create: {
            tipo: 'CIERRE',
            monto: dto.conteoFisico,
            saldoAnterior: caja.saldoActual,
            saldoNuevo: 0,
            observaciones: `Cierre de caja. Conteo: ${dto.conteoFisico}, Diferencia: ${diferencia}`,
            createdBy: user.id,
          },
        },
      },
      include: { movimientos: { orderBy: { createdAt: 'asc' } } },
    });

    await this.auditoria.registrar({
      usuarioId: user.id, accion: 'CERRAR_CAJA', entidad: 'Caja', entidadId: caja.id,
      payload: { conteoFisico: dto.conteoFisico, diferencia }, contexto: `Sucursal: ${sucursalId}`, ip,
    });

    return updated;
  }

  async registerPayment(
    dto: RegisterPaymentDto,
    user: { id: string; roles: string[]; companyId?: string | null; branchId?: string | null },
    ip?: string,
  ) {
    const empresaId = user.companyId;
    const sucursalId = user.branchId;
    if (!empresaId || !sucursalId) throw new ForbiddenException('Debe tener empresa y sucursal activa');

    const orden = await this.prisma.ordenTrabajo.findUnique({ where: { id: dto.ordenTrabajoId } });
    if (!orden || orden.empresaId !== empresaId) throw new NotFoundException('Orden de trabajo no encontrada');

    const caja = await this.prisma.caja.findFirst({
      where: { empresaId, sucursalId, estado: 'ABIERTA' },
    });
    if (!caja) throw new BadRequestException('No hay caja abierta en esta sucursal');

    const monto = Number(dto.monto);

    return this.prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: {
          empresaId,
          sucursalId,
          cajaId: caja.id,
          ordenTrabajoId: dto.ordenTrabajoId,
          monto,
          metodoPago: dto.metodoPago || 'EFECTIVO',
          referencia: dto.referencia,
          esParcial: dto.esParcial ?? false,
          createdBy: user.id,
        },
      });

      const saldoAnterior = caja.saldoActual;
      const saldoNuevo = Number(saldoAnterior) + monto;

      await tx.caja.update({
        where: { id: caja.id },
        data: { saldoActual: saldoNuevo },
      });

      await tx.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          tipo: 'PAGO',
          monto,
          saldoAnterior: saldoAnterior,
          saldoNuevo,
          referencia: pago.id,
          observaciones: `Pago orden ${orden.folio} - ${dto.metodoPago || 'EFECTIVO'}`,
          createdBy: user.id,
        },
      });

      await this.auditoria.registrar({
        usuarioId: user.id, accion: 'REGISTRAR_PAGO', entidad: 'Pago', entidadId: pago.id,
        payload: { ordenTrabajoId: dto.ordenTrabajoId, monto, metodoPago: dto.metodoPago },
        contexto: `Sucursal: ${sucursalId}`, ip,
      });

      return pago;
    });
  }

  async registerTransaction(
    dto: RegisterTransactionDto,
    user: { id: string; roles: string[]; companyId?: string | null; branchId?: string | null },
    ip?: string,
  ) {
    const sucursalId = user.branchId;
    if (!sucursalId) throw new ForbiddenException('De tener sucursal activa');

    const caja = await this.prisma.caja.findFirst({
      where: { sucursalId, estado: 'ABIERTA' },
    });
    if (!caja) throw new NotFoundException('No hay caja abierta en esta sucursal');

    const monto = Number(dto.monto);
    const esIngreso = dto.tipo === 'INGRESO';
    const saldoAnterior = Number(caja.saldoActual);
    const saldoNuevo = esIngreso ? saldoAnterior + monto : saldoAnterior - monto;

    if (!esIngreso && saldoNuevo < 0) {
      throw new BadRequestException('Saldo insuficiente en caja');
    }

    const updated = await this.prisma.caja.update({
      where: { id: caja.id },
      data: { saldoActual: saldoNuevo },
    });

    const mov = await this.prisma.movimientoCaja.create({
      data: {
        cajaId: caja.id,
        tipo: dto.tipo,
        monto,
        saldoAnterior,
        saldoNuevo,
        observaciones: dto.observaciones,
        createdBy: user.id,
      },
    });

    await this.auditoria.registrar({
      usuarioId: user.id, accion: dto.tipo === 'RETIRO' ? 'RETIRAR_EFECTIVO' : 'INGRESAR_EFECTIVO',
      entidad: 'Caja', entidadId: caja.id,
      payload: { tipo: dto.tipo, monto }, contexto: `Sucursal: ${sucursalId}`, ip,
    });

    return { caja: updated, movimiento: mov };
  }

  async getStatus(user: { id: string; roles: string[]; companyId?: string | null; branchId?: string | null }) {
    const sucursalId = user.branchId;
    if (!sucursalId) throw new ForbiddenException('Debe tener sucursal activa');

    const caja = await this.prisma.caja.findFirst({
      where: { sucursalId, estado: 'ABIERTA' },
      include: {
        movimientos: { orderBy: { createdAt: 'desc' }, take: 50 },
        operadorApertura: { select: { id: true, nombre: true, email: true } },
      },
    });

    if (!caja) {
      const historial = await this.prisma.caja.findMany({
        where: { sucursalId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          operadorApertura: { select: { id: true, nombre: true } },
          operadorCierre: { select: { id: true, nombre: true } },
        },
      });
      return { activa: null, historial };
    }

    return { activa: caja, historial: null };
  }

  async getHistory(
    user: { id: string; roles: string[]; companyId?: string | null; branchId?: string | null },
    page = 1,
    limit = 20,
  ) {
    const sucursalId = user.branchId;
    if (!sucursalId) throw new ForbiddenException('Debe tener sucursal activa');

    return this.prisma.caja.findMany({
      where: { sucursalId, estado: 'CERRADA' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        operadorApertura: { select: { id: true, nombre: true } },
        operadorCierre: { select: { id: true, nombre: true } },
      },
    });
  }
}
