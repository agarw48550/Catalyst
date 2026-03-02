'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingBar } from '@/components/ui/loading-bar'
import { Briefcase, ExternalLink, BookmarkPlus, FileText, Loader2 } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { useLanguage } from '@/lib/i18n/context'

interface Job {
  id: string; title: string; company: string; location: string
  description: string; salary?: string; postedDate?: string
  url: string; source: string
}

const PAGE_SIZE = 8

export default function JobsPage() {
  const { lang: language } = useLanguage()
  const lang = (language || 'en') as 'en' | 'hi' | 'mr'
  const t = (en: string, hi: string, mr?: string) => lang === 'hi' ? hi : lang === 'mr' ? (mr || hi) : en

  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [source, setSource] = useState<string>('api')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setVisibleCount(PAGE_SIZE)
    try {
      const params = new URLSearchParams({ q: query })
      if (location) params.set('location', location)
      const res = await fetch('/api/jobs/search?' + params)
      const data = await res.json()
      if (!res.ok && !data.jobs) throw new Error(data.error || 'Search failed')
      setJobs(data.jobs || [])
      setSource(data.source || 'api')
      if (data.error && data.jobs?.length === 0) setError(t('Job APIs are temporarily unavailable.', '\u0928\u094c\u0915\u0930\u0940 API \u0905\u0938\u094d\u0925\u093e\u092f\u0940 \u0930\u0942\u092a \u0938\u0947 \u0905\u0928\u0941\u092a\u0932\u092c\u094d\u0927 \u0939\u0948\u0902\u0964'))
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  function saveJob(job: Job) {
    let saved: Job[] = []
    try { saved = JSON.parse(localStorage.getItem('savedJobs') || '[]') } catch { saved = [] }
    if (!savedIds.has(job.id)) {
      saved.push(job)
      localStorage.setItem('savedJobs', JSON.stringify(saved))
      setSavedIds((prev) => new Set([...prev, job.id]))
    }
  }

  const visibleJobs = jobs ? jobs.slice(0, visibleCount) : []
  const hasMore = jobs ? visibleCount < jobs.length : false

  return (
    <>
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('Job Search', '\u0928\u094c\u0915\u0930\u0940 \u0916\u094b\u091c', '\u0928\u094b\u0915\u0930\u0940 \u0936\u094b\u0927')}</h1>
          <p className="text-muted-foreground">{t('Find jobs from NCS, Jooble, and Adzuna in one place', 'NCS, Jooble \u0914\u0930 Adzuna \u0938\u0947 \u090f\u0915 \u091c\u0917\u0939 \u0928\u094c\u0915\u0930\u093f\u092f\u093e\u0901 \u0916\u094b\u091c\u0947\u0902')}</p>
        </div>

        <Card className="mb-8 dark:bg-slate-900/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="query">{t('Job Keywords', '\u0928\u094c\u0915\u0930\u0940 \u0915\u0940\u0935\u0930\u094d\u0921')}</Label>
                <Input id="query" placeholder={t('e.g. Software Engineer, Data Analyst', '\u0909\u0926\u093e. \u0938\u0949\u092b\u094d\u091f\u0935\u0947\u092f\u0930 \u0907\u0902\u091c\u0940\u0928\u093f\u092f\u0930')} value={query} onChange={(e) => setQuery(e.target.value)} required />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="location">{t('Location', '\u0938\u094d\u0925\u093e\u0928', '\u0920\u093f\u0915\u093e\u0923')}</Label>
                <Input id="location" placeholder={t('e.g. Mumbai, Bangalore', '\u0909\u0926\u093e. \u092e\u0941\u0902\u092c\u0908, \u092c\u0902\u0917\u0932\u094c\u0930')} value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('Searching...', '\u0916\u094b\u091c \u0930\u0939\u0947 \u0939\u0948\u0902...')}</> : t('Search', '\u0916\u094b\u091c\u0947\u0902', '\u0936\u094b\u0927\u093e')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
        {loading && <LoadingBar active={loading} estimatedTime={10} label={t('Searching for jobs...', '\u0928\u094c\u0915\u0930\u093f\u092f\u093e\u0901 \u0916\u094b\u091c\u0940 \u091c\u093e \u0930\u0939\u0940 \u0939\u0948\u0902...')} />}

        {jobs !== null && !loading && jobs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t('No jobs found. Try different keywords or location.', '\u0915\u094b\u0908 \u0928\u094c\u0915\u0930\u0940 \u0928\u0939\u0940\u0902 \u092e\u093f\u0932\u0940\u0964 \u0905\u0932\u0917 \u0915\u0940\u0935\u0930\u094d\u0921 \u092f\u093e \u0938\u094d\u0925\u093e\u0928 \u0906\u091c\u093c\u092e\u093e\u090f\u0902\u0964')}
          </div>
        )}

        {jobs !== null && !loading && jobs.length > 0 && (
          <div className="space-y-4">
            {source === 'ai-suggested' && (
              <div className="p-3 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
                {t('These are AI-suggested listings based on your search.', '\u092f\u0947 \u0906\u092a\u0915\u0940 \u0916\u094b\u091c \u0915\u0947 \u0906\u0927\u093e\u0930 \u092a\u0930 AI-\u0938\u0941\u091d\u093e\u0935 \u0939\u0948\u0902\u0964')}
              </div>
            )}
            <p className="text-sm text-muted-foreground">{jobs.length} {t('jobs found', '\u0928\u094c\u0915\u0930\u093f\u092f\u093e\u0901 \u092e\u093f\u0932\u0940\u0902')}</p>
            {visibleJobs.map((job) => (
              <Card key={job.id} className="dark:bg-slate-900/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg dark:text-white">{job.title}</CardTitle>
                      <CardDescription>{job.company} {'\u2022'} {job.location}{job.salary ? ' \u2022 ' + job.salary : ''}</CardDescription>
                    </div>
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full shrink-0">{job.source}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{job.description?.slice(0, 200)}{job.description?.length > 200 ? '...' : ''}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" asChild><a href={job.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" /> {t('Apply', '\u0906\u0935\u0947\u0926\u0928')}</a></Button>
                    <Button size="sm" variant="outline" onClick={() => saveJob(job)} disabled={savedIds.has(job.id)}>
                      <BookmarkPlus className="h-4 w-4 mr-1" />{savedIds.has(job.id) ? t('Saved', '\u0938\u0947\u0935\u094d\u0921') : t('Save', '\u0938\u0947\u0935 \u0915\u0930\u0947\u0902')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { saveJob(job); window.location.href = '/resume?importJob=' + encodeURIComponent(job.id) }}>
                      <FileText className="h-4 w-4 mr-1" />{t('Tailor Resume', '\u0930\u093f\u091c\u093c\u094d\u092f\u0942\u092e\u0947 \u0924\u0948\u092f\u093e\u0930 \u0915\u0930\u0947\u0902')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {hasMore && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => setVisibleCount(v => v + PAGE_SIZE)} className="px-8">
                  {t('Load More (' + (jobs.length - visibleCount) + ' remaining)', '\u0914\u0930 \u0926\u0947\u0916\u0947\u0902 (' + (jobs.length - visibleCount) + ' \u0936\u0947\u0937)')}
                </Button>
              </div>
            )}
          </div>
        )}

        {jobs === null && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('Enter keywords above to search for jobs', '\u0928\u094c\u0915\u0930\u093f\u092f\u093e\u0901 \u0916\u094b\u091c\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0915\u0940\u0935\u0930\u094d\u0921 \u0926\u0930\u094d\u091c \u0915\u0930\u0947\u0902')}</p>
          </div>
        )}
      </div>
    </>
  )
}
