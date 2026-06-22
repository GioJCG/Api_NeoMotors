import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSucursalDto {
  @ApiProperty({ example: 'Sucursal Centro' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ required: false, example: 'Av. Principal #123, Col. Centro' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({ required: false, example: '3312345678' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  esMatriz?: boolean;

  @ApiProperty({ required: false, example: 20.6597 })
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiProperty({ required: false, example: -103.3496 })
  @IsNumber()
  @IsOptional()
  longitud?: number;
}
