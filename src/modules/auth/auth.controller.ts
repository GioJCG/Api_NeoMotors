import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IpThrottlerGuard } from '../../common/guards/throttler.guard';
import type { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registro de usuario local',
    description:
      'Crea una cuenta de usuario en estado PENDIENTE y envía un token de verificación.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verificación de cuenta',
    description:
      'Valida el token de verificación y cambia el estado del usuario a ACTIVO.',
  })
  @ApiBody({ type: VerifyDto })
  @ApiResponse({ status: 201, description: 'Cuenta verificada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Token no encontrado.' })
  @ApiResponse({ status: 400, description: 'Token expirado o ya utilizado.' })
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verify(dto);
  }

  @Post('login')
  @UseGuards(IpThrottlerGuard)
  @ApiOperation({
    summary: 'Inicio de sesión',
    description: 'Autentica al usuario y retorna JWT + Refresh Token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login exitoso. Retorna accessToken y refreshToken.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta bloqueada.',
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Post('forgot-password')
  @UseGuards(IpThrottlerGuard)
  @ApiOperation({
    summary: 'Solicitar recuperación de contraseña',
    description: 'Envía un token de recuperación al correo del usuario.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 201, description: 'Token de recuperación generado.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Restablecer contraseña',
    description:
      'Cambia la contraseña usando un token de recuperación válido. El token se invalida tras su uso.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Contraseña restablecida exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Token no encontrado.' })
  @ApiResponse({ status: 400, description: 'Token expirado o ya utilizado.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar autenticación con Google' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Callback de Google OAuth' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Iniciar autenticación con GitHub' })
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Callback de GitHub OAuth' })
  async githubAuthCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Iniciar autenticación con Microsoft' })
  async microsoftAuth() {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  @ApiOperation({ summary: 'Callback de Microsoft OAuth' })
  async microsoftAuthCallback(@Req() req: Request, @Res() res: Response) {
    return this.handleOAuthCallback(req, res);
  }

  private async handleOAuthCallback(req: Request, res: Response) {
    const user = (req as any).user;
    if (!user) {
      return res.redirect(
        `${this.getFrontendUrl()}/auth/login?error=oauth_failed`,
      );
    }

    try {
      const result = await this.authService.loginWithOAuth(user);
      return res.redirect(
        `${this.getFrontendUrl()}/auth/login?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch {
      return res.redirect(
        `${this.getFrontendUrl()}/auth/login?error=oauth_error`,
      );
    }
  }

  private getFrontendUrl(): string {
    return (
      this.authService['configService'].get<string>('FRONTEND_URL') ||
      'http://localhost:4200'
    );
  }
}
