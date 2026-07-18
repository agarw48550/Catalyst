import { NextResponse } from 'next/server'
import { createSupabaseServerClient, requireClerkUserId } from '@/lib/supabase-clerk'
import { jobApplicationUpdateSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireClerkUserId()
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ application: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch application'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireClerkUserId()
    const { id } = await params
    const body = await request.json()
    const parsed = jobApplicationUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 },
      )
    }

    const supabase = await createSupabaseServerClient()
    const updates: Record<string, unknown> = {}
    if (parsed.data.resumeText !== undefined) updates.resume_text = parsed.data.resumeText
    if (parsed.data.language !== undefined) updates.language = parsed.data.language

    const { data, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ application: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update application'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireClerkUserId()
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.from('job_applications').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete application'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
