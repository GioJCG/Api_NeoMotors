import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'operador@taller.com' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no debe exceder 128 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Operador', enum: ['SupervisorSucursal', 'Operador', 'Consulta'] })
  @IsString()
  @IsIn(['SupervisorSucursal', 'Operador', 'Consulta'], {
    message: 'El rol debe ser SupervisorSucursal, Operador o Consulta',
  })
  rol: string;

  @ApiProperty({ example: 'uuid-de-sucursal' })
  @IsUUID()
  @IsNotEmpty()
  sucursalId: string;
}
