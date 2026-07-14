import { NextResponse } from 'next/server'
import { createSupabaseServerClient, requireClerkUserId } from '@/lib/supabase-clerk'
import { interviewSessionUpdateSchema } from '@/lib/validations'

export async function PATCH(request: Request) {
  try {
    await requireClerkUserId()
    const raw = await request.json()
    const parsed = interviewSessionUpdateSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { sessionId, transcript, status } = parsed.data
    const supabase = await createSupabaseServerClient()

    const updates: Record<string, unknown> = {}
    if (transcript) updates.transcript = transcript
    if (status) {
      updates.status = status
      if (status === 'completed') updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('interview_sessions')
      .update(updates)
      .eq('id', sessionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update session'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
