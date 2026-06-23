import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditoriaService } from './auditoria.service';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'))
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entidad') entidad?: string,
    @Query('accion') accion?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.findAll(req.user, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      entidad,
      accion,
      usuarioId,
      desde,
      hasta,
    });
  }
}
