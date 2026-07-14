'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResumeTailorPanel } from '@/components/resume-tailor-panel'
import { LiveInterviewPanel } from '@/components/live-interview-panel'
import { LANG_LABELS, useLanguage } from '@/lib/i18n/context'
import type { Language } from '@/lib/i18n/translations'

interface JobApplication {
  id: string
  job_title: string
  company: string
  job_description: string
  resume_text: string
  language: string
  research_status: string
  company_research: {
    summary?: string
    hiringProcess?: string
    interviewTips?: string[]
    cultureNotes?: string
  } | null
}

export default function ApplicationPage() {
  const params = useParams()
  const id = params.id as string
  const { t, lang, setLang } = useLanguage()
  const [application, setApplication] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchApplication() {
      try {
        const res = await fetch(`/api/applications/${id}`)
        if (!res.ok) {
          const payload = await res.json()
          throw new Error(payload.error || 'Not found')
        }
        const data = await res.json()
        setApplication(data.application)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [id])

  useEffect(() => {
    if (application && application.language !== lang) {
      setLang(application.language as Language)
    }
  }, [application, lang, setLang])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-12 text-center">
          <p className="text-destructive">{error || t('apps.notFound')}</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">{t('apps.backToDashboard')}</Link>
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-4 gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            {t('apps.backToDashboard')}
          </Link>
        </Button>

        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">{application.job_title}</h1>
            <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
              {LANG_LABELS[application.language as Language]}
            </span>
          </div>
          <p className="mt-1 text-lg text-muted-foreground">{application.company}</p>

          {application.company_research?.summary && (
            <div className="mt-4 rounded-xl border bg-muted/50 p-4 text-sm">
              <p className="font-semibold">{t('apps.companyResearch')}</p>
              <p className="mt-1 text-muted-foreground">{application.company_research.summary}</p>
            </div>
          )}
        </div>

        <Tabs defaultValue="resume" className="space-y-6">
          <TabsList>
            <TabsTrigger value="resume">{t('apps.resumeTab')}</TabsTrigger>
            <TabsTrigger value="interview">{t('apps.interviewTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="resume">
            <ResumeTailorPanel
              applicationId={application.id}
              initialResumeText={application.resume_text}
              jobTitle={application.job_title}
              company={application.company}
            />
          </TabsContent>

          <TabsContent value="interview">
            <LiveInterviewPanel
              applicationId={application.id}
              jobTitle={application.job_title}
              company={application.company}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
