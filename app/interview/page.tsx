import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Interview Practice - Catalyst',
}

export default function InterviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Interview Coach</h1>
        <p className="text-muted-foreground">
          Practice interviews with voice-enabled AI and get real-time feedback
        </p>
      </div>

      <Card>
        <CardHeader>
          <MessageSquare className="h-12 w-12 text-primary mb-4" />
          <CardTitle>Voice-Enabled Interview Practice</CardTitle>
          <CardDescription>
            Feature coming soon - Powered by Gemini 2.5 Flash Native Audio Dialog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Full duplex voice conversation</li>
            <li>Real-time AI feedback</li>
            <li>Technical and behavioral interviews</li>
            <li>Live transcript</li>
            <li>Email interview reports</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
