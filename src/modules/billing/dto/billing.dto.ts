import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FacturaDetalleDto {
  @ApiProperty() @IsNumber() @Min(0.000001) cantidad: number;
  @ApiPropertyOptional() @IsOptional() @IsString() claveProdServ?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() claveUnidad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() noIdentificacion?: string;
  @ApiProperty() @IsString() descripcion: string;
  @ApiProperty() @IsNumber() @Min(0) precioUnitario: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) descuento?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() objetoImp?: string;
}

export class EmitirFacturaDto {
  @ApiProperty() @IsString() ordenTrabajoId: string;

  @ApiPropertyOptional() @IsOptional() @IsString() sucursalId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() serie?: string;

  @ApiPropertyOptional({ default: 'I' })
  @IsOptional() @IsString() @IsIn(['I', 'E', 'T', 'P', 'N'])
  tipoComprobante?: string;

  @ApiPropertyOptional({ default: '01' })
  @IsOptional() @IsString() @IsIn(['01', '02', '03'])
  exportacion?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() usoCfdi?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() formaPago?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @IsIn(['PUE', 'PPD'])
  metodoPago?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() relacionTipo?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() relacionUuid?: string;

  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FacturaDetalleDto)
  detalles?: FacturaDetalleDto[];
}
