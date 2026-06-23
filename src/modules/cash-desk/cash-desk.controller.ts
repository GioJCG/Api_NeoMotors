import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CashDeskService } from './cash-desk.service';
import {
  OpenCashDeskDto,
  CloseCashDeskDto,
  RegisterPaymentDto,
  RegisterTransactionDto,
} from './dto/cash-desk.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Caja')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-desk')
export class CashDeskController {
  constructor(private readonly cashDeskService: CashDeskService) {}

  @Get('status')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  @ApiOperation({ summary: 'Estado actual de caja e historial reciente' })
  getStatus(@Req() req: Request) {
    return this.cashDeskService.getStatus(req.user as any);
  }

  @Get('history')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Consulta')
  @ApiOperation({ summary: 'Historial de cierres de caja' })
  getHistory(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.cashDeskService.getHistory(req.user as any, Number(page) || 1, Number(limit) || 20);
  }

  @Post('open')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Abrir caja con saldo inicial' })
  open(@Body() dto: OpenCashDeskDto, @Req() req: Request) {
    return this.cashDeskService.open(dto, req.user as any, req.ip);
  }

  @Post('close')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Cerrar caja con conteo físico y cálculo de diferencia' })
  close(@Body() dto: CloseCashDeskDto, @Req() req: Request) {
    return this.cashDeskService.close(dto, req.user as any, req.ip);
  }

  @Post('payment')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador')
  @ApiOperation({ summary: 'Registrar pago de orden de trabajo' })
  registerPayment(@Body() dto: RegisterPaymentDto, @Req() req: Request) {
    return this.cashDeskService.registerPayment(dto, req.user as any, req.ip);
  }

  @Post('transaction')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  @ApiOperation({ summary: 'Registrar ingreso o retiro de efectivo' })
  registerTransaction(@Body() dto: RegisterTransactionDto, @Req() req: Request) {
    return this.cashDeskService.registerTransaction(dto, req.user as any, req.ip);
  }
}
