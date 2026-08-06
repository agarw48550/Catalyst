'use client'

import Link from 'next/link'
import { ArrowRight, FileText, Rocket, Sparkles } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'

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
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <AppHeader />

      <main id="main-content" className="container mx-auto px-4 py-12">
        <section className="relative overflow-hidden rounded-[2rem] border bg-card px-6 py-12 shadow-sm md:px-10 md:py-16">
          <div className="absolute inset-0 harbor-surface" />
          <div className="relative mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t('common.comingSoon')}
            </div>

            <div className="mt-6 max-w-3xl">
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                {featureName} {t('comingSoon.headingSuffix')}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
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
                        {t('home.live.label')}
                      </p>
                      <h2 className="text-2xl font-black">{t('dash.resumeBuilder')}</h2>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-300">
                    {t('featuresPage.resume.desc')}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild size="lg" className="rounded-xl font-bold">
                      <Link href="/resume">
                        {t('dash.openBuilder')} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="rounded-xl font-bold">
                      <Link href="/dashboard">{t('comingSoon.backToDashboard')}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {t('featuresPage.roadmap.title')}
                      </p>
                      <h2 className="text-2xl font-black text-foreground">
                        {featureName}
                      </h2>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {details.map((detail) => (
                      <li
                        key={detail}
                        className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm font-medium leading-6 text-foreground"
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>{t('comingSoon.footerNote')}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
