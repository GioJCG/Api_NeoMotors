import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: false,
        auth: { user, pass },
      });
      this.logger.log(`Mail transporter initialized: ${host}:${port}`);
    } else {
      this.logger.warn('Mail not configured — emails will not be sent');
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `[MOCK] Verification email to ${to}: token=${token}`,
      );
      return;
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const verifyLink = `${frontendUrl}/auth/verify?token=${token}`;
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      'NeoMotors <no-reply@neomotors.local>';

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Verifica tu cuenta en NeoMotors',
      html: `
        <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="color:#201F1E;font-size:24px;margin:0">NeoMotors</h1>
            <p style="color:#605E5C;font-size:14px">Sistema de Gestión de Taller</p>
          </div>
          <hr style="border:none;border-top:1px solid #EDEBE9" />
          <p style="font-size:15px;color:#201F1E">Hola <strong>${name || 'Usuario'}</strong>,</p>
          <p style="font-size:14px;color#605E5C;line-height:1.5">
            Gracias por registrarte en NeoMotors. Para activar tu cuenta, haz clic en el siguiente botón:
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${verifyLink}"
               style="display:inline-block;background:#0078D4;color:#fff;text-decoration:none;
                      padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600">
              Verificar cuenta
            </a>
          </div>
          <p style="font-size:13px;color:#605E5C">
            O copia y pega este token en la página de verificación:
          </p>
          <code style="display:block;background:#F3F2F1;padding:12px;border-radius:6px;font-size:12px;word-break:break-all">
            ${token}
          </code>
          <p style="font-size:12px;color:#A19F9D;margin-top:16px">
            Este token expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.
          </p>
        </div>
      `,
    });

    this.logger.log(`Verification email sent to ${to}`);
  }
}
