'use client'

import { useLanguage, LanguageToggle } from '@/lib/i18n/context'
import {
    FileText,
    MessageSquare,
    Zap,
    TrendingUp,
    ShieldCheck,
    Globe,
    Fingerprint,
    Briefcase,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FeaturesPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-primary selection:text-white">
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
                            <Link href="/about" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors">{t('nav.about')}</Link>
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
                <section className="py-24 bg-white border-b">
                    <div className="container mx-auto px-4 text-center max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase mb-6">
                            Our Capabilities
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 mb-8 leading-[0.9]">
                            Everything you need, <br /><span className="gradient-text">Completely Free.</span>
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                            {t('featuresPage.subtitle')}
                        </p>
                    </div>
                </section>

                {/* Detailed Features Grid */}
                <section className="py-24">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12">
                            <FeatureCardDetail
                                icon={<FileText className="h-10 w-10" />}
                                title={t('features.resume.title')}
                                description={t('featuresPage.resume.detail')}
                                features={['ATS Optimization', 'AI Tailoring', 'Skill Gap Analysis', 'Template Variety']}
                                color="indigo"
                            />
                            <FeatureCardDetail
                                icon={<MessageSquare className="h-10 w-10" />}
                                title={t('features.interview.title')}
                                description={t('featuresPage.interview.detail')}
                                features={['Voice Enabled', 'Role Specific', 'Detailed Scoring', 'Model Answers']}
                                color="violet"
                            />
                            <FeatureCardDetail
                                icon={<Zap className="h-10 w-10" />}
                                title={t('features.jobs.title')}
                                description={t('featuresPage.jobs.detail')}
                                features={['Multi-source Search', 'Location Filters', 'Application Tracking', 'Sync Across Devices']}
                                color="amber"
                            />
                            <FeatureCardDetail
                                icon={<TrendingUp className="h-10 w-10" />}
                                title={t('features.research.title')}
                                description={t('featuresPage.research.detail')}
                                features={['Company Insights', 'Salary Benchmarks', 'Skill Trends', 'AI Summaries']}
                                color="emerald"
                            />
                        </div>
                    </div>
                </section>

                {/* Security & Reliability */}
                <section className="py-24 bg-slate-900 text-white rounded-[4rem] mx-4 mb-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black tracking-tight mb-4 text-white">Privacy & Security First</h2>
                            <p className="text-slate-400">Your data belongs to you. We just help you use it better.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700">
                                <ShieldCheck className="h-8 w-8 text-primary mb-4" />
                                <h3 className="text-xl font-bold mb-2">Secure Authentication</h3>
                                <p className="text-sm text-slate-400">Powered by Supabase with optional 2FA and secure OAuth providers.</p>
                            </div>
                            <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700">
                                <Fingerprint className="h-8 w-8 text-primary mb-4" />
                                <h3 className="text-xl font-bold mb-2">Private Data</h3>
                                <p className="text-sm text-slate-400">Your resumes and interview data are encrypted and never sold to third parties.</p>
                            </div>
                            <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700">
                                <Globe className="h-8 w-8 text-primary mb-4" />
                                <h3 className="text-xl font-bold mb-2">Local Infrastructure</h3>
                                <p className="text-sm text-slate-400">Optimized for low latency across the Indian subcontinent.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* CTA */}
            <section className="py-24 gradient-bg text-white text-center">
                <h2 className="text-4xl font-black mb-8 px-4">{t('cta.title')}</h2>
                <Link href="/auth/signup">
                    <Button variant="secondary" size="xl" className="h-16 px-10 text-xl rounded-2xl text-primary">
                        {t('cta.button')}
                    </Button>
                </Link>
            </section>

            <footer className="bg-white py-12 border-t">
                <div className="container mx-auto px-4 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
                    {t('footer.copyright')}
                </div>
            </footer>
        </div>
    )
}

function FeatureCardDetail({
    icon,
    title,
    description,
    features,
    color
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    color: string;
}) {
    return (
        <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group">
            <div className={`p-4 rounded-3xl bg-${color}-50 text-${color}-600 w-fit mb-8 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h2 className="text-3xl font-black mb-6 tracking-tight text-slate-900">{title}</h2>
            <p className="text-slate-600 leading-relaxed mb-8">
                {description}
            </p>
            <div className="grid grid-cols-2 gap-4">
                {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <div className={`h-2 w-2 rounded-full bg-${color}-500`}></div>
                        {f}
                    </div>
                ))}
            </div>
        </div>
    )
}
