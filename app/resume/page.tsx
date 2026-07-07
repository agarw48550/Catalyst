'use client'

import { useRef, useState } from 'react'
import { Download, FileText, HelpCircle, Upload, X } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { LoadingBar } from '@/components/ui/loading-bar'
import { generateResumePdfHtml } from '@/lib/resume-pdf'
import { RESUME_INPUT_MAX_CHARS, type ResumeOutputLanguage } from '@/lib/validations'
import { LANG_CYCLE, LANG_LABELS, useLanguage } from '@/lib/i18n/context'

interface TailorResult {
  tailoredResume: string
  atsScore: number
  matchedSkills: string[]
  missingSkills: string[]
  suggestions: string[]
  summary: string
}

export default function ResumePage() {
  const { t, lang } = useLanguage()
  const [resumeText, setResumeText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeLanguage, setResumeLanguage] = useState<ResumeOutputLanguage>(lang)
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
      setError(t('resume.errorNonPdf'))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('resume.errorTooLarge'))
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
        throw new Error(payload.error || t('resume.errorParseFailed'))
      }

      const payload = await response.json()
      setResumeText(payload.text.slice(0, RESUME_INPUT_MAX_CHARS))
    } catch (uploadError: any) {
      setError(uploadError.message || t('resume.errorParseFailed'))
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
        body: JSON.stringify({ resumeText, jobTitle, company, jobDescription, resumeLanguage }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || t('resume.errorTailorFailed'))
      }

      const payload = await response.json()
      setResult(payload)

      const nextCount = parseInt(localStorage.getItem('catalyst_resume_count') || '0', 10) + 1
      localStorage.setItem('catalyst_resume_count', String(nextCount))
    } catch (submitError: any) {
      setError(submitError.message || t('resume.errorTailorFailed'))
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
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <AppHeader />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t('common.liveNow')}
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground">
              {t('dash.resumeBuilder')}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {t('resume.pageDesc')}
            </p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>{t('resume.before.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>{t('resume.before.bullet1')}</p>
              <p>{t('resume.before.bullet2')}</p>
              <p>{t('resume.before.bullet3')}</p>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-border p-3">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{t('resume.atsInfo.title')}</p>
                  <p className="mt-1">{t('resume.atsInfo.desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>{t('resume.inputs.title')}</CardTitle>
              <CardDescription>{t('resume.inputs.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="resumeText">{t('resume.inputLabel')}</Label>
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
                      {pdfLoading ? t('resume.parsingPdf') : t('resume.uploadPdf')}
                    </Button>

                    {pdfFileName && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {pdfFileName}
                        <button type="button" onClick={clearUploadedPdf} aria-label={t('resume.removePdf')}>
                          <X className="h-3 w-3 hover:text-destructive" />
                        </button>
                      </span>
                    )}
                  </div>

                  {pdfLoading && (
                    <LoadingBar active={pdfLoading} estimatedTime={4} label={t('resume.parsingLabel')} />
                  )}

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
                    placeholder={t('resume.resumePlaceholder')}
                    value={resumeText}
                    onChange={(event) => setResumeText(event.target.value)}
                    maxLength={RESUME_INPUT_MAX_CHARS}
                    required
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {resumeText.length} / {RESUME_INPUT_MAX_CHARS}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">{t('resume.jobTitle')}</Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g. Product Analyst"
                      value={jobTitle}
                      onChange={(event) => setJobTitle(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">{t('resume.company')}</Label>
                    <Input
                      id="company"
                      placeholder="e.g. Razorpay"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resumeLanguage">{t('resume.outputLanguage')}</Label>
                  <select
                    id="resumeLanguage"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={resumeLanguage}
                    onChange={(event) => setResumeLanguage(event.target.value as ResumeOutputLanguage)}
                  >
                    {LANG_CYCLE.map((code) => (
                      <option key={code} value={code}>
                        {LANG_LABELS[code]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription">{t('resume.jdLabel')}</Label>
                  <textarea
                    id="jobDescription"
                    className="min-h-[180px] w-full resize-y rounded-md border bg-background p-3 text-sm"
                    placeholder={t('resume.jdPlaceholder')}
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    maxLength={RESUME_INPUT_MAX_CHARS}
                    required
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {jobDescription.length} / {RESUME_INPUT_MAX_CHARS}
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}

                <Button type="submit" className="w-full font-bold" disabled={loading}>
                  {loading ? t('resume.loading') : t('resume.submit')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {loading && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>{t('resume.tailoringTitle')}</CardTitle>
                  <CardDescription>{t('resume.tailoringDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <LoadingBar active={loading} estimatedTime={20} label={t('resume.tailoringLabel')} />
                </CardContent>
              </Card>
            )}

            {result && !loading && (
              <>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>{t('resume.atsScoreTitle')}</CardTitle>
                    <CardDescription>{result.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Progress value={result.atsScore} className="flex-1" />
                      <span className="text-2xl font-black text-foreground">{result.atsScore}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{t('resume.tailoredTitle')}</CardTitle>
                      <CardDescription>{t('resume.tailoredDesc')}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        {t('resume.pdfButton')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? t('resume.copiedButton') : t('resume.copyButton')}
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
                      <CardTitle className="text-sm text-green-700 dark:text-green-400">{t('resume.matchedSkills')}</CardTitle>
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
                      <CardTitle className="text-sm text-orange-700 dark:text-orange-400">{t('resume.missingSkills')}</CardTitle>
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
                    <CardTitle>{t('resume.suggestionsTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex gap-2 text-sm text-foreground">
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
                  <CardTitle>{t('resume.emptyTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                  <p>{t('resume.emptyBullet1')}</p>
                  <p>{t('resume.emptyBullet2')}</p>
                  <p>{t('resume.emptyBullet3')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
