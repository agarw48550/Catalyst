'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { JobApplicationForm } from '@/components/job-application-form'
import { useLanguage } from '@/lib/i18n/context'

export default function NewApplicationPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main id="main-content" className="container mx-auto max-w-2xl px-4 py-12">
        <Button asChild variant="ghost" className="mb-6 gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            {t('apps.backToDashboard')}
          </Link>
        </Button>

        <JobApplicationForm />
      </main>
    </div>
  )
}
