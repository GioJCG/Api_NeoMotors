import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@ejemplo.com', description: 'Correo electrónico registrado' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;
}
