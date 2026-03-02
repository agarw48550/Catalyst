import { NextRequest, NextResponse } from 'next/server'
import { checkApiHealth } from '@/lib/ai/gemini'
import { config } from '@/config'

export const dynamic = 'force-dynamic'

function getEmailProviderStatus() {
  const providers: Record<string, any> = {}

  if (config.email.resend.apiKey) {
    providers.resend = {
      configured: true,
      fromEmail: config.email.resend.fromEmail,
      isDefaultFrom: config.email.resend.fromEmail === 'onboarding@resend.dev',
      warning: config.email.resend.fromEmail === 'onboarding@resend.dev'
        ? 'Using default FROM address — can only send to your own verified email'
        : null,
    }
  } else {
    providers.resend = { configured: false }
  }

  if (config.email.mailgun.apiKey) {
    providers.mailgun = {
      configured: true,
      domain: config.email.mailgun.domain || 'NOT SET',
      fromEmail: config.email.mailgun.fromEmail,
      isDefaultFrom: config.email.mailgun.fromEmail === 'noreply@catalyst.app',
    }
  } else {
    providers.mailgun = { configured: false }
  }

  return providers
}

export async function GET(request: NextRequest) {
  try {
    // Check if debug dashboard is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD !== 'true') {
      return NextResponse.json(
        { error: 'Debug dashboard is not enabled' },
        { status: 403 }
      )
    }

    const health = await checkApiHealth()
    const emailProviders = getEmailProviderStatus()

    return NextResponse.json({
      gemini: health,
      email: emailProviders,
      supabase: {
        urlConfigured: !!config.supabase.url,
        anonKeyConfigured: !!config.supabase.anonKey,
        serviceRoleKeyConfigured: !!config.supabase.serviceRoleKey,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Failed to check API health:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check health' },
      { status: 500 }
    )
  }
}
