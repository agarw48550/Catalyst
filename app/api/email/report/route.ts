import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/mailers'

export async function POST(request: Request) {
  try {
    const { to, reportType, data } = await request.json()

    if (!to || !reportType || !data) {
      return NextResponse.json({ error: 'to, reportType, and data are required' }, { status: 400 })
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #4F46E5; color: white; padding: 20px; }
    .content { padding: 20px; }
    .section { margin: 16px 0; }
    .footer { background: #f5f5f5; padding: 16px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header"><h1>Catalyst - ${reportType} Report</h1></div>
  <div class="content">
    <div class="section">
      <pre style="white-space: pre-wrap; font-family: inherit">${JSON.stringify(data, null, 2)}</pre>
    </div>
  </div>
  <div class="footer"><p>© 2024 Catalyst (RozgarSathi) - AI-Powered Career Platform</p></div>
</body>
</html>`

    await sendEmail({
      to,
      subject: `Catalyst - Your ${reportType} Report`,
      html,
      text: `Catalyst ${reportType} Report\n\n${JSON.stringify(data, null, 2)}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Email report error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
  }
}
