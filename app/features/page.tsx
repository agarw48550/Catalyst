'use client'

import Link from 'next/link'
import { ArrowLeft, Briefcase, Clock3, FileText, Search, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LanguageToggle, useLanguage } from '@/lib/i18n/context'

export default function FeaturesPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary selection:text-white dark:bg-slate-950">
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
              <Link href="/about" className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300">
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
        <section className="bg-white py-24 dark:bg-slate-950">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Current product surface
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl">
              Resume Builder is the only live feature today.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              We reduced the product to one production-ready workflow instead of keeping partially finished
              features online. This page reflects what is actually available right now.
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
                  <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    Resume Builder
                  </h2>
                  <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
                    Tailor an existing resume to a target role with PDF parsing, ATS-oriented scoring, matched
                    skills, missing skills, and revision suggestions.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <FeaturePoint title="PDF upload" description="Extract text from a resume PDF and continue editing in the browser." />
                    <FeaturePoint title="Targeted tailoring" description="Generate a refined draft using a specific job title, company, and description." />
                    <FeaturePoint title="ATS guidance" description="Review an estimated ATS score and key skill matches." />
                    <FeaturePoint title="Exportable output" description="Copy the result or export it as a printable PDF." />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <Clock3 className="h-3.5 w-3.5" />
                    Roadmap
                  </div>
                  <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    Planned next
                  </h2>
                  <div className="mt-6 space-y-4">
                    <RoadmapLine
                      href="/interview"
                      icon={<Sparkles className="h-5 w-5" />}
                      title="Interview Practice"
                      description="Visible only as a coming-soon route while the workflow is reworked."
                    />
                    <RoadmapLine
                      href="/jobs"
                      icon={<Search className="h-5 w-5" />}
                      title="Job Search"
                      description="Not part of the production surface until quality and source coverage improve."
                    />
                    <RoadmapLine
                      href="/research"
                      icon={<TrendingUp className="h-5 w-5" />}
                      title="Career Research"
                      description="Paused until the output is better grounded and easier to verify."
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
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
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
      className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="rounded-2xl bg-white p-3 text-slate-700 w-fit dark:bg-slate-950 dark:text-slate-200">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </Link>
  )
}
