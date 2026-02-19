'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Briefcase, FileText, MessageSquare, TrendingUp, Search, LogOut, LayoutDashboard, Globe } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage, LanguageToggle } from '@/lib/i18n/context'

const navItems = [
    { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { href: '/resume', labelKey: 'nav.resume', icon: FileText },
    { href: '/interview', labelKey: 'nav.interview', icon: MessageSquare },
    { href: '/jobs', labelKey: 'nav.jobs', icon: Search },
    { href: '/research', labelKey: 'nav.research', icon: TrendingUp },
] as const

export function AppHeader() {
    const { signOut } = useAuth()
    const { t } = useLanguage()

    return (
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Catalyst</span>
                    </Link>
                    <nav className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{t(item.labelKey)}</span>
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <LanguageToggle />
                    <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block"></div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={signOut}
                        className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('nav.logout')}</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}
