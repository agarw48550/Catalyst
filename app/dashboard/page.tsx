'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Plus, Briefcase, Loader2, ArrowRight } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LANG_LABELS, useLanguage } from '@/lib/i18n/context'
import type { Language } from '@/lib/i18n/translations'

interface ApplicationSummary {
  id: string
  job_title: string
  company: string
  language: string
  research_status: string
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'apps.statusPending',
  processing: 'apps.statusProcessing',
  complete: 'apps.statusComplete',
  failed: 'apps.statusFailed',
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const { t } = useLanguage()
  const [applications, setApplications] = useState<ApplicationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch('/api/applications')
        if (!res.ok) {
          const payload = await res.json()
          throw new Error(payload.error || 'Failed to load')
        }
        const data = await res.json()
        setApplications(data.applications ?? [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded && user) {
      fetchApplications()
    } else if (isLoaded) {
      setLoading(false)
    }
  }, [isLoaded, user])

  const displayName = user?.firstName || user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'there'

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main id="main-content" className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t('apps.badge')}
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight">
              {t('dash.welcome')}, <span className="gradient-text">{displayName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{t('apps.dashboardDesc')}</p>
          </div>
          <Button asChild size="lg" className="rounded-xl font-bold gap-2">
            <Link href="/dashboard/new">
              <Plus className="h-5 w-5" />
              {t('apps.addApplication')}
            </Link>
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        )}

        {applications.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold">{t('apps.emptyTitle')}</h2>
              <p className="mt-2 max-w-md text-muted-foreground">{t('apps.emptyDesc')}</p>
              <Button asChild className="mt-6 rounded-xl font-bold gap-2">
                <Link href="/dashboard/new">
                  <Plus className="h-4 w-4" />
                  {t('apps.addApplication')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <Link key={app.id} href={`/applications/${app.id}`}>
                <Card className="h-full border-0 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{app.job_title}</CardTitle>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {LANG_LABELS[app.language as Language] || app.language}
                      </span>
                    </div>
                    <CardDescription className="font-medium text-foreground/80">{app.company}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${
                      app.research_status === 'complete' ? 'text-green-600' :
                      app.research_status === 'failed' ? 'text-destructive' :
                      'text-amber-600'
                    }`}>
                      {t((STATUS_LABELS[app.research_status] || 'apps.statusPending') as 'apps.statusPending')}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
