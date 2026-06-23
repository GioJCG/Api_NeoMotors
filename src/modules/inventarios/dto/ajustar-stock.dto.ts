import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AjustarStockDto {
  @ApiProperty()
  @IsString()
  refaccionId: string;

  @ApiProperty()
  @IsNumber()
  cantidad: number;

  @ApiProperty({ enum: ['ENTRADA_POR_COMPRA', 'SALIDA_POR_ORDEN', 'AJUSTE_INVENTARIO', 'TRANSFERENCIA'] })
  @IsString()
  tipo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimo?: number;
}

export class TransferirStockDto {
  @ApiProperty()
  @IsString()
  refaccionId: string;

  @ApiProperty()
  @IsString()
  sucursalOrigenId: string;

  @ApiProperty()
  @IsString()
  sucursalDestinoId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}
