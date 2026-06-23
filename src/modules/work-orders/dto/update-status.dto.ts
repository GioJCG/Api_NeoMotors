import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkOrderStatusDto {
  @ApiProperty({ description: 'Nuevo estado de la orden' })
  @IsString()
  estado: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;
}
