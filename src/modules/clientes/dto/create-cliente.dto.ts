import { IsString, IsOptional, IsEmail, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre!: string;

  @ApiPropertyOptional({ example: 'PEPJ800101ABC' })
  @IsOptional()
  @IsString()
  @Length(12, 13)
  rfc?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '3312345678' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Av. Principal #123, Col. Centro' })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional({ example: 'ACTIVO', default: 'ACTIVO' })
  @IsOptional()
  @IsString()
  estado?: string;
}
