'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

interface ResumeTailorPanelProps {
  applicationId: string
  initialResumeText: string
  jobTitle: string
  company: string
  defaultLanguage?: ResumeOutputLanguage
}

export function ResumeTailorPanel({
  applicationId,
  initialResumeText,
  jobTitle,
  company,
  defaultLanguage,
}: ResumeTailorPanelProps) {
  const { t, lang } = useLanguage()
  const [resumeText, setResumeText] = useState(initialResumeText)
  const [resumeLanguage, setResumeLanguage] = useState<ResumeOutputLanguage>(defaultLanguage || lang)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (defaultLanguage) setResumeLanguage(defaultLanguage)
  }, [defaultLanguage])
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

    setPdfLoading(true)
    setError(null)
    setPdfFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/resume/parse-pdf', { method: 'POST', body: formData })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || t('resume.errorParseFailed'))
      }
      const payload = await response.json()
      const text = payload.text.slice(0, RESUME_INPUT_MAX_CHARS)
      setResumeText(text)

      await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text }),
      })
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : t('resume.errorParseFailed'))
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
        body: JSON.stringify({
          resumeText,
          resumeLanguage,
          applicationId,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || t('resume.errorTailorFailed'))
      }

      setResult(await response.json())
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t('resume.errorTailorFailed'))
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
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>{t('apps.resumeTab')}</CardTitle>
          <CardDescription>{t('apps.resumeTabDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>{t('apps.optionalResume')}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={pdfLoading}>
                  <Upload className="h-4 w-4" />
                  {pdfLoading ? t('resume.parsingPdf') : t('resume.uploadPdf')}
                </Button>
                {pdfFileName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    <FileText className="h-3 w-3" />{pdfFileName}
                    <button type="button" onClick={() => { setPdfFileName(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
              <p className="text-xs text-muted-foreground">{t('apps.resumeAlreadyUploaded')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumeLanguage">{t('apps.aiLanguageLabel')}</Label>
              <select
                id="resumeLanguage"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={resumeLanguage}
                onChange={(e) => setResumeLanguage(e.target.value as ResumeOutputLanguage)}
              >
                {LANG_CYCLE.map((code) => (
                  <option key={code} value={code}>{LANG_LABELS[code]}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{t('apps.aiLanguageHint')}</p>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="w-full font-bold" disabled={loading || !resumeText}>
              {loading ? t('resume.loading') : t('resume.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading && (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <LoadingBar active estimatedTime={20} label={t('resume.tailoringLabel')} />
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
                  <span className="text-2xl font-black">{result.atsScore}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('resume.tailoredTitle')}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />{t('resume.pdfButton')}
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
          </>
        )}

        {!result && !loading && (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              <p>{t('apps.resumeEmpty')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
