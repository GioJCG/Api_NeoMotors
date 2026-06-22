import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro de usuario local', description: 'Crea una cuenta de usuario en estado PENDIENTE y envía un token de verificación.' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente. Token de verificación generado.' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verificación de cuenta', description: 'Valida el token de verificación y cambia el estado del usuario a ACTIVO.' })
  @ApiBody({ type: VerifyDto })
  @ApiResponse({ status: 201, description: 'Cuenta verificada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Token de verificación no encontrado.' })
  @ApiResponse({ status: 400, description: 'Token expirado o ya utilizado.' })
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verify(dto);
  }
}
