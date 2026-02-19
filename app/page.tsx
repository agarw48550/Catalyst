'use client'

import Link from 'next/link'
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
  Play
} from 'lucide-react'
import { useLanguage, LanguageToggle } from '@/lib/i18n/context'

export default function HomePage() {
  const { t } = useLanguage()

  const scrollToFeatures = () => {
    const features = document.getElementById('features')
    if (features) {
      features.scrollIntoView({ behavior: 'smooth' })
    }
  }

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
                <Button className="font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 animate-pulse-glow">
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
          {/* Animated Background Shapes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-float-slow"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[100px] animate-float"></div>
          </div>

          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase mb-8 animate-fade-in">
                <Sparkles className="h-3 w-3" />
                {t('hero.badge')}
              </div>

              <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9] mb-8 animate-fade-in-up">
                {t('hero.title1')}
                <br />
                <span className="gradient-text">{t('hero.title2')}</span>
              </h1>

              <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button size="xl" className="w-full sm:w-auto text-lg h-16 px-8 rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                    {t('hero.cta')} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="xl"
                  variant="outline"
                  onClick={scrollToFeatures}
                  className="w-full sm:w-auto text-lg h-16 px-8 rounded-2xl border-2 hover:bg-slate-50 transition-all group"
                >
                  <Play className="mr-2 h-5 w-5 fill-slate-900 group-hover:fill-primary group-hover:text-primary transition-colors" />
                  {t('hero.demo')}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-20 pt-10 border-t border-slate-100 grid items-center justify-center animate-fade-in animation-delay-500">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Loved by ambitious job seekers</p>
                <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale contrast-125">
                  <span className="text-2xl font-bold italic">TechStar</span>
                  <span className="text-2xl font-bold italic">CareerUp</span>
                  <span className="text-2xl font-bold italic">FuturePath</span>
                  <span className="text-2xl font-bold italic">SkillSync</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32 bg-slate-50 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mb-16 px-4">
              <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4">
                {t('features.title')}
              </h2>
              <p className="text-lg text-slate-600">
                {t('features.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
              <FeatureCard
                icon={<FileText className="h-8 w-8" />}
                title={t('features.resume.title')}
                description={t('features.resume.desc')}
                delay="100"
              />
              <FeatureCard
                icon={<MessageSquare className="h-8 w-8" />}
                title={t('features.interview.title')}
                description={t('features.interview.desc')}
                delay="200"
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title={t('features.jobs.title')}
                description={t('features.jobs.desc')}
                delay="300"
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8" />}
                title={t('features.research.title')}
                description={t('features.research.desc')}
                delay="400"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg -z-10 skew-y-3 origin-center scale-110"></div>
          <div className="container mx-auto px-4 text-center text-white">
            <h2 className="text-5xl font-black mb-6 tracking-tight animate-fade-in-up">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              {t('cta.subtitle')}
            </p>
            <Link href="/auth/signup" className="animate-fade-in-up animation-delay-300 inline-block">
              <Button size="xl" variant="secondary" className="text-primary font-black h-16 px-10 text-xl rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-black/20">
                {t('cta.button')} <ChevronRight className="ml-1 h-6 w-6" />
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
                <li className="opacity-50 cursor-not-allowed">{t('nav.resume')}</li>
                <li className="opacity-50 cursor-not-allowed">{t('nav.interview')}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">{t('footer.company')}</h3>
              <ul className="space-y-4 text-sm">
                <li><Link href="/about" className="hover:text-primary transition-colors">{t('nav.about')}</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">{t('footer.legal')}</h3>
              <ul className="space-y-4 text-sm">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">{t('footer.terms')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-slate-500">
              {t('footer.copyright')}
            </p>
            <div className="flex gap-6">
              <div className="h-6 w-6 bg-slate-800 rounded-full hover:bg-primary transition-colors cursor-pointer"></div>
              <div className="h-6 w-6 bg-slate-800 rounded-full hover:bg-primary transition-colors cursor-pointer"></div>
              <div className="h-6 w-6 bg-slate-800 rounded-full hover:bg-primary transition-colors cursor-pointer"></div>
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
  delay
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div className={`p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group hover:-translate-y-2 animate-fade-in-up animation-delay-${delay}`}>
      <div className="mb-6 p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900 leading-tight">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        LEARN MORE <ChevronRight className="ml-1 h-3 w-3" />
      </div>
    </div>
  )
}
