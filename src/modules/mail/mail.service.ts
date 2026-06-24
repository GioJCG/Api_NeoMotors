import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SendVerificationEmailDto } from './dto/send-verification.dto';
import { SendPasswordResetEmailDto } from './dto/send-password-reset.dto';
import { buildVerificationEmailHtml } from './templates/verification.template';
import { buildPasswordResetEmailHtml } from './templates/password-reset.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
  }

  async sendVerificationEmail(dto: SendVerificationEmailDto): Promise<void> {
    const verificationLink = `${this.frontendUrl}/auth/verify?token=${dto.token}`;
    const html = buildVerificationEmailHtml(verificationLink);
    const from = this.getFromAddress();

    try {
      await this.resend.emails.send({
        from,
        to: dto.to,
        subject: 'Verifica tu cuenta NeoMotors',
        html,
      });
      this.logger.log(`Verification email sent to ${dto.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${dto.to}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  async sendPasswordResetEmail(dto: SendPasswordResetEmailDto): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${dto.token}`;
    const html = buildPasswordResetEmailHtml(resetLink);
    const from = this.getFromAddress();

    try {
      await this.resend.emails.send({
        from,
        to: dto.to,
        subject: 'Recuperación de contraseña NeoMotors',
        html,
      });
      this.logger.log(`Password reset email sent to ${dto.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${dto.to}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  private getFromAddress(): string {
    return (
      this.configService.get<string>('MAIL_FROM') ||
      'NeoMotors <no-reply@neomotors.com>'
    );
  }
}
