import { Controller, Get, Put, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { Roles } from '../rbac/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('leida') leida?: string,
  ) {
    return this.service.findAll(req.user, Number(page) || 1, Number(limit) || 50, leida);
  }

  @Get('unread-count')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  async unreadCount(@Req() req: any) {
    return this.service.unreadCount(req.user);
  }

  @Put('read-all')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  async markAllAsRead(@Req() req: any) {
    return this.service.markAllAsRead(req.user);
  }

  @Put(':id/read')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.service.markAsRead(id, req.user);
  }
}
