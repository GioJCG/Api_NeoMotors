import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { EmpresasService } from './empresas.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Empresas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class EmpresasController {
  private readonly logger = new Logger(EmpresasController.name);

  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Crear empresa' })
  @ApiResponse({ status: 201, description: 'Empresa creada.' })
  @ApiResponse({ status: 409, description: 'RFC duplicado.' })
  async create(@Body() dto: CreateEmpresaDto, @Req() req: Request) {
    const user = req.user as any;
    this.logger.log(`[create] REACHED CONTROLLER. user.id=${user?.id}, dto.nombre=${dto?.nombre}`);
    this.logger.log(`[create] req.headers.authorization present: ${!!req.headers?.authorization}`);
    try {
      const result = await this.empresasService.create(dto, user.id, user, req.ip);
      this.logger.log(`[create] SUCCESS. empresa.id=${result?.id || 'unknown'}`);
      return result;
    } catch (error) {
      this.logger.error(`[create] ERROR: ${error.message}`);
      throw error;
    }
  }

  @Post('logo')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Subir logotipo de empresa' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Formato no permitido. Use PNG, JPG, SVG o WEBP.'), false);
        }
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    if (!file) {
      throw new BadRequestException('Archivo no proporcionado');
    }
    return this.empresasService.saveLogo(file);
  }

  @Get()
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Listar empresas' })
  async findAll(@Req() req: Request) {
    return this.empresasService.findAll(req.user as any);
  }

  @Get(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Obtener empresa por ID' })
  async findById(@Param('id') id: string, @Req() req: Request) {
    return this.empresasService.findById(id, req.user as any);
  }

  @Put(':id')
  @Roles('SuperUsuario', 'AdministradorEmpresa')
  @ApiOperation({ summary: 'Actualizar empresa' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmpresaDto,
    @Req() req: Request,
  ) {
    return this.empresasService.update(id, dto, req.user as any, req.ip);
  }

  @Delete(':id')
  @Roles('SuperUsuario')
  @ApiOperation({ summary: 'Desactivar empresa (solo SuperUsuario)' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    return this.empresasService.remove(id, req.user as any, req.ip);
  }
}
