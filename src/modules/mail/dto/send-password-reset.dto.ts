import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPasswordResetEmailDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'uuid-token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
