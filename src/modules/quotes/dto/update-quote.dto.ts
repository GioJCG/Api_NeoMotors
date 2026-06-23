import { PartialType } from '@nestjs/swagger';
import { CreateQuoteDto } from './create-quote.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {
  @ApiPropertyOptional({ example: 'APROBADA' })
  @IsOptional()
  @IsString()
  @IsIn(['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA'])
  estado?: string;
}
