'use client'

import { FeatureComingSoon } from '@/components/feature-coming-soon'
import { useLanguage } from '@/lib/i18n/context'

export default function JobsPage() {
  const { t } = useLanguage()
  return (
    <FeatureComingSoon
      featureName={t('home.roadmap.jobs')}
      summary={t('comingSoon.jobs.summary')}
      details={[
        t('comingSoon.jobs.detail1'),
        t('comingSoon.jobs.detail2'),
        t('comingSoon.detail.resumeLive'),
      ]}
    />
  )
}
