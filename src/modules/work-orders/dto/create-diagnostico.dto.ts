import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiagnosticoDto {
  @ApiPropertyOptional({ example: 'Ruido al frenar, vibración en volante' })
  @IsOptional()
  @IsString()
  sintomas?: string;

  @ApiPropertyOptional({ example: 'Pastillas de freno desgastadas, rotula derecha con juego' })
  @IsOptional()
  @IsString()
  fallasEncontradas?: string;

  @ApiPropertyOptional({ example: 'Pastillas de freno al 10%, neumáticos delanteros lisos' })
  @IsOptional()
  @IsString()
  desgastesPiezas?: string;

  @ApiPropertyOptional({ example: 'Se requiere reemplazo de pastillas de freno y rotula derecha' })
  @IsOptional()
  @IsString()
  conclusion?: string;
}
