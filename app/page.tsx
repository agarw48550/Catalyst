'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Briefcase,
  FileText,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Users,
  Sparkles,
  Zap,
  ChevronRight,
  Play,
  Shield,
  Globe,
  Star,
  Target,
  Rocket
} from 'lucide-react'
import { useLanguage, LanguageToggle } from '@/lib/i18n/context'

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let startTime: number | null = null
    function animate(ts: number) {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [started, end, duration])

  return { count, ref }
}

export default function HomePage() {
  const { t } = useLanguage()

  const scrollToFeatures = () => {
    const features = document.getElementById('features')
    if (features) {
      features.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const stat1 = useCountUp(10000, 2000)
  const stat2 = useCountUp(25000, 2200)
  const stat3 = useCountUp(15000, 2400)
  const stat4 = useCountUp(500000, 2600)

  return (
    <div className="flex flex-col min-h-screen selection:bg-primary selection:text-white">
      {/* Premium Header */}
      <header className="fixed top-0 w-full z-50 border-b bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 transform group-hover:rotate-6">
                <Briefcase className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                Catalyst
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              <Link href="/about" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link href="/features" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors">{t('nav.features')}</Link>
              <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded-full ml-2">
                {t('nav.free')}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" className="font-semibold text-slate-600 hover:text-primary">{t('nav.login')}</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                  {t('nav.getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white py-24 sm:py-32 lg:pb-40">
          {/* Animated Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-15%] w-[60%] h-[60%] bg-gradient-to-br from-primary/8 to-violet-500/8 rounded-full blur-[120px] animate-float-slow"></div>
            <div className="absolute bottom-[-20%] left-[-15%] w-[50%] h-[50%] bg-gradient-to-tr from-indigo-500/6 to-purple-500/6 rounded-full blur-[100px] animate-float"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-radial from-primary/3 to-transparent rounded-full blur-[80px]"></div>
            {/* Decorative grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-8 animate-fade-in border border-primary/20">
                <Sparkles className="h-3 w-3 animate-pulse" />
                {t('hero.badge')}
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9] mb-8 animate-fade-in-up">
                {t('hero.title1')}
                <br />
                <span className="gradient-text animate-gradient-x">{t('hero.title2')}</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="xl" className="w-full sm:w-auto text-lg h-16 px-8 rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 group">
                    {t('hero.cta')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={scrollToFeatures}
                  className="w-full sm:w-auto text-lg h-16 px-8 rounded-2xl border-2 hover:bg-slate-50 hover:border-primary/30 transition-all duration-300 group"
                >
                  <Play className="mr-2 h-5 w-5 fill-slate-900 group-hover:fill-primary group-hover:text-primary transition-colors" />
                  {t('hero.demo')}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-20 pt-10 border-t border-slate-100 animate-fade-in animation-delay-500">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-600">4.9/5</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Trusted by ambitious job seekers across India</p>
                <div className="flex flex-wrap justify-center gap-8">
                  <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-bold">Enterprise Grade</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
                    <Globe className="h-5 w-5" />
                    <span className="text-sm font-bold">Multi-language</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm font-bold">AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-bold">100% Free</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32 bg-slate-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:48px_48px] -z-0"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl mb-16 px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase mb-4">
                <Rocket className="h-3 w-3" />
                Powerful Tools
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
                {t('features.title')}
              </h2>
              <p className="text-lg text-slate-600">
                {t('features.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
              <FeatureCard
                icon={<FileText className="h-8 w-8" />}
                title={t('features.resume.title')}
                description={t('features.resume.desc')}
                href="/resume"
                color="indigo"
                delay="0"
              />
              <FeatureCard
                icon={<MessageSquare className="h-8 w-8" />}
                title={t('features.interview.title')}
                description={t('features.interview.desc')}
                href="/interview"
                color="violet"
                delay="100"
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title={t('features.jobs.title')}
                description={t('features.jobs.desc')}
                href="/jobs"
                color="amber"
                delay="200"
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8" />}
                title={t('features.research.title')}
                description={t('features.research.desc')}
                href="/research"
                color="emerald"
                delay="300"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-white relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">
                Built for Scale, Designed for India
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Thousands of job seekers trust Catalyst to power their career journey.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div ref={stat1.ref} className="text-center p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl font-black tracking-tighter text-primary mb-2">{stat1.count >= 10000 ? '10k+' : stat1.count.toLocaleString()}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Users</div>
              </div>
              <div ref={stat2.ref} className="text-center p-8 rounded-3xl bg-gradient-to-br from-violet-50 to-white border border-violet-100/50 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-500 hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl font-black tracking-tighter text-violet-600 mb-2">{stat2.count >= 25000 ? '25k+' : stat2.count.toLocaleString()}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumes Built</div>
              </div>
              <div ref={stat3.ref} className="text-center p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500 hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl font-black tracking-tighter text-emerald-600 mb-2">{stat3.count >= 15000 ? '15k+' : stat3.count.toLocaleString()}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interviews Aced</div>
              </div>
              <div ref={stat4.ref} className="text-center p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-100/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 hover:-translate-y-1">
                <div className="text-4xl sm:text-5xl font-black tracking-tighter text-amber-600 mb-2">{stat4.count >= 500000 ? '500k+' : stat4.count.toLocaleString()}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jobs Discovered</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase mb-4">
                How it works
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">
                Three Steps to Your Dream Career
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '01', title: 'Sign Up Free', desc: 'Create your account in seconds. No credit card, no hidden fees, ever.', icon: Users },
                { step: '02', title: 'Use AI Tools', desc: 'Build resumes, practice interviews, search jobs, and research careers — all AI-powered.', icon: Sparkles },
                { step: '03', title: 'Land Your Job', desc: 'Apply with confidence using optimized materials and preparation.', icon: Target },
              ].map((item, i) => (
                <div key={i} className="relative p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 group text-center">
                  <div className="text-6xl font-black text-slate-100 group-hover:text-primary/10 transition-colors absolute top-4 right-6">{item.step}</div>
                  <div className="relative z-10">
                    <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:scale-110">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg -z-10"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] -z-[5]"></div>
          <div className="container mx-auto px-4 text-center text-white relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-wider uppercase mb-8 border border-white/20">
              <Sparkles className="h-3 w-3" />
              Start for free today
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">
              {t('cta.title')}
            </h2>
            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('cta.subtitle')}
            </p>
            <Link href="/auth/signup" className="inline-block">
              <Button size="xl" variant="secondary" className="text-primary font-black h-16 px-10 text-xl rounded-2xl hover:scale-105 transition-all duration-300 shadow-2xl shadow-black/20 group">
                {t('cta.button')} <ChevronRight className="ml-1 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="bg-slate-900 text-slate-300 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 border-b border-slate-800 pb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-1.5 rounded-lg bg-primary text-white">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="text-xl font-black text-white">Catalyst</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
                {t('footer.tagline')}
              </p>
            </div>

            <div>
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">{t('footer.product')}</h3>
              <ul className="space-y-4 text-sm">
                <li><Link href="/features" className="hover:text-primary transition-colors">{t('nav.features')}</Link></li>
                <li><Link href="/resume" className="hover:text-primary transition-colors">{t('nav.resume')}</Link></li>
                <li><Link href="/interview" className="hover:text-primary transition-colors">{t('nav.interview')}</Link></li>
                <li><Link href="/jobs" className="hover:text-primary transition-colors">{t('nav.jobs')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">{t('footer.company')}</h3>
              <ul className="space-y-4 text-sm">
                <li><Link href="/about" className="hover:text-primary transition-colors">{t('nav.about')}</Link></li>
                <li><Link href="/auth/login" className="hover:text-primary transition-colors">{t('nav.login')}</Link></li>
                <li><Link href="/auth/signup" className="hover:text-primary transition-colors">{t('nav.getStarted')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">{t('footer.legal')}</h3>
              <ul className="space-y-4 text-sm">
                <li><span className="text-slate-500 cursor-default">{t('footer.privacy')}</span></li>
                <li><span className="text-slate-500 cursor-default">{t('footer.terms')}</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-slate-500">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Made with</span>
              <span className="text-red-500">❤️</span>
              <span>in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  href,
  color,
  delay
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
  delay: string
}) {
  const colorMap: Record<string, { bg: string; hover: string; border: string }> = {
    indigo: { bg: 'bg-indigo-50', hover: 'group-hover:bg-indigo-600 group-hover:text-white', border: 'hover:border-indigo-200' },
    violet: { bg: 'bg-violet-50', hover: 'group-hover:bg-violet-600 group-hover:text-white', border: 'hover:border-violet-200' },
    amber: { bg: 'bg-amber-50', hover: 'group-hover:bg-amber-600 group-hover:text-white', border: 'hover:border-amber-200' },
    emerald: { bg: 'bg-emerald-50', hover: 'group-hover:bg-emerald-600 group-hover:text-white', border: 'hover:border-emerald-200' },
  }

  const c = colorMap[color] || colorMap.indigo

  return (
    <Link href={href} className="block group">
      <div className={`p-8 rounded-3xl bg-white border border-slate-100 ${c.border} shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 h-full`}>
        <div className={`mb-6 p-3 rounded-2xl ${c.bg} text-slate-500 ${c.hover} transition-all duration-300 w-fit group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-900 leading-tight">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
        <div className="mt-6 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition-all">
          GET STARTED <ChevronRight className="ml-1 h-3 w-3" />
        </div>
      </div>
    </Link>
  )
}
