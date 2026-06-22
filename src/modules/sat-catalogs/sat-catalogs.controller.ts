import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SatCatalogsService } from './sat-catalogs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';

@ApiTags('Catálogos SAT')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sat')
export class SatCatalogsController {
  constructor(private readonly satCatalogsService: SatCatalogsService) {}

  @Get('paises')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Listar países (catálogo SAT)' })
  @ApiQuery({ name: 'search', required: false })
  findPaises(@Query('search') search?: string) {
    return this.satCatalogsService.findPaises(search);
  }

  @Get('estados')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Listar estados por país (catálogo SAT)' })
  @ApiQuery({ name: 'paisId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findEstados(
    @Query('paisId') paisId?: string,
    @Query('search') search?: string,
  ) {
    return this.satCatalogsService.findEstados(paisId, search);
  }

  @Get('municipios')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Listar municipios por estado (catálogo SAT)' })
  @ApiQuery({ name: 'estadoId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findMunicipios(
    @Query('estadoId') estadoId?: string,
    @Query('search') search?: string,
  ) {
    return this.satCatalogsService.findMunicipios(estadoId, search);
  }

  @Get('codigos-postales')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Buscar códigos postales (catálogo SAT)' })
  @ApiQuery({ name: 'codigo', required: false })
  @ApiQuery({ name: 'municipioId', required: false })
  findCodigosPostales(
    @Query('codigo') codigo?: string,
    @Query('municipioId') municipioId?: string,
  ) {
    return this.satCatalogsService.findCodigosPostales(codigo, municipioId);
  }

  @Get('colonias')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Listar colonias por código postal (catálogo SAT)' })
  @ApiQuery({ name: 'codigoPostalId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findColonias(
    @Query('codigoPostalId') codigoPostalId?: string,
    @Query('search') search?: string,
  ) {
    return this.satCatalogsService.findColonias(codigoPostalId, search);
  }

  @Get('productos-servicios')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Buscar productos y servicios (catálogo SAT)' })
  @ApiQuery({ name: 'search', required: false })
  findProductosServicios(@Query('search') search?: string) {
    return this.satCatalogsService.findProductosServicios(search);
  }

  @Get('unidades-medida')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Listar unidades de medida (catálogo SAT)' })
  @ApiQuery({ name: 'search', required: false })
  findUnidadesMedida(@Query('search') search?: string) {
    return this.satCatalogsService.findUnidadesMedida(search);
  }

  @Get('regimenes-fiscales')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Listar regímenes fiscales (catálogo SAT)' })
  @ApiQuery({ name: 'search', required: false })
  findRegimenesFiscales(@Query('search') search?: string) {
    return this.satCatalogsService.findRegimenesFiscales(search);
  }

  @Get('usos-cfdi')
  @Roles(
    'SuperUsuario',
    'AdministradorEmpresa',
    'SupervisorSucursal',
    'Operador',
    'Consulta',
  )
  @ApiOperation({ summary: 'Listar usos de CFDI (catálogo SAT)' })
  @ApiQuery({ name: 'search', required: false })
  findUsosCfdi(@Query('search') search?: string) {
    return this.satCatalogsService.findUsosCfdi(search);
  }
}
