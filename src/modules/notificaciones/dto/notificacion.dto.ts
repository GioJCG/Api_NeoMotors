import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificacionDto {
  @ApiProperty() @IsString() empresaId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sucursalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() usuarioId?: string;
  @ApiProperty() @IsString() tipo: string;
  @ApiProperty() @IsString() titulo: string;
  @ApiProperty() @IsString() mensaje: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referencia?: string;
}

export class MarkReadDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() leida?: boolean;
}

export class NotificacionFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() sucursalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() leida?: string;
}
