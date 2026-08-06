/**
 * User activity tracking and inactive-data cleanup.
 * Activity is recorded for Clerk users; cron purges app data after inactivity.
 */

import { clerkClient } from '@clerk/nextjs/server'
import { config } from '@/config'
import { supabaseAdmin } from '@/config/supabase'
import {
  sendDataDeletedEmail,
  sendInactivityWarningEmail,
} from '@/lib/mailers'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const INACTIVITY_WARNING_DAYS = 23
export const INACTIVITY_DELETE_DAYS = 30
/** Minimum days after a warning before data may be deleted */
export const INACTIVITY_WARNING_GRACE_DAYS = 7

type ActivityRow = {
  user_id: string
  last_active_at: string
  warning_sent_at: string | null
}

/**
 * Upsert last_active_at for a user. Clears any pending deletion warning.
 * Best-effort — failures are logged and swallowed so request flows are unaffected.
 */
export async function touchUserActivity(userId: string): Promise<void> {
  if (!supabaseAdmin || !userId) return

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('user_activity').upsert(
    {
      user_id: userId,
      last_active_at: now,
      warning_sent_at: null,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    console.error('Failed to touch user activity:', error.message)
  }
}

async function getClerkEmail(userId: string): Promise<{ email: string | null; name: string }> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.username ||
      'there'
    return { email, name }
  } catch (error) {
    console.error(`Failed to load Clerk user ${userId}:`, error)
    return { email: null, name: 'there' }
  }
}

/**
 * Ensure every user with stored app data has an activity row.
 * Seeds last_active_at from their newest application / interview timestamp.
 */
async function ensureActivityRows(): Promise<ActivityRow[]> {
  if (!supabaseAdmin) return []

  const [{ data: apps }, { data: sessions }, { data: activities }] = await Promise.all([
    supabaseAdmin.from('job_applications').select('user_id, updated_at, created_at'),
    supabaseAdmin.from('interview_sessions').select('user_id, created_at, completed_at'),
    supabaseAdmin.from('user_activity').select('user_id, last_active_at, warning_sent_at'),
  ])

  const activityByUser = new Map<string, ActivityRow>(
    (activities ?? []).map((row) => [row.user_id, row as ActivityRow])
  )

  const latestByUser = new Map<string, string>()

  for (const row of apps ?? []) {
    const ts = row.updated_at || row.created_at
    if (!ts) continue
    const prev = latestByUser.get(row.user_id)
    if (!prev || ts > prev) latestByUser.set(row.user_id, ts)
  }

  for (const row of sessions ?? []) {
    const ts = row.completed_at || row.created_at
    if (!ts) continue
    const prev = latestByUser.get(row.user_id)
    if (!prev || ts > prev) latestByUser.set(row.user_id, ts)
  }

  for (const [userId, lastSeen] of latestByUser) {
    if (activityByUser.has(userId)) continue

    const { error } = await supabaseAdmin.from('user_activity').insert({
      user_id: userId,
      last_active_at: lastSeen,
      warning_sent_at: null,
    })

    if (error) {
      // Concurrent cron runs may race on insert — ignore unique violations.
      if (!error.message.toLowerCase().includes('duplicate')) {
        console.error(`Failed to seed activity for ${userId}:`, error.message)
      }
      continue
    }

    activityByUser.set(userId, {
      user_id: userId,
      last_active_at: lastSeen,
      warning_sent_at: null,
    })
  }

  return Array.from(activityByUser.values())
}

async function deleteUserAppData(userId: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured')
  }

  const { error: sessionsError } = await supabaseAdmin
    .from('interview_sessions')
    .delete()
    .eq('user_id', userId)

  if (sessionsError) {
    throw new Error(`Failed to delete interview sessions: ${sessionsError.message}`)
  }

  const { error: appsError } = await supabaseAdmin
    .from('job_applications')
    .delete()
    .eq('user_id', userId)

  if (appsError) {
    throw new Error(`Failed to delete job applications: ${appsError.message}`)
  }

  const { error: activityError } = await supabaseAdmin
    .from('user_activity')
    .delete()
    .eq('user_id', userId)

  if (activityError) {
    throw new Error(`Failed to delete user activity: ${activityError.message}`)
  }
}

export type InactivityCleanupResult = {
  warningsSent: number
  deleted: number
  errors: string[]
}

/**
 * Send warning emails and purge data for users inactive past the configured thresholds.
 */
export async function runInactivityCleanup(now = new Date()): Promise<InactivityCleanupResult> {
  const result: InactivityCleanupResult = { warningsSent: 0, deleted: 0, errors: [] }

  if (!supabaseAdmin) {
    result.errors.push('Supabase admin client not configured')
    return result
  }

  const activities = await ensureActivityRows()
  const warningCutoff = new Date(now.getTime() - INACTIVITY_WARNING_DAYS * MS_PER_DAY)
  const deleteCutoff = new Date(now.getTime() - INACTIVITY_DELETE_DAYS * MS_PER_DAY)
  const graceCutoff = new Date(now.getTime() - INACTIVITY_WARNING_GRACE_DAYS * MS_PER_DAY)

  for (const activity of activities) {
    const lastActive = new Date(activity.last_active_at)
    if (Number.isNaN(lastActive.getTime())) continue

    try {
      // Deletion: inactive ≥ 30 days and warning sent ≥ 7 days ago
      if (
        lastActive <= deleteCutoff &&
        activity.warning_sent_at &&
        new Date(activity.warning_sent_at) <= graceCutoff
      ) {
        const { email, name } = await getClerkEmail(activity.user_id)
        await deleteUserAppData(activity.user_id)

        if (email) {
          try {
            await sendDataDeletedEmail(email, name)
          } catch (emailError) {
            const message =
              emailError instanceof Error ? emailError.message : 'Unknown email error'
            result.errors.push(`Deletion email failed for ${activity.user_id}: ${message}`)
          }
        } else {
          result.errors.push(`No email found for deleted user ${activity.user_id}`)
        }

        result.deleted += 1
        continue
      }

      // Warning: inactive ≥ 23 days and no warning yet
      if (lastActive <= warningCutoff && !activity.warning_sent_at) {
        const { email, name } = await getClerkEmail(activity.user_id)
        if (!email) {
          result.errors.push(`No email found for warning user ${activity.user_id}`)
          continue
        }

        const daysRemaining = Math.max(
          1,
          Math.ceil((lastActive.getTime() + INACTIVITY_DELETE_DAYS * MS_PER_DAY - now.getTime()) / MS_PER_DAY)
        )

        await sendInactivityWarningEmail(email, name, daysRemaining)

        const warningAt = now.toISOString()
        const { error } = await supabaseAdmin
          .from('user_activity')
          .update({ warning_sent_at: warningAt })
          .eq('user_id', activity.user_id)

        if (error) {
          throw new Error(`Failed to mark warning sent: ${error.message}`)
        }

        result.warningsSent += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`${activity.user_id}: ${message}`)
    }
  }

  return result
}

export function assertCronAuthorized(request: Request): void {
  const secret = config.security.cronSecret
  if (!secret) {
    throw new Error('CRON_SECRET is not configured')
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    throw new Error('Unauthorized')
  }
}
