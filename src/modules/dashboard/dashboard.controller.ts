import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('order-stats')
  getOrderStats(@Req() req: any) {
    return this.service.getOrderStats(req.user);
  }

  @Get('revenue')
  getRevenue(
    @Req() req: any,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.getRevenue(req.user, desde, hasta);
  }

  @Get('stock-alerts')
  getStockAlerts(@Req() req: any) {
    return this.service.getStockAlerts(req.user);
  }

  @Get('technician-efficiency')
  getTechnicianEfficiency(@Req() req: any) {
    return this.service.getTechnicianEfficiency(req.user);
  }
}
