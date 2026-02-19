'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  FileText,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Target,
  Users,
  Search,
  Zap,
  LayoutDashboard,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { AppHeader } from '@/components/app-header'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Zap className="h-8 w-8 animate-pulse text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary selection:text-white">
      <AppHeader />

      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 group">
              {t('dash.welcome')}, <span className="gradient-text">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-slate-500 font-medium">
              {t('dash.subtitle')}
            </p>
          </div>
          <Link href="/resume">
            <Button className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              <Plus className="mr-2 h-5 w-5" /> {t('dash.resumeBuilder')}
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label={t('dash.resumes')} value="12" icon={<FileText className="h-5 w-5" />} color="primary" />
          <StatCard label={t('dash.interviews')} value="8" icon={<MessageSquare className="h-5 w-5" />} color="violet" />
          <StatCard label={t('dash.savedJobs')} value="42" icon={<Target className="h-5 w-5" />} color="orange" />
          <StatCard label={t('dash.profileViews')} value="1.2k" icon={<ArrowUpRight className="h-5 w-5" />} color="emerald" />
        </div>

        {/* Grid of Tools */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardToolCard
            title={t('dash.resumeBuilder')}
            description={t('dash.resumeDesc')}
            icon={<FileText className="h-8 w-8" />}
            href="/resume"
            color="indigo"
          />
          <DashboardToolCard
            title={t('dash.interviewPractice')}
            description={t('dash.interviewDesc')}
            icon={<MessageSquare className="h-8 w-8" />}
            href="/interview"
            color="violet"
          />
          <DashboardToolCard
            title={t('dash.jobSearch')}
            description={t('dash.jobDesc')}
            icon={<Search className="h-8 w-8" />}
            href="/jobs"
            color="amber"
          />
          <DashboardToolCard
            title={t('dash.careerResearch')}
            description={t('dash.researchDesc')}
            icon={<TrendingUp className="h-8 w-8" />}
            href="/research"
            color="emerald"
          />
          <DashboardToolCard
            title={t('dash.analytics')}
            description={t('dash.analyticsDesc')}
            icon={<LayoutDashboard className="h-8 w-8" />}
            href="/analytics"
            color="blue"
            beta
          />
          <DashboardToolCard
            title={t('dash.settings')}
            description={t('dash.settingsDesc')}
            icon={<Settings className="h-8 w-8" />}
            href="/settings"
            color="slate"
          />
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    violet: 'bg-violet-100 text-violet-600',
    orange: 'bg-orange-100 text-orange-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden rounded-3xl hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-xl ${colorMap[color] || colorMap.primary}`}>
            {icon}
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-3xl font-black text-slate-900">{value}</div>
      </CardContent>
    </Card>
  )
}

function DashboardToolCard({
  title,
  description,
  icon,
  href,
  color,
  beta = false
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  beta?: boolean;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    slate: 'bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white',
  }

  return (
    <Link href={href}>
      <Card className="h-full border-0 shadow-sm overflow-hidden rounded-3xl group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl transition-all duration-500 ${colorMap[color] || colorMap.indigo}`}>
              {icon}
            </div>
            {beta && (
              <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white rounded-lg">BETA</span>
            )}
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{description}</p>
          <div className="flex items-center text-xs font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
            Open Tool <ChevronRight className="ml-1 h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
