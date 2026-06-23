import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehiculoDto {
  @ApiProperty({ example: 'uuid-cliente' })
  @IsString()
  clienteId!: string;

  @ApiProperty({ example: 'uuid-marca' })
  @IsString()
  marcaId!: string;

  @ApiProperty({ example: 'uuid-modelo' })
  @IsString()
  modeloId!: string;

  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  placa!: string;

  @ApiPropertyOptional({ example: '3HGCM82633A123456' })
  @IsOptional()
  @IsString()
  numeroSerie?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;

  @ApiPropertyOptional({ example: 'Rojo' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'ACTIVO', default: 'ACTIVO' })
  @IsOptional()
  @IsString()
  estado?: string;
}
