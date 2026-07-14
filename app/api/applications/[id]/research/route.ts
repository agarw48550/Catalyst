import { NextResponse } from 'next/server'
import { createSupabaseServerClient, requireClerkUserId } from '@/lib/supabase-clerk'
import { researchCompany } from '@/lib/research/company-research'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    await requireClerkUserId()
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const { data: app, error: fetchError } = await supabase
      .from('job_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    await supabase
      .from('job_applications')
      .update({ research_status: 'processing' })
      .eq('id', id)

    try {
      const research = await researchCompany(app.company, app.job_title, app.job_description)
      const { data, error } = await supabase
        .from('job_applications')
        .update({
          company_research: research,
          research_status: 'complete',
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ application: data })
    } catch (researchError) {
      await supabase
        .from('job_applications')
        .update({ research_status: 'failed' })
        .eq('id', id)

      throw researchError
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Research failed'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
