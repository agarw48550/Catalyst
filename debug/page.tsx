import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bug, Activity, Database, Zap, Users, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Debug Dashboard - Catalyst',
  description: 'Developer and admin debugging tools',
}

export default function DebugDashboard() {
  // Check if debug dashboard is enabled
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG_DASHBOARD === 'true'

  if (!isEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Debug dashboard is disabled in this environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Debug Dashboard</span>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Developer & Admin Tools</h1>
          <p className="text-muted-foreground">
            Monitor API health, fallbacks, logs, and system diagnostics
          </p>
        </div>

        {/* Debug Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DebugCard
            title="API Logs"
            description="View detailed logs of all API calls, errors, and fallback events"
            icon={<Activity className="h-8 w-8 text-primary" />}
            href="/debug/api-logs"
          />
          <DebugCard
            title="Fallback Tracker"
            description="Monitor API fallback usage and success rates"
            icon={<Zap className="h-8 w-8 text-primary" />}
            href="/debug/fallbacks"
          />
          <DebugCard
            title="Database Health"
            description="Check Supabase connection and query performance"
            icon={<Database className="h-8 w-8 text-primary" />}
            href="/debug/database"
          />
          <DebugCard
            title="API Health"
            description="Test connectivity to Gemini, job APIs, and email services"
            icon={<Activity className="h-8 w-8 text-primary" />}
            href="/debug/api-health"
          />
          <DebugCard
            title="User Impersonation"
            description="Impersonate users for debugging and support"
            icon={<Users className="h-8 w-8 text-primary" />}
            href="/debug/impersonate"
          />
          <DebugCard
            title="Test Harness"
            description="Test all AI models and API integrations"
            icon={<Zap className="h-8 w-8 text-primary" />}
            href="/debug/test-harness"
          />
        </div>

        {/* System Status */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current environment and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatusItem
                  label="Environment"
                  value={process.env.NODE_ENV || 'development'}
                  status="info"
                />
                <StatusItem
                  label="Debug Dashboard"
                  value={isEnabled ? 'Enabled' : 'Disabled'}
                  status={isEnabled ? 'success' : 'warning'}
                />
                <StatusItem
                  label="API Logging"
                  value={process.env.ENABLE_API_LOGGING === 'true' ? 'Enabled' : 'Disabled'}
                  status={process.env.ENABLE_API_LOGGING === 'true' ? 'success' : 'warning'}
                />
                <StatusItem
                  label="Supabase"
                  value={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not Configured'}
                  status={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'success' : 'error'}
                />
                <StatusItem
                  label="Gemini API"
                  value={process.env.GEMINI_API_KEY ? 'Configured' : 'Not Configured'}
                  status={process.env.GEMINI_API_KEY ? 'success' : 'error'}
                />
                <StatusItem
                  label="Email Service"
                  value={
                    process.env.MAILGUN_API_KEY || process.env.RESEND_API_KEY
                      ? 'Configured'
                      : 'Not Configured'
                  }
                  status={
                    process.env.MAILGUN_API_KEY || process.env.RESEND_API_KEY ? 'success' : 'warning'
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function DebugCard({
  title,
  description,
  icon,
  href,
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}) {
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

function StatusItem({
  label,
  value,
  status,
}: {
  label: string
  value: string
  status: 'success' | 'warning' | 'error' | 'info'
}) {
  const statusColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  }

  return (
    <div className="flex flex-col space-y-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-medium ${statusColors[status]}`}>{value}</span>
    </div>
  )
}
