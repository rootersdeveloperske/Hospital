import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com'

let transporter: nodemailer.Transporter | null = null

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  })
} else {
  console.warn('SMTP not configured. Email notifications will be disabled.')
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  if (!transporter) {
    console.warn('sendEmail called but transporter not configured')
    return
  }

  try {
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, text, html })
  } catch (err) {
    console.error('Error sending email', err)
  }
}
