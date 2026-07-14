'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { VoiceInterview } from '@/components/voice-interview'
import { useLanguage } from '@/lib/i18n/context'
import type { InterviewDifficulty } from '@/lib/validations'

interface LiveInterviewPanelProps {
  applicationId: string
  jobTitle: string
  company: string
}

import type { TranslationKey } from '@/lib/i18n/translations'

const DIFFICULTY_OPTIONS: { value: InterviewDifficulty; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { value: 'easy', labelKey: 'apps.difficultyEasy', descKey: 'apps.difficultyEasyDesc' },
  { value: 'normal', labelKey: 'apps.difficultyNormal', descKey: 'apps.difficultyNormalDesc' },
  { value: 'hard', labelKey: 'apps.difficultyHard', descKey: 'apps.difficultyHardDesc' },
]

export function LiveInterviewPanel({ applicationId, jobTitle, company }: LiveInterviewPanelProps) {
  const { t } = useLanguage()
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('normal')
  const [started, setStarted] = useState(false)

  if (started) {
    return (
      <VoiceInterview
        applicationId={applicationId}
        jobRole={jobTitle}
        company={company}
        difficulty={difficulty}
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
        <div className="space-y-3">
          <Label>{t('apps.difficultyLabel')}</Label>
          <div className="space-y-3">
            {DIFFICULTY_OPTIONS.map(({ value, labelKey, descKey }) => (
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
                </div>
              </label>
            ))}
          </div>
        </div>

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
