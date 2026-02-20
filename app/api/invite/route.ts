import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/config/supabase'
import { config } from '@/config'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error: admin client not available' },
        { status: 500 }
      )
    }

    // Use Supabase admin API to send the built-in invite email
    // This uses the "Invite User" email template configured in Supabase Dashboard
    // (auth.email.template.invite — default subject: "You have been invited")
    const redirectTo = config.app?.url
      ? `${config.app.url}/auth/callback`
      : undefined

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    })

    if (error) {
      // Handle common errors with friendly messages
      if (error.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'This user already has an account on Project Catalyst.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      userId: data?.user?.id,
    })
  } catch (err: any) {
    console.error('Invite error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
