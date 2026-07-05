'use client'

import Link from 'next/link'
import { ArrowLeft, Briefcase, FileText, Rocket, ShieldCheck, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LanguageToggle, useLanguage } from '@/lib/i18n/context'

export default function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white dark:bg-slate-950">
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
              <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300">
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                Home
              </Link>
              <Link href="/features" className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300">
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
              <Target className="h-3.5 w-3.5" />
              What Catalyst is today
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              A cleaner, resume-first launch.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Catalyst started as a broader career-tool concept, but the production release intentionally narrows
              the scope to the Resume Builder. The goal is to launch one workflow that is easier to trust,
              support, and improve.
            </p>
          </div>
        </section>

        <section className="bg-slate-50 py-24 dark:bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              <AboutCard
                icon={<FileText className="h-7 w-7" />}
                title="Focused product scope"
                description="The live dashboard keeps one active workflow instead of spreading attention across unfinished tools."
              />
              <AboutCard
                icon={<ShieldCheck className="h-7 w-7" />}
                title="Truthful public copy"
                description="The site now describes what is actually available instead of promising removed features as if they are live."
              />
              <AboutCard
                icon={<Rocket className="h-7 w-7" />}
                title="Roadmap kept separate"
                description="Interview practice, job search, research, and custom settings are now treated as roadmap items."
              />
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-10">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  What the current release includes
                </h2>
                <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <li>Resume text input by paste or PDF upload.</li>
                  <li>Tailoring against a specific job title, company, and description.</li>
                  <li>ATS-oriented scoring, skill matching, and revision suggestions.</li>
                  <li>Printable PDF export for the tailored result.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-10">
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  What we removed from the live product
                </h2>
                <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  <li>Interview Practice</li>
                  <li>Job Search</li>
                  <li>Career Research</li>
                  <li>The custom in-app Settings page</li>
                </ul>
                <p className="mt-6 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Those routes remain visible only as coming-soon placeholders while the production release stays
                  focused on the resume workflow.
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
        <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </CardContent>
    </Card>
  )
}
