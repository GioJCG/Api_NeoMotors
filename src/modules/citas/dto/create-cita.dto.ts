import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCitaDto {
  @ApiPropertyOptional({ example: 'uuid-sucursal' })
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiProperty({ example: 'uuid-cliente' })
  @IsString()
  clienteId!: string;

  @ApiProperty({ example: 'uuid-vehiculo' })
  @IsString()
  vehiculoId!: string;

  @ApiProperty({ example: '2026-06-25T15:00:00.000Z' })
  @IsDateString()
  fecha!: string;

  @ApiProperty({ example: '15:00' })
  @IsString()
  hora!: string;

  @ApiPropertyOptional({ example: 'Cliente solicitó revisión de frenos' })
  @IsOptional()
  @IsString()
  notas?: string;
}
