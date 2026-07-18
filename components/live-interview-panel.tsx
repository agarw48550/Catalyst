'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { VoiceInterview } from '@/components/voice-interview'
import { LANG_CYCLE, LANG_LABELS, useLanguage } from '@/lib/i18n/context'
import { INTERVIEW_DURATION_MINUTES, INTERVIEW_QUESTION_COUNT } from '@/lib/interview/prompts'
import type { InterviewDifficulty, ResumeOutputLanguage } from '@/lib/validations'
import type { TranslationKey } from '@/lib/i18n/translations'
import { Clock, MessageCircleQuestion } from 'lucide-react'

interface LiveInterviewPanelProps {
  applicationId: string
  jobTitle: string
  company: string
  defaultLanguage?: ResumeOutputLanguage
}

const DIFFICULTY_OPTIONS: { value: InterviewDifficulty; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { value: 'easy', labelKey: 'apps.difficultyEasy', descKey: 'apps.difficultyEasyDesc' },
  { value: 'normal', labelKey: 'apps.difficultyNormal', descKey: 'apps.difficultyNormalDesc' },
  { value: 'hard', labelKey: 'apps.difficultyHard', descKey: 'apps.difficultyHardDesc' },
]

export function LiveInterviewPanel({
  applicationId,
  jobTitle,
  company,
  defaultLanguage = 'en',
}: LiveInterviewPanelProps) {
  const { t } = useLanguage()
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('normal')
  const [language, setLanguage] = useState<ResumeOutputLanguage>(defaultLanguage)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    setLanguage(defaultLanguage)
  }, [defaultLanguage])

  const duration = INTERVIEW_DURATION_MINUTES[difficulty]
  const questionCount = INTERVIEW_QUESTION_COUNT[difficulty]

  if (started) {
    return (
      <VoiceInterview
        applicationId={applicationId}
        jobRole={jobTitle}
        company={company}
        difficulty={difficulty}
        language={language}
        onComplete={() => setStarted(false)}
      />
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>{t('apps.interviewTab')}</CardTitle>
        <CardDescription>{t('apps.interviewTabDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {t('apps.interviewDuration')}
            </div>
            <p className="mt-1 text-lg font-semibold">
              {duration.min}–{duration.max} {t('apps.interviewMinutes')}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircleQuestion className="h-4 w-4" />
              {t('apps.interviewQuestions')}
            </div>
            <p className="mt-1 text-lg font-semibold">
              {questionCount} {t('apps.interviewQuestionsCount')}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t('apps.interviewAdjusting')}</p>

        <div className="space-y-2">
          <Label htmlFor="interviewLanguage">{t('apps.aiLanguageLabel')}</Label>
          <select
            id="interviewLanguage"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value as ResumeOutputLanguage)}
          >
            {LANG_CYCLE.map((code) => (
              <option key={code} value={code}>{LANG_LABELS[code]}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{t('apps.aiLanguageHint')}</p>
        </div>

        <div className="space-y-3">
          <Label>{t('apps.difficultyLabel')}</Label>
          <div className="space-y-3">
            {DIFFICULTY_OPTIONS.map(({ value, labelKey, descKey }) => {
              const d = INTERVIEW_DURATION_MINUTES[value]
              const q = INTERVIEW_QUESTION_COUNT[value]
              return (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${difficulty === value ? 'border-primary bg-primary/5' : ''}`}
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={value}
                    checked={difficulty === value}
                    onChange={() => setDifficulty(value)}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-semibold">{t(labelKey)}</span>
                    <p className="text-sm text-muted-foreground">{t(descKey)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~{d.min}–{d.max} {t('apps.interviewMinutes')} · {q} {t('apps.interviewQuestionsCount')}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t('apps.interviewStartHint')}</p>

        <button
          type="button"
          onClick={() => setStarted(true)}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/90"
        >
          {t('apps.startInterview')}
        </button>
      </CardContent>
    </Card>
  )
}
