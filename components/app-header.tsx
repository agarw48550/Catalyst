'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Briefcase, FileText, MessageSquare, TrendingUp, Search, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/resume', label: 'Resume', icon: FileText },
    { href: '/interview', label: 'Interview', icon: MessageSquare },
    { href: '/jobs', label: 'Jobs', icon: Search },
    { href: '/research', label: 'Research', icon: TrendingUp },
]

export function AppHeader() {
    const pathname = usePathname()
    const { signOut } = useAuth()

    return (
        <header className="border-b bg-background sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <span className="text-lg font-bold hidden sm:inline">Catalyst</span>
                    </Link>
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link key={item.href} href={item.href}>
                                    <Button
                                        variant={isActive ? 'default' : 'ghost'}
                                        size="sm"
                                        className="gap-1.5"
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span className="hidden md:inline">{item.label}</span>
                                    </Button>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
        </header>
    )
}
