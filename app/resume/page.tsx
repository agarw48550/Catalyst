import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Resume Builder - Catalyst',
}

export default function ResumePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resume Builder</h1>
        <p className="text-muted-foreground">
          Create and optimize your resume with AI-powered suggestions
        </p>
      </div>

      <Card>
        <CardHeader>
          <FileText className="h-12 w-12 text-primary mb-4" />
          <CardTitle>AI-Powered Resume Builder</CardTitle>
          <CardDescription>
            Feature coming soon - Build ATS-optimized resumes with Gemini AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Multiple professional templates</li>
            <li>AI-powered content suggestions</li>
            <li>ATS optimization score</li>
            <li>Export to PDF/DOCX</li>
            <li>Version history</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
