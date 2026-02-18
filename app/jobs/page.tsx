'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, ExternalLink, BookmarkPlus } from 'lucide-react'

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary?: string
  postedDate?: string
  url: string
  source: string
}

export default function JobsPage() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ q: query })
      if (location) params.set('location', location)
      const res = await fetch(`/api/jobs/search?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Search failed')
      }
      const data = await res.json()
      setJobs(data.jobs)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function saveJob(job: Job) {
    let saved: Job[] = []
    try {
      saved = JSON.parse(localStorage.getItem('savedJobs') || '[]')
    } catch {
      saved = []
    }
    if (!savedIds.has(job.id)) {
      saved.push(job)
      localStorage.setItem('savedJobs', JSON.stringify(saved))
      setSavedIds((prev) => new Set([...prev, job.id]))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Job Search</h1>
        <p className="text-muted-foreground">Find jobs from NCS, Jooble, and Adzuna in one place</p>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="query">Job Keywords</Label>
              <Input
                id="query"
                placeholder="e.g. Software Engineer, Data Analyst"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Mumbai, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {jobs !== null && !loading && jobs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No jobs found. Try different keywords or location.
        </div>
      )}

      {jobs !== null && !loading && jobs.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{jobs.length} jobs found</p>
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription>
                      {job.company} • {job.location}
                      {job.salary && ` • ${job.salary}`}
                    </CardDescription>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full shrink-0">
                    {job.source}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {job.description?.slice(0, 200)}{job.description?.length > 200 ? '...' : ''}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Apply
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveJob(job)}
                    disabled={savedIds.has(job.id)}
                  >
                    <BookmarkPlus className="h-4 w-4 mr-1" />
                    {savedIds.has(job.id) ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {jobs === null && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Enter keywords above to search for jobs</p>
        </div>
      )}
    </div>
  )
}
