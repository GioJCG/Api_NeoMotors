import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyDto {
  @ApiProperty({ example: 'uuid-token', description: 'Token único de verificación enviado por email' })
  @IsString()
  @IsUUID()
  token: string;
}
