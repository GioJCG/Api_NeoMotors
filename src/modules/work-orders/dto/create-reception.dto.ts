import { IsString, IsInt, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReceptionDto {
  @ApiPropertyOptional({ example: 'uuid-sucursal' })
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiPropertyOptional({ example: 'uuid-cita' })
  @IsOptional()
  @IsString()
  citaId?: string;

  @ApiProperty({ example: 'uuid-cliente' })
  @IsString()
  clienteId!: string;

  @ApiProperty({ example: 'uuid-vehiculo' })
  @IsString()
  vehiculoId!: string;

  @ApiProperty({ example: 45000 })
  @IsInt()
  @Min(0)
  kilometraje!: number;

  @ApiProperty({ example: '1/2' })
  @IsString()
  nivelCombustible!: string;

  @ApiPropertyOptional({ example: ['Espejo retrovisor izquierdo', 'Tapa de gasolina'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  componentesFaltantes?: string[];

  @ApiPropertyOptional({ example: 'Rayón en puerta del conductor, abolladura en defensa trasera' })
  @IsOptional()
  @IsString()
  daniosCarroceria?: string;

  @ApiPropertyOptional({ example: ['data:image/png;base64,...', 'data:image/jpeg;base64,...'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotos?: string[];
}
