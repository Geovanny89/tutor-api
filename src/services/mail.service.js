'use strict';

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  // nodemailer no instalado todavía, usará modo consola
}

/**
 * Mail Service
 * Envía correos transaccionales (recuperación de contraseña, invitaciones).
 * Si no hay SMTP configurado, cae en modo consola para no romper el flujo
 * en desarrollo (el enlace queda visible en los logs del servidor).
 */

let transporter = null;
const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && nodemailer);

if (hasSmtp) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const MAIL_FROM = process.env.MAIL_FROM || 'KDice English <no-reply@kdice.com>';

/**
 * Envía un correo. Si no hay SMTP, imprime el contenido en consola.
 * @param {{to:string, subject:string, html:string, text?:string}} options
 */
const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log('\n📧 [MailService] SMTP no configurado. Correo simulado:');
    console.log(`   Para: ${to}`);
    console.log(`   Asunto: ${subject}`);
    if (text) console.log(`   ${text}`);
    return { simulated: true };
  }

  const info = await transporter.sendMail({ from: MAIL_FROM, to, subject, html, text });
  return info;
};

/**
 * Construye el HTML del correo de recuperación de contraseña.
 * @param {string} name
 * @param {string} resetUrl
 */
const passwordResetEmail = (name, resetUrl) => ({
  subject: 'Recupera tu contraseña - KDice English',
  text: `Hola ${name}, restablece tu contraseña aquí: ${resetUrl}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h2 style="color:#059669">Recuperación de contraseña</h2>
      <p>Hola <strong>${name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}" style="background:#059669;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">
          Restablecer contraseña
        </a>
      </p>
      <p style="color:#666;font-size:13px">El enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
    </div>`,
});

module.exports = { sendMail, passwordResetEmail };
