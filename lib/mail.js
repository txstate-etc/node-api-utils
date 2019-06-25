const nodemailer = require('nodemailer')

class Mailer {
  constructor () {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: process.env.SMTP_PORT || 25,
      secure: process.env.SMTP_SECURE || false,
      ...(process.env.SMTP_SECURE ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, requireTLS: true } : { ignoreTLS: true }),
      pool: true
    })
    this.templates = {}
  }

  async send ({ from, to, replyTo, subject, text, html }) {
    from = from || 'no-reply@txstate.edu'
    await this.transporter.sendMail({
      from: from,
      replyTo: replyTo || from,
      to: to,
      subject: subject.trim(),
      html: html || text.trim().replace(/\r?\n/g, '<br>').replace(/(<br>){3,}/ig, '<br><br>')
    })
  }
}

module.exports = new Mailer()
