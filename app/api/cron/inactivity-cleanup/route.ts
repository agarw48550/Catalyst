import { NextResponse } from 'next/server'
import { assertCronAuthorized, runInactivityCleanup } from '@/lib/user-activity'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request)
    const result = await runInactivityCleanup()

    return NextResponse.json({
      ok: true,
      warningsSent: result.warningsSent,
      deleted: result.deleted,
      errors: result.errors,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Inactivity cleanup failed'
    const status = message === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
