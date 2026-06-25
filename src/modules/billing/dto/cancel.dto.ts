import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CancelarFacturaDto {
  @ApiProperty({ description: 'Motivo de cancelación: 01=Comprobante emitido con errores con relación, 02=Comprobante emitido con errores sin relación, 03=No se llevó a cabo la operación, 04=Operación nominativa con RFC genérico' })
  @IsString()
  @IsIn(['01', '02', '03', '04'])
  motivo: string;

  @ApiPropertyOptional({ description: 'UUID del CFDI que sustituye (obligatorio si motivo=01)' })
  @IsOptional()
  @IsString()
  uuidSustituto?: string;
}
