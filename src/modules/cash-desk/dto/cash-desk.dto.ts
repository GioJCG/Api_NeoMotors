import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenCashDeskDto {
  @ApiProperty({ default: 0 })
  @IsNumber()
  @IsPositive()
  saldoInicial: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CloseCashDeskDto {
  @ApiProperty()
  @IsNumber()
  conteoFisico: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class RegisterPaymentDto {
  @ApiProperty()
  @IsString()
  ordenTrabajoId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  monto: number;

  @ApiProperty({ enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'], default: 'EFECTIVO' })
  @IsString()
  metodoPago?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referencia?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  esParcial?: boolean;
}

export class RegisterTransactionDto {
  @ApiProperty({ enum: ['RETIRO', 'INGRESO'] })
  @IsString()
  tipo: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  monto: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}
