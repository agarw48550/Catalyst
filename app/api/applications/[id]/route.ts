import { NextResponse } from 'next/server'
import { createSupabaseServerClient, requireClerkUserId } from '@/lib/supabase-clerk'
import { researchCompany } from '@/lib/research/company-research'

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
    const supabase = await createSupabaseServerClient()

    const updates: Record<string, unknown> = {}
    if (body.resumeText) updates.resume_text = body.resumeText

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
