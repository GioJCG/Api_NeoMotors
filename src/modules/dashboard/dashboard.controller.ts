import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../rbac/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('order-stats')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  getOrderStats(@Req() req: any) {
    return this.service.getOrderStats(req.user);
  }

  @Get('revenue')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  getRevenue(
    @Req() req: any,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.getRevenue(req.user, desde, hasta);
  }

  @Get('stock-alerts')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  getStockAlerts(@Req() req: any) {
    return this.service.getStockAlerts(req.user);
  }

  @Get('technician-efficiency')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  getTechnicianEfficiency(@Req() req: any) {
    return this.service.getTechnicianEfficiency(req.user);
  }
}
