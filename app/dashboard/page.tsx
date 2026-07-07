'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, FileText, Zap } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Zap className="h-8 w-8 animate-pulse text-primary" />
      </div>
    )
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <AppHeader />

      <main id="main-content" className="container mx-auto px-4 py-12">
        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.95fr]">
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="relative p-8 sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_35%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {t('dash.productionFocus')}
                </div>
                <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground">
                  {t('dash.welcome')}, <span className="gradient-text">{displayName}</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  {t('dash.heroDesc')}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="rounded-xl font-bold">
                    <Link href="/resume">
                      {t('dash.openBuilder')} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                {t('dash.yourProgress')}
              </CardTitle>
              <CardDescription>{t('dash.progressDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl bg-muted p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {t('dash.tailoredResumesLabel')}
                    </p>
                    <div className="mt-2 text-4xl font-black text-foreground">
                      {resumeCount}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">{t('dash.progressTip')}</p>

              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                <span>{t('dash.newFeaturesSoon')}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">{t('dash.resumeBuilder')}</CardTitle>
              <CardDescription>{t('dash.builderCardDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border p-5">
                <h3 className="text-lg font-bold text-foreground">{t('dash.whatYouCanDo')}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>{t('home.live.bullet1')}</li>
                  <li>{t('home.live.bullet2')}</li>
                  <li>{t('home.live.bullet3')}</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="rounded-xl font-semibold">
                <Link href="/resume">{t('dash.openBuilder')}</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
