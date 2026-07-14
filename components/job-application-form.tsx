'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingBar } from '@/components/ui/loading-bar'
import { RESUME_INPUT_MAX_CHARS, type JobApplicationLanguage } from '@/lib/validations'
import { LANG_CYCLE, LANG_LABELS, useLanguage } from '@/lib/i18n/context'

interface JobApplicationFormProps {
  onSuccess?: (applicationId: string) => void
}

export function JobApplicationForm({ onSuccess }: JobApplicationFormProps) {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [language, setLanguage] = useState<JobApplicationLanguage>(lang)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [researching, setResearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const response = await fetch('/api/resume/parse-pdf', { method: 'POST', body: formData })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || t('resume.errorParseFailed'))
      }
      const payload = await response.json()
      setResumeText(payload.text.slice(0, RESUME_INPUT_MAX_CHARS))
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : t('resume.errorParseFailed'))
      setPdfFileName(null)
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const createRes = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, jobDescription, resumeText, language }),
      })

      if (!createRes.ok) {
        const payload = await createRes.json()
        throw new Error(payload.error || t('apps.createError'))
      }

      const { application } = await createRes.json()
      setSubmitting(false)
      setResearching(true)

      const researchRes = await fetch(`/api/applications/${application.id}/research`, {
        method: 'POST',
      })

      if (!researchRes.ok) {
        const payload = await researchRes.json()
        throw new Error(payload.error || t('apps.researchError'))
      }

      if (onSuccess) {
        onSuccess(application.id)
      } else {
        router.push(`/applications/${application.id}`)
      }
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : t('apps.createError'))
      setSubmitting(false)
      setResearching(false)
    }
  }

  const isLoading = submitting || researching

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>{t('apps.createTitle')}</CardTitle>
        <CardDescription>{t('apps.createDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {researching && (
          <div className="mb-6">
            <LoadingBar active estimatedTime={30} label={t('apps.researchingLabel')} />
            <p className="mt-2 text-sm text-muted-foreground">{t('apps.researchingDesc')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>{t('resume.inputLabel')} *</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={pdfLoading || isLoading}
              >
                <Upload className="h-4 w-4" />
                {pdfLoading ? t('resume.parsingPdf') : t('resume.uploadPdf')}
              </Button>
              {pdfFileName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {pdfFileName}
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFileName(null)
                      setResumeText('')
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    aria-label={t('resume.removePdf')}
                  >
                    <X className="h-3 w-3 hover:text-destructive" />
                  </button>
                </span>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
            {pdfLoading && <LoadingBar active estimatedTime={4} label={t('resume.parsingLabel')} />}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">{t('resume.jobTitle')} *</Label>
              <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">{t('resume.company')} *</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">{t('apps.interviewLanguage')}</Label>
            <select
              id="language"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value as JobApplicationLanguage)}
              disabled={isLoading}
            >
              {LANG_CYCLE.map((code) => (
                <option key={code} value={code}>{LANG_LABELS[code]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">{t('resume.jdLabel')} *</Label>
            <textarea
              id="jobDescription"
              className="min-h-[180px] w-full resize-y rounded-md border bg-background p-3 text-sm"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              maxLength={RESUME_INPUT_MAX_CHARS}
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <Button type="submit" className="w-full font-bold" disabled={isLoading || !resumeText}>
            {isLoading ? t('apps.creating') : t('apps.createSubmit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
