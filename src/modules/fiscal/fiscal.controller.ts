import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FiscalService } from './fiscal.service';
import { UploadCsdDto } from './dto/fiscal.dto';

@Controller('fiscal')
@UseGuards(AuthGuard('jwt'))
export class FiscalController {
  constructor(private readonly service: FiscalService) {}

  @Post('upload-csd')
  uploadCsd(@Req() req: any, @Body() dto: UploadCsdDto) {
    return this.service.uploadCsd(dto, req.user, req.ip);
  }

  @Get('csd-status')
  getStatus(@Req() req: any) {
    return this.service.getStatus(req.user);
  }
}
