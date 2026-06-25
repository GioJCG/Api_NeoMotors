import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContextService } from './context.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  SetCompanyContextDto,
  SetBranchContextDto,
  GetBranchesQueryDto,
} from './dto/set-context.dto';
import type { Request } from 'express';

@ApiTags('Contexto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('context')
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @Get('companies')
  @ApiOperation({ summary: 'Obtener empresas disponibles del usuario' })
  async getCompanies(@Req() req: Request) {
    const user = req.user as any;
    return this.contextService.getUserCompanies(user.id, user.roles);
  }

  @Get('branches')
  @ApiOperation({
    summary: 'Obtener sucursales disponibles del usuario en una empresa',
  })
  async getBranches(@Query() query: GetBranchesQueryDto, @Req() req: Request) {
    const user = req.user as any;
    return this.contextService.getUserBranches(user.id, query.empresaId, user.roles);
  }

  @Put('company')
  @ApiOperation({ summary: 'Cambiar empresa activa' })
  async setCompany(@Body() dto: SetCompanyContextDto, @Req() req: Request) {
    const user = req.user as any;
    return this.contextService.setActiveCompany(user.id, dto.empresaId, user.roles);
  }

  @Put('branch')
  @ApiOperation({ summary: 'Cambiar sucursal activa' })
  async setBranch(@Body() dto: SetBranchContextDto, @Req() req: Request) {
    const user = req.user as any;
    return this.contextService.setActiveBranch(user.id, dto.sucursalId, user.roles);
  }
}
