import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Career Research - Catalyst',
}

export default function ResearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Career Research</h1>
        <p className="text-muted-foreground">
          Get AI-powered insights on industries, trends, and opportunities
        </p>
      </div>

      <Card>
        <CardHeader>
          <TrendingUp className="h-12 w-12 text-primary mb-4" />
          <CardTitle>AI Career Research Assistant</CardTitle>
          <CardDescription>
            Feature coming soon - Powered by Gemini AI for career insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Industry trends and analysis</li>
            <li>Skill demand insights</li>
            <li>Career path recommendations</li>
            <li>Salary benchmarking</li>
            <li>Company research</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
