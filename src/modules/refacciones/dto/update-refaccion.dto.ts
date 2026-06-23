import { PartialType } from '@nestjs/swagger';
import { CreateRefaccionDto } from './create-refaccion.dto';

export class UpdateRefaccionDto extends PartialType(CreateRefaccionDto) {}
