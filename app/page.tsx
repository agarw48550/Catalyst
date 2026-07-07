'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Briefcase, Clock3, FileText, Search, Sparkles, TrendingUp, UserRoundCheck } from 'lucide-react'
import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs'
import { LanguageToggle, useLanguage } from '@/lib/i18n/context'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-50 border-b bg-background/75 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="rounded-xl bg-primary/10 p-2 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black tracking-tight">Catalyst</span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              <Link href="/about" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {t('nav.about')}
              </Link>
              <Link href="/features" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                {t('nav.features')}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <SignInButton mode="modal">
                <Button variant="ghost" className="font-semibold text-muted-foreground hover:text-primary">
                  {t('nav.login')}
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="font-bold shadow-lg shadow-primary/20">
                  {t('nav.getStarted')}
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_30%)]" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {t('home.badge')}
              </div>

              <h1 className="mt-8 text-5xl font-black tracking-tight text-foreground sm:text-6xl md:text-7xl">
                {t('home.title')}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {t('home.subtitle')}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <SignUpButton mode="modal">
                  <Button size="xl" className="h-14 rounded-2xl px-8 text-base font-bold shadow-xl shadow-primary/25">
                    {t('home.ctaPrimary')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
                <Link href="/features">
                  <Button size="xl" variant="outline" className="h-14 rounded-2xl px-8 text-base font-semibold">
                    {t('home.ctaSecondary')}
                  </Button>
                </Link>
              </div>

              <div className="mt-16 grid gap-4 text-left md:grid-cols-3">
                <ValueCard icon={<FileText className="h-5 w-5" />} title={t('home.value1.title')} description={t('home.value1.desc')} />
                <ValueCard icon={<UserRoundCheck className="h-5 w-5" />} title={t('home.value2.title')} description={t('home.value2.desc')} />
                <ValueCard icon={<Clock3 className="h-5 w-5" />} title={t('home.value3.title')} description={t('home.value3.desc')} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/40 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t('home.live.label')}</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-foreground">{t('home.live.title')}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{t('home.live.subtitle')}</p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground">{t('dash.resumeBuilder')}</h3>
                      <p className="text-sm text-muted-foreground">{t('common.liveNow')}</p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
                    <li>{t('home.live.bullet1')}</li>
                    <li>{t('home.live.bullet2')}</li>
                    <li>{t('home.live.bullet3')}</li>
                    <li>{t('home.live.bullet4')}</li>
                  </ul>
                  <div className="mt-8">
                    <SignUpButton mode="modal">
                      <Button className="rounded-xl font-bold">{t('home.live.cta')}</Button>
                    </SignUpButton>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <RoadmapCard href="/interview" icon={<Sparkles className="h-5 w-5" />} title={t('home.roadmap.interview')} />
                <RoadmapCard href="/jobs" icon={<Search className="h-5 w-5" />} title={t('home.roadmap.jobs')} />
                <RoadmapCard href="/research" icon={<TrendingUp className="h-5 w-5" />} title={t('home.roadmap.research')} />
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t('home.how.label')}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-foreground">{t('home.how.title')}</h2>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              <StepCard step="01" title={t('home.how.step1.title')} description={t('home.how.step1.desc')} />
              <StepCard step="02" title={t('home.how.step2.title')} description={t('home.how.step2.desc')} />
              <StepCard step="03" title={t('home.how.step3.title')} description={t('home.how.step3.desc')} />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-16 text-slate-300 dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 border-b border-slate-800 pb-12 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary p-1.5 text-white">
                  <Briefcase className="h-4 w-4" />
                </div>
                <span className="text-lg font-black text-white">Catalyst</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">{t('home.footer.desc')}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{t('footer.product')}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link href="/features" className="transition-colors hover:text-primary">{t('nav.features')}</Link></li>
                <li><Link href="/resume" className="transition-colors hover:text-primary">{t('nav.resume')}</Link></li>
                <li><Link href="/interview" className="transition-colors hover:text-primary">{t('home.roadmap.interview')} · {t('common.comingSoon')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{t('footer.company')}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link href="/about" className="transition-colors hover:text-primary">{t('nav.about')}</Link></li>
                <li><Link href="/auth/login" className="transition-colors hover:text-primary">{t('nav.login')}</Link></li>
                <li><Link href="/auth/signup" className="transition-colors hover:text-primary">{t('nav.getStarted')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{t('home.footer.status.title')}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-400">{t('home.footer.status.desc')}</p>
            </div>
          </div>

          <div className="pt-8 text-xs text-slate-500">{t('footer.copyright')}</div>
        </div>
      </footer>
    </div>
  )
}

function ValueCard({
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
      <CardContent className="p-6">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary w-fit">{icon}</div>
        <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function RoadmapCard({
  href,
  icon,
  title,
}: {
  href: string
  icon: React.ReactNode
  title: string
}) {
  const { t } = useLanguage()
  return (
    <Link href={href} className="block">
      <Card className="h-full border-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="flex items-center gap-3 p-6">
          <div className="rounded-2xl bg-muted p-3 text-foreground w-fit">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{t('common.comingSoon')}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string
  title: string
  description: string
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8 text-left">
        <div className="text-5xl font-black tracking-tight text-muted/60">{step}</div>
        <h3 className="mt-4 text-xl font-bold text-foreground">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
