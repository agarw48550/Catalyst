'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, MessageSquare, Briefcase, TrendingUp, BarChart3, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const [stats, setStats] = useState({ resumes: 0, interviews: 0, savedJobs: 0 })

  useEffect(() => {
    if (!user) return
    const supabase = getSupabaseBrowserClient()
    async function fetchStats() {
      const [resumesResult, interviewsResult, savedJobsResult] = await Promise.all([
        supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('interview_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('saved_jobs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      ])
      setStats({
        resumes: resumesResult.count ?? 0,
        interviews: interviewsResult.count ?? 0,
        savedJobs: savedJobsResult.count ?? 0,
      })
    }
    fetchStats()
  }, [user])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Catalyst</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{user?.email ? `, ${user.email}` : ''}!
          </h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your career journey</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Resumes" value={String(stats.resumes)} icon={<FileText className="h-5 w-5" />} />
          <StatCard title="Interviews" value={String(stats.interviews)} icon={<MessageSquare className="h-5 w-5" />} />
          <StatCard title="Saved Jobs" value={String(stats.savedJobs)} icon={<Briefcase className="h-5 w-5" />} />
          <StatCard title="Profile Views" value="0" icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard title="Resume Builder" description="Create and optimize your resume with AI-powered suggestions" icon={<FileText className="h-8 w-8 text-primary" />} href="/resume" />
          <ActionCard title="Interview Practice" description="Practice with our AI interviewer and get real-time feedback" icon={<MessageSquare className="h-8 w-8 text-primary" />} href="/interview" />
          <ActionCard title="Job Search" description="Find jobs from top Indian job boards in one place" icon={<Briefcase className="h-8 w-8 text-primary" />} href="/jobs" />
          <ActionCard title="Career Research" description="Get AI-powered insights on industries and career paths" icon={<TrendingUp className="h-8 w-8 text-primary" />} href="/research" />
          <ActionCard title="Analytics" description="Track your progress and optimize your job search" icon={<BarChart3 className="h-8 w-8 text-primary" />} href="/analytics" />
          <ActionCard title="Settings" description="Manage your profile, preferences, and integrations" icon={<Settings className="h-8 w-8 text-primary" />} href="/settings" />
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function ActionCard({ title, description, icon, href }: { title: string; description: string; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="mb-2">{icon}</div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
