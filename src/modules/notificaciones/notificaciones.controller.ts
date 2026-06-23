import { Controller, Get, Put, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificacionesService } from './notificaciones.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('leida') leida?: string,
  ) {
    return this.service.findAll(req.user, Number(page) || 1, Number(limit) || 50, leida);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    return this.service.unreadCount(req.user);
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.service.markAllAsRead(req.user);
  }

  @Put(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.service.markAsRead(id, req.user);
  }
}
