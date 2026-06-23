import { IsString, IsOptional, IsArray, IsNumber, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrdenCompraDetalleDto {
  @ApiProperty()
  @IsString()
  descripcion: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento?: number;
}

export class CreateOrdenCompraDto {
  @ApiProperty()
  @IsString()
  proveedorId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaPedido?: string;

  @ApiProperty({ type: [CreateOrdenCompraDetalleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrdenCompraDetalleDto)
  detalles: CreateOrdenCompraDetalleDto[];
}
