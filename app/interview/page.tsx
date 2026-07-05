'use client'

import { FeatureComingSoon } from '@/components/feature-coming-soon'

export default function InterviewPage() {
  return (
    <FeatureComingSoon
      featureName="Interview Practice"
      summary="We removed interview practice from the production dashboard while we simplify and harden the core product experience. It will return only after the workflow is ready for a reliable public launch."
      details={[
        'Role-specific interview prompts and scoring are being reworked for a cleaner experience.',
        'Voice and written practice flows need another validation pass before they return.',
        'The live product currently focuses on resume tailoring because that path is ready today.',
      ]}
    />
  )
}
