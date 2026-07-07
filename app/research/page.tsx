'use client'

import { FeatureComingSoon } from '@/components/feature-coming-soon'
import { useLanguage } from '@/lib/i18n/context'

export default function ResearchPage() {
  const { t } = useLanguage()
  return (
    <FeatureComingSoon
      featureName={t('home.roadmap.research')}
      summary={t('comingSoon.research.summary')}
      details={[
        t('comingSoon.research.detail1'),
        t('comingSoon.research.detail2'),
        t('comingSoon.detail.resumeLive'),
      ]}
    />
  )
}
