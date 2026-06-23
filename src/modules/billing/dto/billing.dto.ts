import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FacturaDetalleDto {
  @ApiProperty() @IsNumber() cantidad: number;
  @ApiPropertyOptional() @IsOptional() @IsString() claveProdServ?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() claveUnidad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidad?: string;
  @ApiProperty() @IsString() descripcion: string;
  @ApiProperty() @IsNumber() precioUnitario: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() descuento?: number;
}

export class EmitirFacturaDto {
  @ApiProperty() @IsString() ordenTrabajoId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() usoCfdi?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() formaPago?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metodoPago?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FacturaDetalleDto)
  detalles?: FacturaDetalleDto[];
}
