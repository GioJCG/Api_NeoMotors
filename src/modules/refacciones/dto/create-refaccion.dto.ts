import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRefaccionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  codigo: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precio?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @ApiPropertyOptional({ default: 'PIEZA' })
  @IsOptional()
  @IsString()
  unidad?: string;
}
