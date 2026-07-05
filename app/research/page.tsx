'use client'

import { FeatureComingSoon } from '@/components/feature-coming-soon'

export default function ResearchPage() {
  return (
    <FeatureComingSoon
      featureName="Career Research"
      summary="Career research is on the roadmap, but it is not being offered as a production feature yet. We removed the live workflow so the current release stays focused, accurate, and supportable."
      details={[
        'The research experience needs stronger source grounding before it returns.',
        'We are redesigning the output so advice is easier to verify and act on.',
        'Today’s launch keeps the product centered on resume tailoring and ATS guidance.',
      ]}
    />
  )
}
