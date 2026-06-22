import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetCompanyContextDto {
  @ApiProperty({ example: 'uuid-empresa' })
  @IsString()
  @IsNotEmpty()
  empresaId: string;
}

export class SetBranchContextDto {
  @ApiProperty({ example: 'uuid-sucursal' })
  @IsString()
  @IsNotEmpty()
  sucursalId: string;
}

export class GetBranchesQueryDto {
  @ApiProperty({ example: 'uuid-empresa' })
  @IsString()
  @IsNotEmpty()
  empresaId: string;
}
