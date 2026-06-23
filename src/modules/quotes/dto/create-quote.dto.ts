import { IsString, IsOptional, IsArray, IsNumber, Min, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDetalleDto {
  @ApiProperty({ example: 'SERVICIO' })
  @IsString()
  @IsIn(['SERVICIO', 'MANO_OBRA', 'REFACCION'])
  tipo!: string;

  @ApiProperty({ example: 'Cambio de pastillas de freno' })
  @IsString()
  descripcion!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  cantidad!: number;

  @ApiProperty({ example: 850.00 })
  @IsNumber()
  @Min(0)
  precioUnitario!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;
}

export class CreateQuoteDto {
  @ApiProperty({ example: 'uuid-orden' })
  @IsString()
  ordenTrabajoId!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;

  @ApiPropertyOptional({ example: 'Presupuesto válido por 15 días' })
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiProperty({ type: [CreateDetalleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleDto)
  detalles!: CreateDetalleDto[];
}
