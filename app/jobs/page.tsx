'use client'

import { FeatureComingSoon } from '@/components/feature-coming-soon'

export default function JobsPage() {
  return (
    <FeatureComingSoon
      featureName="Job Search"
      summary="Job discovery is not part of the production release right now. We pulled it from the live dashboard so the public product only exposes the workflow that is ready to support end to end."
      details={[
        'Search quality and source coverage need another production pass before launch.',
        'Saved-job and cross-feature flows were removed from the live product for now.',
        'Resume Builder remains the active workflow while the broader roadmap is refined.',
      ]}
    />
  )
}
