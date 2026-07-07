'use client'

import { FeatureComingSoon } from '@/components/feature-coming-soon'
import { useLanguage } from '@/lib/i18n/context'

export default function InterviewPage() {
  const { t } = useLanguage()
  return (
    <FeatureComingSoon
      featureName={t('home.roadmap.interview')}
      summary={t('comingSoon.interview.summary')}
      details={[
        t('comingSoon.interview.detail1'),
        t('comingSoon.interview.detail2'),
        t('comingSoon.detail.resumeLive'),
      ]}
    />
  )
}
