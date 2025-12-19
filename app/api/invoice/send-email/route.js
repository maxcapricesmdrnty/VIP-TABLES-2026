import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Create SMTP transporter for Infomaniak
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.infomaniak.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function POST(request) {
  try {
    const { to, subject, html, pdfBase64, fileName } = await request.json()

    if (!to || !subject) {
      return NextResponse.json({ error: 'Email et sujet requis' }, { status: 400 })
    }

    // Prepare email options
    const mailOptions = {
      from: `"Caprices VIP" <${process.env.SMTP_FROM || 'vip@caprices.ch'}>`,
      to: to,
      subject: subject,
      html: html || '<p>Veuillez trouver votre facture en pièce jointe.</p>',
      attachments: []
    }

    // Add PDF attachment if provided
    if (pdfBase64 && fileName) {
      mailOptions.attachments.push({
        filename: fileName,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      })
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log('Email sent:', info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: `Email envoyé à ${to}`
    })

  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ 
      error: `Erreur d'envoi: ${error.message}` 
    }, { status: 500 })
  }
}
