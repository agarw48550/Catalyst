'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, FileText, Sparkles, Target, Zap } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/lib/i18n/context'

function useResumeStats() {
  const [resumeCount, setResumeCount] = useState(0)

  useEffect(() => {
    try {
      setResumeCount(parseInt(localStorage.getItem('catalyst_resume_count') || '0', 10))
    } catch {
      setResumeCount(0)
    }
  }, [])

  return { resumeCount }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()
  const { resumeCount } = useResumeStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Zap className="h-8 w-8 animate-pulse text-primary" />
      </div>
    )
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary selection:text-white">
      <AppHeader />

      <main id="main-content" className="container mx-auto px-4 py-12">
        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.95fr]">
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="relative p-8 sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_35%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Production Focus
                </div>
                <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  {t('dash.welcome')}, <span className="gradient-text">{displayName}</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  Catalyst is now focused on one production-ready workflow: tailoring resumes for specific jobs
                  with ATS-oriented AI guidance.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="rounded-xl font-bold">
                    <Link href="/resume">
                      Open Resume Builder <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Target className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
              <CardDescription>Current production activity across the live workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl bg-slate-100 p-6 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Tailored resumes
                    </p>
                    <div className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
                      {resumeCount}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                <p>Upload a PDF or paste your resume, add a target job description, and generate a tailored version.</p>
                <p>Removed tools are no longer part of the live dashboard until they pass a separate production release.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Resume Builder</CardTitle>
              <CardDescription>The only active workflow in the current production release.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">What you can do right now</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>Upload a PDF resume and extract its text.</li>
                  <li>Paste a job description and generate a tailored resume draft.</li>
                  <li>Review ATS score, matched skills, missing skills, and revision suggestions.</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="rounded-xl font-semibold">
                <Link href="/resume">Go to Resume Builder</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-white">Release Notes</CardTitle>
              <CardDescription>Why the dashboard is intentionally smaller.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>This release removes unfinished tools from the main product surface instead of keeping half-ready experiences online.</p>
              <p>Direct visits to those routes now show a roadmap message rather than a live workflow.</p>
              <p>The goal is a cleaner launch around one feature that is validated and supportable.</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
