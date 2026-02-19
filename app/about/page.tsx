'use client'

import { useLanguage, LanguageToggle } from '@/lib/i18n/context'
import { Briefcase, Rocket, Target, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-white selection:bg-primary selection:text-white">
            {/* Public Header */}
            <header className="fixed top-0 w-full z-50 border-b bg-background/60 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center space-x-2 group">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 transform group-hover:rotate-6">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                Catalyst
                            </span>
                        </Link>
                        <nav className="hidden md:flex items-center space-x-1">
                            <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                                <ArrowLeft className="h-4 w-4 inline mr-1" />
                                Home
                            </Link>
                            <Link href="/features" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors">{t('nav.features')}</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageToggle />
                        <Link href="/auth/login">
                            <Button variant="ghost" className="font-semibold text-slate-600 hover:text-primary">{t('nav.login')}</Button>
                        </Link>
                        <Link href="/auth/signup">
                            <Button className="font-bold shadow-lg shadow-primary/20">{t('nav.getStarted')}</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="pt-16">
                {/* Hero Section */}
                <section className="relative py-24 overflow-hidden border-b">
                    <div className="absolute top-0 right-0 w-[40%] h-[100%] bg-primary/5 blur-[100px] -z-10"></div>
                    <div className="container mx-auto px-4">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase mb-6">
                                Our Story
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[0.9]">
                                Empowering the <span className="gradient-text">Future of Work</span> in India
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed mb-10">
                                {t('about.mission.text')}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="py-24 bg-slate-50">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="p-10 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600 w-fit mb-6">
                                    <Target className="h-8 w-8" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">{t('about.mission.title')}</h2>
                                <p className="text-slate-600 leading-relaxed italic">
                                    "{t('about.mission.text')}"
                                </p>
                            </div>

                            <div className="p-10 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                <div className="p-3 rounded-2xl bg-purple-100 text-purple-600 w-fit mb-6">
                                    <Rocket className="h-8 w-8" />
                                </div>
                                <h2 className="text-3xl font-black mb-4">{t('about.vision.title')}</h2>
                                <p className="text-slate-600 leading-relaxed">
                                    {t('about.vision.text')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="py-24">
                    <div className="container mx-auto px-4 text-center">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="space-y-2">
                                <div className="text-4xl font-black tracking-tighter text-primary">10k+</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('about.stats.users')}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-black tracking-tighter text-primary">25k+</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('about.stats.resumes')}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-black tracking-tighter text-primary">15k+</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('about.stats.interviews')}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-4xl font-black tracking-tighter text-primary">500k+</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('about.stats.jobs')}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team/Founder Section */}
                <section className="py-24 bg-slate-900 text-white rounded-[3rem] mx-4 mb-24">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row items-center gap-16">
                            <div className="w-full md:w-1/3">
                                <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-primary to-violet-600 p-1">
                                    {/* Replace with actual image later */}
                                    <div className="w-full h-full rounded-[2.9rem] bg-slate-800 flex items-center justify-center text-7xl font-black text-white/20">
                                        AA
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 space-y-8">
                                <div>
                                    <div className="text-primary font-bold uppercase tracking-widest text-sm mb-4">{t('about.founder')}</div>
                                    <h2 className="text-5xl font-black tracking-tight mb-2">{t('about.founderName')}</h2>
                                    <div className="text-slate-400 text-xl">{t('about.founderRole')}</div>
                                </div>
                                <p className="text-slate-300 text-lg leading-relaxed max-w-2xl italic">
                                    "I built Catalyst because I believe technology should empower people, not gatekeep opportunities. Every job seeker deserves access to world-class career tools without a price tag."
                                </p>
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 bg-slate-800 rounded-full hover:bg-primary transition-colors cursor-pointer"></div>
                                    <div className="h-10 w-10 bg-slate-800 rounded-full hover:bg-primary transition-colors cursor-pointer"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="py-24">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl font-black mb-4">{t('about.tech')}</h2>
                        <p className="text-slate-500 mb-12 max-w-xl mx-auto">
                            {t('about.techDesc')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-12 grayscale opacity-40">
                            <span className="text-2xl font-bold">NEXT.JS</span>
                            <span className="text-2xl font-bold">GEMINI AI</span>
                            <span className="text-2xl font-bold">SUPABASE</span>
                            <span className="text-2xl font-bold">TAILWIND</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* CTA */}
            <section className="py-24 bg-primary text-white text-center">
                <h2 className="text-4xl font-black mb-8 px-4">{t('cta.title')}</h2>
                <Link href="/auth/signup">
                    <Button variant="secondary" size="xl" className="h-16 px-10 text-xl rounded-2xl">
                        {t('cta.button')}
                    </Button>
                </Link>
            </section>

            <footer className="bg-slate-50 py-12 border-t">
                <div className="container mx-auto px-4 text-center text-slate-400 text-xs font-medium">
                    {t('footer.copyright')}
                </div>
            </footer>
        </div>
    )
}
