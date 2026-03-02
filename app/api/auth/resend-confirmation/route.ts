import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resendConfirmationSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter: max 3 resends per email per hour
const resendCounts = new Map<string, { count: number; resetAt: number }>()
const MAX_RESENDS_PER_HOUR = 3

function isRateLimited(email: string): boolean {
    const now = Date.now()
    const entry = resendCounts.get(email)

    if (!entry || now > entry.resetAt) {
        resendCounts.set(email, { count: 1, resetAt: now + 3600_000 })
        return false
    }

    if (entry.count >= MAX_RESENDS_PER_HOUR) {
        return true
    }

    entry.count++
    return false
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const parsed = resendConfirmationSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid email' },
                { status: 400 }
            )
        }
        const { email } = parsed.data

        // Rate limit check
        if (isRateLimited(email)) {
            return NextResponse.json(
                { error: 'Too many resend attempts. Please try again later.' },
                { status: 429 }
            )
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        })

        if (error) {
            console.error('[resend-confirmation] Supabase error:', error.message)
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        console.info('[resend-confirmation] Resent confirmation to:', email)
        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[resend-confirmation] Unexpected error:', err)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
