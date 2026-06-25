import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FiscalService } from './fiscal.service';
import { UploadCsdDto } from './dto/fiscal.dto';
import { Roles } from '../rbac/decorators/roles.decorator';

@Controller('fiscal')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FiscalController {
  constructor(private readonly service: FiscalService) {}

  @Post('upload-csd')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal')
  uploadCsd(@Req() req: any, @Body() dto: UploadCsdDto) {
    return this.service.uploadCsd(dto, req.user, req.ip);
  }

  @Get('csd-status')
  @Roles('SuperUsuario', 'AdministradorEmpresa', 'SupervisorSucursal', 'Operador', 'Consulta')
  getStatus(@Req() req: any) {
    return this.service.getStatus(req.user);
  }
}
