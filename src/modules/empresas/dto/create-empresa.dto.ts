import { IsString, IsNotEmpty, IsOptional, IsIn, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmpresaDto {
  @ApiProperty({ example: 'Taller El Chapulín S.A. de C.V.' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'CHP120101ABC' })
  @IsString()
  @IsNotEmpty()
  @Length(12, 13)
  rfc: string;

  @ApiProperty({ example: 'Taller El Chapulín S.A. de C.V.' })
  @IsString()
  @IsNotEmpty()
  razonSocial: string;

  @ApiProperty({ example: '45019' })
  @IsString()
  @IsNotEmpty()
  codigoPostalFiscal: string;

  @ApiProperty({ example: '601' })
  @IsString()
  @IsNotEmpty()
  regimenFiscal: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  colorPrimario?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  colorSecundario?: string;

  @ApiProperty({ required: false, enum: ['light', 'dark'] })
  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark'])
  tema?: string;
}
