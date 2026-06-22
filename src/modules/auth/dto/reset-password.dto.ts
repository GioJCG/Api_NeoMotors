import { IsString, MinLength, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'uuid-token', description: 'Token de recuperación' })
  @ApiProperty({ example: 'uuid-token', description: 'Token de recuperación de contraseña' })
  @IsString()
  @IsUUID()
  token: string;

  @ApiProperty({ example: 'NuevaPassword123!', description: 'Nueva contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no debe exceder 128 caracteres' })
  password: string;
}
