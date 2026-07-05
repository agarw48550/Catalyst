'use client'

import Link from 'next/link'
import { ArrowRight, Clock3, FileText, Rocket, Sparkles } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface FeatureComingSoonProps {
  featureName: string
  summary: string
  details: string[]
}

export function FeatureComingSoon({
  featureName,
  summary,
  details,
}: FeatureComingSoonProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary selection:text-white">
      <AppHeader />

      <main id="main-content" className="container mx-auto px-4 py-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-12 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:px-10 md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.08),transparent_30%)]" />
          <div className="relative mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Clock3 className="h-3.5 w-3.5" />
              Coming Soon
            </div>

            <div className="mt-6 max-w-3xl">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                {featureName} is on the roadmap.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                {summary}
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
              <Card className="border-0 bg-slate-950 text-white shadow-xl shadow-slate-950/10">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <Rocket className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
                        What is live today
                      </p>
                      <h2 className="text-2xl font-black">Resume Builder</h2>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-300">
                    The production experience currently focuses on tailoring resumes for specific roles,
                    extracting resume text from PDFs, and generating ATS-oriented guidance.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild size="lg" className="rounded-xl font-bold">
                      <Link href="/resume">
                        Open Resume Builder <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="rounded-xl font-bold">
                      <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Planned next
                      </p>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        What we are polishing
                      </h2>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {details.map((detail) => (
                      <li
                        key={detail}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                We have intentionally removed this feature from the live dashboard while the production
                version focuses on one workflow that is ready today.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
