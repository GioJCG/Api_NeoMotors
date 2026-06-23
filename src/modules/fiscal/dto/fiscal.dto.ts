import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadCsdDto {
  @ApiProperty({ description: 'Archivo .cer en base64' })
  @IsString() @IsNotEmpty()
  certificadoCer: string;

  @ApiProperty({ description: 'Archivo .key en base64' })
  @IsString() @IsNotEmpty()
  llaveKey: string;

  @ApiProperty({ description: 'Contraseña del certificado' })
  @IsString() @IsNotEmpty()
  password: string;
}
