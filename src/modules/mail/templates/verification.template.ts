export function buildVerificationEmailHtml(
  verificationLink: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
    </head>
    <body style="font-family: Arial, sans-serif; padding: 32px;">
      <h2>Verifica tu cuenta NeoMotors</h2>
      <p>Gracias por registrarte en NeoMotors.</p>
      <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
      <p>
        <a href="${verificationLink}"
           style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; text-decoration: none; border-radius: 4px;">
          Verificar cuenta
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">
        Este enlace expirar&aacute; en 24 horas.
      </p>
    </body>
    </html>
  `;
}
