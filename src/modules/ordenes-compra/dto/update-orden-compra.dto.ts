import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateOrdenCompraDto } from './create-orden-compra.dto';

export class UpdateOrdenCompraDto extends PartialType(
  OmitType(CreateOrdenCompraDto, ['proveedorId'] as const),
) {
  estado?: string;
}
