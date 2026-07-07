'use client'

import Link from 'next/link'
import { ArrowLeft, Briefcase, FileText, Rocket, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LanguageToggle, useLanguage } from '@/lib/i18n/context'

export default function AboutPage() {
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
                {t('about.home')}
              </Link>
              <Link href="/features" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {t('nav.features')}
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
        <section className="border-b py-24">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t('about.badge')}
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-foreground sm:text-6xl">
              {t('about.title')}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              {t('about.desc')}
            </p>
          </div>
        </section>

        <section className="bg-muted/40 py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              <AboutCard icon={<FileText className="h-7 w-7" />} title={t('about.card1.title')} description={t('about.card1.desc')} />
              <AboutCard icon={<ShieldCheck className="h-7 w-7" />} title={t('about.card2.title')} description={t('about.card2.desc')} />
              <AboutCard icon={<Rocket className="h-7 w-7" />} title={t('about.card3.title')} description={t('about.card3.desc')} />
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {t('about.includes.title')}
                </h2>
                <ul className="mt-6 space-y-3 text-sm leading-7 text-muted-foreground">
                  <li>{t('about.includes.bullet1')}</li>
                  <li>{t('about.includes.bullet2')}</li>
                  <li>{t('about.includes.bullet3')}</li>
                  <li>{t('about.includes.bullet4')}</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-10">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {t('about.removed.title')}
                </h2>
                <ul className="mt-6 space-y-3 text-sm leading-7 text-muted-foreground">
                  <li>{t('home.roadmap.interview')}</li>
                  <li>{t('home.roadmap.jobs')}</li>
                  <li>{t('home.roadmap.research')}</li>
                  <li>{t('dash.settings')}</li>
                </ul>
                <p className="mt-6 text-sm leading-7 text-muted-foreground">
                  {t('about.removed.desc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}

function AboutCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary w-fit">{icon}</div>
        <h3 className="mt-5 text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
