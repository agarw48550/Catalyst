'use client'

import { FeatureComingSoon } from '@/components/feature-coming-soon'
import { useLanguage } from '@/lib/i18n/context'

export default function SettingsPage() {
  const { t } = useLanguage()
  return (
    <FeatureComingSoon
      featureName={t('dash.settings')}
      summary={t('comingSoon.settings.summary')}
      details={[
        t('comingSoon.settings.detail1'),
        t('comingSoon.settings.detail2'),
        t('comingSoon.detail.resumeLive'),
      ]}
    />
  )
}
