export function buildPasswordResetEmailHtml(
  resetLink: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
    </head>
    <body style="font-family: Arial, sans-serif; padding: 32px;">
      <h2>Recuperaci&oacute;n de contrase&ntilde;a NeoMotors</h2>
      <p>Recibimos una solicitud para restablecer tu contrase&ntilde;a.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contrase&ntilde;a:</p>
      <p>
        <a href="${resetLink}"
           style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; text-decoration: none; border-radius: 4px;">
          Restablecer contrase&ntilde;a
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">
        Este enlace expirar&aacute; en 1 hora.
      </p>
      <p style="color: #999; font-size: 11px;">
        Si no solicitaste este cambio, ignora este correo.
      </p>
    </body>
    </html>
  `;
}
