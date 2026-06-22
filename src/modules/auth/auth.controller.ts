import { Controller, Post, Body, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Registro de usuario local' })
  @ApiResponse({ status: 201, description: 'Usuario registrado.' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verificación de cuenta' })
  @ApiResponse({ status: 201, description: 'Cuenta verificada.' })
  async verify(@Body() dto: VerifyDto) {
    return this.authService.verify(dto);
  }

  @Post('login')
  @UseGuards(IpThrottlerGuard)
  @ApiOperation({ summary: 'Inicio de sesión' })
  @ApiResponse({ status: 201, description: 'Login exitoso.' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @UseGuards(IpThrottlerGuard)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 201, description: 'Token generado.' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña' })
  @ApiResponse({ status: 201, description: 'Contraseña restablecida.' })
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
      return res.redirect(`${this.getFrontendUrl()}/auth/login?error=oauth_failed`);
    }

    try {
      const result = await this.authService.loginWithOAuth(user);
      return res.redirect(
        `${this.getFrontendUrl()}/auth/login?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
      );
    } catch {
      return res.redirect(`${this.getFrontendUrl()}/auth/login?error=oauth_error`);
    }
  }

  private getFrontendUrl(): string {
    return this.authService['configService'].get<string>('FRONTEND_URL') || 'http://localhost:4200';
  }
}
