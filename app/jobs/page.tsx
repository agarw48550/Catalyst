import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Job Search - Catalyst',
}

export default function JobsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Job Search</h1>
        <p className="text-muted-foreground">
          Find jobs from NCS, Jooble, and Adzuna in one place
        </p>
      </div>

      <Card>
        <CardHeader>
          <Briefcase className="h-12 w-12 text-primary mb-4" />
          <CardTitle>Aggregated Job Search</CardTitle>
          <CardDescription>
            Feature coming soon - Search jobs from multiple sources with smart failover
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Search NCS, Jooble, and Adzuna</li>
            <li>Smart fallover when APIs fail</li>
            <li>AI-powered job matching</li>
            <li>Save and track applications</li>
            <li>Job alerts and notifications</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
