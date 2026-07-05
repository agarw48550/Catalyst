'use client'

import { FeatureComingSoon } from '@/components/feature-coming-soon'

export default function SettingsPage() {
  return (
    <FeatureComingSoon
      featureName="Account Settings"
      summary="The custom settings page has been removed from the production dashboard while account management is cleaned up. The only supported account controls in the live product are the ones provided by Clerk."
      details={[
        'We are retiring the legacy Supabase-based settings workflow from the public surface.',
        'Future settings pages will only return once they match the live authentication setup.',
        'For now, resume tailoring stays as the only active in-app workflow beyond Clerk account controls.',
      ]}
    />
  )
}
