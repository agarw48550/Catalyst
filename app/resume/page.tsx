'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AppHeader } from '@/components/app-header'
import { FileText, Upload, Briefcase, X } from 'lucide-react'

interface TailorResult {
  tailoredResume: string
  atsScore: number
  matchedSkills: string[]
  missingSkills: string[]
  suggestions: string[]
  summary: string
}

interface SavedJob {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary?: string
  url: string
  source: string
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
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [showJobPicker, setShowJobPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load saved jobs from localStorage for import
    try {
      const jobs = JSON.parse(localStorage.getItem('savedJobs') || '[]')
      setSavedJobs(jobs)
    } catch { /* ignore */ }

    // Check if a job was passed via URL params (cross-feature flow)
    const params = new URLSearchParams(window.location.search)
    const importJobId = params.get('importJob')
    if (importJobId) {
      try {
        const jobs: SavedJob[] = JSON.parse(localStorage.getItem('savedJobs') || '[]')
        const job = jobs.find((j) => j.id === importJobId)
        if (job) {
          setJobTitle(job.title)
          setCompany(job.company)
          setJobDescription(job.description)
        }
      } catch { /* ignore */ }
    }
  }, [])

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('PDF must be under 5MB')
      return
    }

    setPdfLoading(true)
    setError(null)
    setPdfFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/resume/parse-pdf', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to parse PDF')
      }
      const data = await res.json()
      setResumeText(data.text)
    } catch (err: any) {
      setError(err.message)
      setPdfFileName(null)
    } finally {
      setPdfLoading(false)
    }
  }

  function importJob(job: SavedJob) {
    setJobTitle(job.title)
    setCompany(job.company)
    setJobDescription(job.description)
    setShowJobPicker(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobTitle, company, jobDescription }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to tailor resume')
      }
      const data = await res.json()
      setResult(data)

      // Track usage
      const count = parseInt(localStorage.getItem('catalyst_resume_count') || '0', 10)
      localStorage.setItem('catalyst_resume_count', (count + 1).toString())
    } catch (err: any) {
      setError(err.message)
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

  return (
    <>
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resume Tailor</h1>
          <p className="text-muted-foreground">Optimize your resume for specific job postings with AI</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Resume Input - Text or PDF */}
                  <div className="space-y-2">
                    <Label>Your Resume</Label>
                    <div className="flex gap-2 mb-2">
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
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {pdfFileName}
                          <button type="button" onClick={() => { setPdfFileName(null); setResumeText('') }}>
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
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
                      id="resume"
                      className="w-full min-h-[200px] p-3 text-sm border rounded-md bg-background resize-y"
                      placeholder="Paste your resume text here, or upload a PDF above..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      required
                    />
                  </div>

                  {/* Job Details with Import */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      {savedJobs.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 h-7"
                          onClick={() => setShowJobPicker(!showJobPicker)}
                        >
                          <Briefcase className="h-3 w-3" />
                          Import from Saved Jobs
                        </Button>
                      )}
                    </div>

                    {showJobPicker && (
                      <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto bg-muted/50">
                        {savedJobs.map((job) => (
                          <button
                            key={job.id}
                            type="button"
                            className="w-full text-left p-2 text-sm rounded hover:bg-primary/10 transition-colors"
                            onClick={() => importJob(job)}
                          >
                            <span className="font-medium">{job.title}</span>
                            <span className="text-muted-foreground"> at {job.company}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <Input
                      id="jobTitle"
                      placeholder="e.g. Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company (optional)</Label>
                    <Input
                      id="company"
                      placeholder="e.g. TCS, Infosys"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobDesc">Job Description</Label>
                    <textarea
                      id="jobDesc"
                      className="w-full min-h-[150px] p-3 text-sm border rounded-md bg-background resize-y"
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Tailoring Resume...' : 'Tailor My Resume'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            {loading && (
              <Card>
                <CardHeader><CardTitle>Tailoring Your Resume...</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">AI is analyzing your resume against the job description. This may take 15-30 seconds.</p>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            )}
            {result && !loading && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>ATS Score</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Progress value={result.atsScore} className="flex-1" />
                      <span className="text-2xl font-bold">{result.atsScore}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{result.summary}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Tailored Resume</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md max-h-64 overflow-y-auto">
                      {result.tailoredResume}
                    </pre>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm text-green-600">Matched Skills</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {result.matchedSkills.map((skill) => (
                          <span key={skill} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">{skill}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm text-orange-600">Missing Skills</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {result.missingSkills.map((skill) => (
                          <span key={skill} className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">{skill}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>Suggestions</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-primary">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
            {!result && !loading && (
              <Card>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  Fill in the form and click &quot;Tailor My Resume&quot; to get started
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
