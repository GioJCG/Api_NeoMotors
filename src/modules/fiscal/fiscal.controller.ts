import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { FiscalService } from './fiscal.service';
import { UploadCsdDto } from './dto/fiscal.dto';

@ApiTags('Fiscal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles('SuperUsuario', 'AdministradorEmpresa')
export class FiscalController {
  constructor(private readonly service: FiscalService) {}

  @Post('upload-csd')
  uploadCsd(@Req() req: any, @Body() dto: UploadCsdDto) {
    return this.service.uploadCsd(dto, req.user, req.ip);
  }

  @Get('csd-status')
  getStatus(@Req() req: any) {
    return this.service.getStatus(req.user);
  }
}
