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
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white selection:bg-primary selection:text-white">
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
              <Link href="/about" className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300">
                {t('nav.about')}
              </Link>
              <Link href="/features" className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300">
                {t('nav.features')}
              </Link>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Resume-first
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <SignInButton mode="modal">
                <Button variant="ghost" className="font-semibold text-slate-600 hover:text-primary dark:text-slate-300">
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
                <Sparkles className="h-3.5 w-3.5" />
                Production-ready today
              </div>

              <h1 className="mt-8 text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl md:text-7xl">
                Resume tailoring that is ready for real job applications.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Catalyst currently focuses on one live workflow: helping you tailor your resume to a target role,
                review ATS-oriented feedback, and export a cleaner draft.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <SignUpButton mode="modal">
                  <Button size="xl" className="h-14 rounded-2xl px-8 text-base font-bold shadow-xl shadow-primary/25">
                    Start with Resume Builder <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
                <Link href="/features">
                  <Button size="xl" variant="outline" className="h-14 rounded-2xl px-8 text-base font-semibold">
                    See what is live
                  </Button>
                </Link>
              </div>

              <div className="mt-16 grid gap-4 text-left md:grid-cols-3">
                <ValueCard
                  icon={<FileText className="h-5 w-5" />}
                  title="Resume-focused"
                  description="The current release is intentionally scoped to one workflow that we can support well."
                />
                <ValueCard
                  icon={<UserRoundCheck className="h-5 w-5" />}
                  title="Built for targeted applications"
                  description="Paste a job description and tailor your existing resume for that specific opportunity."
                />
                <ValueCard
                  icon={<Clock3 className="h-5 w-5" />}
                  title="Roadmap, not hype"
                  description="Interview practice, job search, and research are visible only as coming-soon roadmap items."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-24 dark:bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">What is live</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                One active workflow, polished for launch
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                The dashboard now centers on the Resume Builder instead of a spread of partially finished tools.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Resume Builder</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Active now</p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    <li>Upload a PDF resume or paste your current resume text.</li>
                    <li>Tailor it to a specific job title, company, and description.</li>
                    <li>Review ATS score, matched skills, missing skills, and actionable suggestions.</li>
                    <li>Copy the result or export it to a printable PDF.</li>
                  </ul>
                  <div className="mt-8">
                    <SignUpButton mode="modal">
                      <Button className="rounded-xl font-bold">Try Resume Builder</Button>
                    </SignUpButton>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <RoadmapCard
                  href="/interview"
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Interview Practice"
                  description="Roadmap only. The live workflow is offline until it is ready for production."
                />
                <RoadmapCard
                  href="/jobs"
                  icon={<Search className="h-5 w-5" />}
                  title="Job Search"
                  description="Roadmap only. Search and saved-job flows were removed from the production surface."
                />
                <RoadmapCard
                  href="/research"
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="Career Research"
                  description="Roadmap only. Research outputs will return after a stronger grounding pass."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">How it works</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              A simpler launch path
            </h2>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              <StepCard
                step="01"
                title="Create your account"
                description="Sign in and open the dashboard for the production workflow."
              />
              <StepCard
                step="02"
                title="Add your resume and target role"
                description="Paste text or upload a PDF, then provide the job description you want to target."
              />
              <StepCard
                step="03"
                title="Refine and export"
                description="Use the tailored output, ATS score, and skill guidance to strengthen your application."
              />
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
              <p className="mt-4 text-sm leading-6 text-slate-400">
                A resume-first career product focused on a single workflow that is ready today.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">Product</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link href="/features" className="transition-colors hover:text-primary">{t('nav.features')}</Link></li>
                <li><Link href="/resume" className="transition-colors hover:text-primary">{t('nav.resume')}</Link></li>
                <li><Link href="/interview" className="transition-colors hover:text-primary">Interview Practice (Coming Soon)</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">Company</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link href="/about" className="transition-colors hover:text-primary">{t('nav.about')}</Link></li>
                <li><Link href="/auth/login" className="transition-colors hover:text-primary">{t('nav.login')}</Link></li>
                <li><Link href="/auth/signup" className="transition-colors hover:text-primary">{t('nav.getStarted')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">Status</h3>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                The production release currently supports resume tailoring only. Other tools remain on the roadmap until they are launch-ready.
              </p>
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
        <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </CardContent>
    </Card>
  )
}

function RoadmapCard({
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
    <Link href={href} className="block">
      <Card className="h-full border-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-6">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 w-fit dark:bg-slate-900 dark:text-slate-200">
            {icon}
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
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
        <div className="text-5xl font-black tracking-tight text-slate-100 dark:text-slate-800">{step}</div>
        <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </CardContent>
    </Card>
  )
}
