import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SatCatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  findPaises(search?: string) {
    return this.prisma.satPais.findMany({
      where: search
        ? { nombre: { contains: search, mode: 'insensitive' } }
        : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  findEstados(paisId?: string, search?: string) {
    return this.prisma.satEstado.findMany({
      where: {
        ...(paisId ? { paisId } : {}),
        ...(search
          ? { nombre: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  findMunicipios(estadoId?: string, search?: string) {
    return this.prisma.satMunicipio.findMany({
      where: {
        ...(estadoId ? { estadoId } : {}),
        ...(search
          ? { nombre: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  findCodigosPostales(codigo?: string, municipioId?: string) {
    return this.prisma.satCodigoPostal.findMany({
      where: {
        ...(codigo ? { codigo: { startsWith: codigo } } : {}),
        ...(municipioId ? { municipioId } : {}),
      },
      orderBy: { codigo: 'asc' },
      take: 50,
    });
  }

  findColonias(codigoPostalId?: string, search?: string) {
    return this.prisma.satColonia.findMany({
      where: {
        ...(codigoPostalId ? { codigoPostalId } : {}),
        ...(search
          ? { nombre: { contains: search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  findProductosServicios(search?: string) {
    return this.prisma.satProductoServicio.findMany({
      where: search
        ? {
            OR: [
              { codigo: { contains: search, mode: 'insensitive' } },
              { descripcion: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { codigo: 'asc' },
      take: 100,
    });
  }

  findUnidadesMedida(search?: string) {
    return this.prisma.satUnidadMedida.findMany({
      where: search
        ? {
            OR: [
              { codigo: { contains: search, mode: 'insensitive' } },
              { nombre: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  findRegimenesFiscales(search?: string) {
    return this.prisma.satRegimenFiscal.findMany({
      where: search
        ? {
            OR: [
              { codigo: { contains: search, mode: 'insensitive' } },
              { nombre: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { codigo: 'asc' },
    });
  }

  findUsosCfdi(search?: string) {
    return this.prisma.satUsoCfdi.findMany({
      where: search
        ? {
            OR: [
              { codigo: { contains: search, mode: 'insensitive' } },
              { nombre: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { codigo: 'asc' },
    });
  }
}
