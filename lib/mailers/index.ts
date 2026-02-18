/**
 * Email service with Mailgun/Resend fallback
 */

import { config } from '@/config'
import { logApiCall } from '@/lib/logger'

export interface EmailParams {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  attachments?: {
    filename: string
    content: Buffer | string
    contentType?: string
  }[]
}

/**
 * Send email via Mailgun
 */
async function sendViaMailgun(params: EmailParams): Promise<void> {
  if (!config.email.mailgun.apiKey || !config.email.mailgun.domain) {
    throw new Error('Mailgun not configured')
  }

  const startTime = Date.now()

  try {
    const formData = new FormData()
    
    // Add recipients
    const recipients = Array.isArray(params.to) ? params.to : [params.to]
    recipients.forEach((email) => formData.append('to', email))
    
    formData.append('from', config.email.mailgun.fromEmail)
    formData.append('subject', params.subject)
    
    if (params.html) {
      formData.append('html', params.html)
    }
    if (params.text) {
      formData.append('text', params.text)
    }

    // Add attachments if any
    if (params.attachments) {
      params.attachments.forEach((attachment) => {
        const content = typeof attachment.content === 'string' 
          ? attachment.content 
          : Buffer.from(attachment.content)
        const blob = new Blob([content], { 
          type: attachment.contentType || 'application/octet-stream' 
        })
        formData.append('attachment', blob, attachment.filename)
      })
    }

    const response = await fetch(
      `https://api.mailgun.net/v3/${config.email.mailgun.domain}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${config.email.mailgun.apiKey}`).toString('base64')}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Mailgun error: ${error}`)
    }

    await logApiCall({
      service: 'mailgun',
      endpoint: '/messages',
      method: 'POST',
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      fallbackUsed: false,
    })

    console.log('✓ Email sent via Mailgun')
  } catch (error: any) {
    await logApiCall({
      service: 'mailgun',
      endpoint: '/messages',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message,
      fallbackUsed: false,
    })
    throw error
  }
}

/**
 * Send email via Resend
 */
async function sendViaResend(params: EmailParams): Promise<void> {
  if (!config.email.resend.apiKey) {
    throw new Error('Resend not configured')
  }

  const startTime = Date.now()

  try {
    const payload: any = {
      from: config.email.resend.fromEmail,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
    }

    if (params.html) {
      payload.html = params.html
    }
    if (params.text) {
      payload.text = params.text
    }

    // Resend attachments format
    if (params.attachments) {
      payload.attachments = params.attachments.map((att) => ({
        filename: att.filename,
        content: Buffer.from(att.content).toString('base64'),
      }))
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.email.resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Resend error: ${JSON.stringify(error)}`)
    }

    await logApiCall({
      service: 'resend',
      endpoint: '/emails',
      method: 'POST',
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      fallbackUsed: false,
    })

    console.log('✓ Email sent via Resend')
  } catch (error: any) {
    await logApiCall({
      service: 'resend',
      endpoint: '/emails',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message,
      fallbackUsed: false,
    })
    throw error
  }
}

/**
 * Send email with automatic fallback
 */
export async function sendEmail(params: EmailParams): Promise<void> {
  const errors: { service: string; error: string }[] = []

  // Try each email service in fallback order
  for (const service of config.email.fallbackOrder) {
    try {
      if (service === 'mailgun') {
        await sendViaMailgun(params)
      } else if (service === 'resend') {
        await sendViaResend(params)
      }

      console.log(`✓ Email sent successfully via ${service}`)
      return
    } catch (error: any) {
      console.error(`✗ ${service} failed:`, error.message)
      errors.push({ service, error: error.message })
      // Continue to next provider
    }
  }

  // All providers failed
  throw new Error(
    `All email services failed:\n${errors.map((e) => `${e.service}: ${e.error}`).join('\n')}`
  )
}

/**
 * Send interview report email
 */
export async function sendInterviewReport(
  to: string,
  interviewData: {
    candidateName: string
    date: string
    transcript: string
    feedback: string
  }
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { background: #4F46E5; color: white; padding: 20px; }
        .content { padding: 20px; }
        .section { margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Interview Report - ${interviewData.candidateName}</h1>
      </div>
      <div class="content">
        <div class="section">
          <h2>Interview Date</h2>
          <p>${interviewData.date}</p>
        </div>
        <div class="section">
          <h2>Transcript</h2>
          <pre>${interviewData.transcript}</pre>
        </div>
        <div class="section">
          <h2>AI Feedback</h2>
          <p>${interviewData.feedback}</p>
        </div>
      </div>
      <div class="footer">
        <p>© 2024 Catalyst (RozgarSathi) - AI-Powered Career Platform</p>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to,
    subject: `Interview Report - ${interviewData.candidateName}`,
    html,
    text: `Interview Report\n\nCandidate: ${interviewData.candidateName}\nDate: ${interviewData.date}\n\nTranscript:\n${interviewData.transcript}\n\nFeedback:\n${interviewData.feedback}`,
  })
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .cta { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Catalyst!</h1>
      </div>
      <div class="content">
        <h2>Hi ${name},</h2>
        <p>Welcome to Catalyst (RozgarSathi) - your AI-powered career companion!</p>
        <p>We're excited to help you accelerate your career journey with:</p>
        <ul>
          <li>AI-powered resume building and optimization</li>
          <li>Interactive interview practice with real-time feedback</li>
          <li>Personalized job recommendations from top Indian job boards</li>
          <li>Career research and guidance</li>
        </ul>
        <a href="${config.app.url}/dashboard" class="cta">Get Started</a>
      </div>
      <div class="footer">
        <p>© 2024 Catalyst (RozgarSathi) - AI-Powered Career Platform</p>
      </div>
    </body>
    </html>
  `

  await sendEmail({
    to,
    subject: 'Welcome to Catalyst!',
    html,
    text: `Hi ${name},\n\nWelcome to Catalyst (RozgarSathi) - your AI-powered career companion!\n\nGet started at: ${config.app.url}/dashboard`,
  })
}
