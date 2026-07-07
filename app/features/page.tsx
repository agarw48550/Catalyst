'use client'

import Link from 'next/link'
import { ArrowLeft, Briefcase, FileText, Search, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LanguageToggle, useLanguage } from '@/lib/i18n/context'

export default function FeaturesPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-50 border-b bg-background/75 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="rounded-xl bg-primary/10 p-2 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black tracking-tight">Catalyst</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                {t('featuresPage.home')}
              </Link>
              <Link href="/about" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {t('nav.about')}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link href="/auth/login">
              <Button variant="ghost">{t('nav.login')}</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>{t('nav.getStarted')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="bg-background py-24">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t('featuresPage.badge')}
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              {t('featuresPage.title')}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {t('featuresPage.subtitle')}
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-10">
                  <div className="rounded-2xl bg-primary/10 p-4 text-primary w-fit">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-tight text-foreground">
                    {t('dash.resumeBuilder')}
                  </h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {t('featuresPage.resume.desc')}
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <FeaturePoint title={t('featuresPage.point1.title')} description={t('featuresPage.point1.desc')} />
                    <FeaturePoint title={t('featuresPage.point2.title')} description={t('featuresPage.point2.desc')} />
                    <FeaturePoint title={t('featuresPage.point3.title')} description={t('featuresPage.point3.desc')} />
                    <FeaturePoint title={t('featuresPage.point4.title')} description={t('featuresPage.point4.desc')} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-foreground">
                    {t('featuresPage.roadmap.badge')}
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-tight text-foreground">
                    {t('featuresPage.roadmap.title')}
                  </h2>
                  <div className="mt-6 space-y-4">
                    <RoadmapLine
                      href="/interview"
                      icon={<Sparkles className="h-5 w-5" />}
                      title={t('home.roadmap.interview')}
                      description={t('featuresPage.roadmap.interview.desc')}
                    />
                    <RoadmapLine
                      href="/jobs"
                      icon={<Search className="h-5 w-5" />}
                      title={t('home.roadmap.jobs')}
                      description={t('featuresPage.roadmap.jobs.desc')}
                    />
                    <RoadmapLine
                      href="/research"
                      icon={<TrendingUp className="h-5 w-5" />}
                      title={t('home.roadmap.research')}
                      description={t('featuresPage.roadmap.research.desc')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeaturePoint({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-border bg-muted/40 p-5">
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function RoadmapLine({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-3xl border border-border bg-muted/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="rounded-2xl bg-background p-3 text-foreground w-fit">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  )
}
