import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackTimeDto {
  @ApiProperty({ example: 'start' })
  @IsString()
  action!: 'start' | 'pause' | 'resume' | 'stop';
}
