'use client'

import { useRef, useState } from 'react'
import { Download, FileText, Upload, X } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { LoadingBar } from '@/components/ui/loading-bar'
import { generateResumePdfHtml } from '@/lib/resume-pdf'

interface TailorResult {
  tailoredResume: string
  atsScore: number
  matchedSkills: string[]
  missingSkills: string[]
  suggestions: string[]
  summary: string
}

export default function ResumePage() {
  const [resumeText, setResumeText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TailorResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePdfUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF resume.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('PDF must be under 5MB.')
      return
    }

    setPdfLoading(true)
    setError(null)
    setPdfFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume/parse-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to parse PDF.')
      }

      const payload = await response.json()
      setResumeText(payload.text)
    } catch (uploadError: any) {
      setError(uploadError.message || 'Failed to parse PDF.')
      setPdfFileName(null)
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobTitle, company, jobDescription }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to tailor resume.')
      }

      const payload = await response.json()
      setResult(payload)

      const nextCount = parseInt(localStorage.getItem('catalyst_resume_count') || '0', 10) + 1
      localStorage.setItem('catalyst_resume_count', String(nextCount))
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to tailor resume.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result.tailoredResume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function clearUploadedPdf() {
    setPdfFileName(null)
    setResumeText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleDownloadPdf() {
    if (!result) return

    const html = generateResumePdfHtml({
      tailoredResume: result.tailoredResume,
      atsScore: result.atsScore,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      summary: result.summary,
      jobTitle,
      company,
    })

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-primary selection:text-white">
      <AppHeader />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <FileText className="h-3.5 w-3.5" />
              Live Workflow
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Resume Builder
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Paste your resume and a job description, or upload a PDF resume, to generate a cleaner
              ATS-focused draft with matched skills, missing skills, and revision suggestions.
            </p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Before you start</CardTitle>
              <CardDescription>This workflow is optimized for targeted tailoring, not full resume authoring from scratch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <p>Upload a PDF under 5MB or paste plain resume text.</p>
              <p>Add the exact job description for the best results.</p>
              <p>Review the output before using it in applications.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Your Inputs</CardTitle>
              <CardDescription>Provide your current resume content and the role you want to target.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="resumeText">Your Resume</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pdfLoading}
                    >
                      <Upload className="h-4 w-4" />
                      {pdfLoading ? 'Parsing PDF...' : 'Upload PDF'}
                    </Button>

                    {pdfFileName && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                        <FileText className="h-3 w-3" />
                        {pdfFileName}
                        <button type="button" onClick={clearUploadedPdf} aria-label="Remove uploaded PDF">
                          <X className="h-3 w-3 hover:text-destructive" />
                        </button>
                      </span>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />

                  <textarea
                    id="resumeText"
                    className="min-h-[220px] w-full resize-y rounded-md border bg-background p-3 text-sm"
                    placeholder="Paste your resume text here, or upload a PDF above."
                    value={resumeText}
                    onChange={(event) => setResumeText(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Product Analyst"
                    value={jobTitle}
                    onChange={(event) => setJobTitle(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company (optional)</Label>
                  <Input
                    id="company"
                    placeholder="e.g. Razorpay"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <textarea
                    id="jobDescription"
                    className="min-h-[180px] w-full resize-y rounded-md border bg-background p-3 text-sm"
                    placeholder="Paste the target job description here."
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}

                <Button type="submit" className="w-full font-bold" disabled={loading}>
                  {loading ? 'Tailoring Resume...' : 'Tailor My Resume'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {loading && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Tailoring your resume</CardTitle>
                  <CardDescription>The AI is comparing your resume against the target role.</CardDescription>
                </CardHeader>
                <CardContent>
                  <LoadingBar
                    active={loading}
                    estimatedTime={20}
                    label="Analyzing your resume, extracting key requirements, and drafting a tailored version..."
                  />
                </CardContent>
              </Card>
            )}

            {result && !loading && (
              <>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>ATS Score</CardTitle>
                    <CardDescription>{result.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Progress value={result.atsScore} className="flex-1" />
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{result.atsScore}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Tailored Resume</CardTitle>
                      <CardDescription>Review and refine before using it in an application.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                      {result.tailoredResume}
                    </pre>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm text-green-700 dark:text-green-400">Matched Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm text-orange-700 dark:text-orange-400">Missing Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {result.missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <span className="text-primary">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}

            {!result && !loading && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>What you will get</CardTitle>
                  <CardDescription>A tailored output appears here after you submit the form.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  <p>A concise resume draft aligned to the role you are targeting.</p>
                  <p>An ATS score estimate, matched skills, missing skills, and practical revision suggestions.</p>
                  <p>You can copy the output directly or export it to a printable PDF.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
