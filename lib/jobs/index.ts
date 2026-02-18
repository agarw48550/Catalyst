/**
 * Job API aggregation with smart failover
 */

import { config } from '@/config'
import { logApiCall } from '@/lib/logger'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary?: string
  postedDate?: string
  url: string
  source: 'ncs' | 'jooble' | 'adzuna'
}

export interface JobSearchParams {
  query: string
  location?: string
  page?: number
  limit?: number
}

/**
 * Search NCS (National Career Service India)
 */
async function searchNCS(params: JobSearchParams): Promise<Job[]> {
  if (!config.jobs.ncs.apiKey) {
    throw new Error('NCS API key not configured')
  }

  const startTime = Date.now()
  
  try {
    // NCS API implementation (placeholder - actual API structure may vary)
    const response = await fetch(
      `${config.jobs.ncs.apiUrl}/jobs/search?q=${encodeURIComponent(params.query)}&location=${params.location || ''}&page=${params.page || 1}`,
      {
        headers: {
          'Authorization': `Bearer ${config.jobs.ncs.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`NCS API error: ${response.statusText}`)
    }

    const data = await response.json()

    await logApiCall({
      service: 'ncs',
      endpoint: '/jobs/search',
      method: 'GET',
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      fallbackUsed: false,
    })

    // Transform to standard format
    return (data.jobs || []).map((job: any) => ({
      id: job.id || job.jobId,
      title: job.title || job.jobTitle,
      company: job.company || job.companyName,
      location: job.location,
      description: job.description,
      salary: job.salary,
      postedDate: job.postedDate,
      url: job.url || job.applyUrl,
      source: 'ncs' as const,
    }))
  } catch (error: any) {
    await logApiCall({
      service: 'ncs',
      endpoint: '/jobs/search',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message,
      fallbackUsed: false,
    })
    throw error
  }
}

/**
 * Search Jooble
 */
async function searchJooble(params: JobSearchParams): Promise<Job[]> {
  if (!config.jobs.jooble.apiKey) {
    throw new Error('Jooble API key not configured')
  }

  const startTime = Date.now()

  try {
    const response = await fetch(`${config.jobs.jooble.apiUrl}/${config.jobs.jooble.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: params.query,
        location: params.location || '',
        page: (params.page || 1).toString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Jooble API error: ${response.statusText}`)
    }

    const data = await response.json()

    await logApiCall({
      service: 'jooble',
      endpoint: '/api',
      method: 'POST',
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      fallbackUsed: false,
    })

    return (data.jobs || []).map((job: any) => ({
      id: job.id || `jooble-${Date.now()}-${Math.random()}`,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.snippet || job.description,
      salary: job.salary,
      postedDate: job.updated,
      url: job.link,
      source: 'jooble' as const,
    }))
  } catch (error: any) {
    await logApiCall({
      service: 'jooble',
      endpoint: '/api',
      method: 'POST',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message,
      fallbackUsed: false,
    })
    throw error
  }
}

/**
 * Search Adzuna
 */
async function searchAdzuna(params: JobSearchParams): Promise<Job[]> {
  if (!config.jobs.adzuna.appId || !config.jobs.adzuna.apiKey) {
    throw new Error('Adzuna API credentials not configured')
  }

  const startTime = Date.now()

  try {
    const country = 'in' // India
    const url = new URL(`${config.jobs.adzuna.apiUrl}/jobs/${country}/search/${params.page || 1}`)
    url.searchParams.set('app_id', config.jobs.adzuna.appId)
    url.searchParams.set('app_key', config.jobs.adzuna.apiKey)
    url.searchParams.set('what', params.query)
    if (params.location) {
      url.searchParams.set('where', params.location)
    }
    url.searchParams.set('results_per_page', (params.limit || 10).toString())

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.statusText}`)
    }

    const data = await response.json()

    await logApiCall({
      service: 'adzuna',
      endpoint: '/jobs/search',
      method: 'GET',
      statusCode: response.status,
      responseTime: Date.now() - startTime,
      fallbackUsed: false,
    })

    return (data.results || []).map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      salary: job.salary_min && job.salary_max
        ? `₹${job.salary_min} - ₹${job.salary_max}`
        : undefined,
      postedDate: job.created,
      url: job.redirect_url,
      source: 'adzuna' as const,
    }))
  } catch (error: any) {
    await logApiCall({
      service: 'adzuna',
      endpoint: '/jobs/search',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message,
      fallbackUsed: false,
    })
    throw error
  }
}

/**
 * Search jobs with automatic failover
 */
export async function searchJobs(params: JobSearchParams): Promise<Job[]> {
  const errors: { source: string; error: string }[] = []

  // Try each job API in fallback order
  for (const source of config.jobs.fallbackOrder) {
    try {
      let jobs: Job[]
      
      switch (source) {
        case 'ncs':
          jobs = await searchNCS(params)
          break
        case 'jooble':
          jobs = await searchJooble(params)
          break
        case 'adzuna':
          jobs = await searchAdzuna(params)
          break
        default:
          continue
      }

      console.log(`✓ Successfully fetched ${jobs.length} jobs from ${source}`)
      return jobs
    } catch (error: any) {
      console.error(`✗ ${source} failed:`, error.message)
      errors.push({ source, error: error.message })
      // Continue to next provider
    }
  }

  // All providers failed
  throw new Error(
    `All job APIs failed:\n${errors.map((e) => `${e.source}: ${e.error}`).join('\n')}`
  )
}

/**
 * Search jobs from all sources (aggregated)
 */
export async function searchJobsAggregated(params: JobSearchParams): Promise<Job[]> {
  const allJobs: Job[] = []
  const promises = config.jobs.fallbackOrder.map(async (source) => {
    try {
      let jobs: Job[]
      
      switch (source) {
        case 'ncs':
          jobs = await searchNCS(params)
          break
        case 'jooble':
          jobs = await searchJooble(params)
          break
        case 'adzuna':
          jobs = await searchAdzuna(params)
          break
        default:
          return []
      }

      return jobs
    } catch (error) {
      console.error(`Failed to fetch from ${source}:`, error)
      return []
    }
  })

  const results = await Promise.all(promises)
  results.forEach((jobs) => allJobs.push(...jobs))

  // Remove duplicates based on title + company
  const unique = allJobs.filter(
    (job, index, self) =>
      index ===
      self.findIndex((j) => j.title === job.title && j.company === job.company)
  )

  return unique
}

/**
 * Get job details by ID and source
 */
export async function getJobDetails(jobId: string, source: Job['source']): Promise<Job | null> {
  // This would typically fetch full details from the specific API
  // For now, return null as a placeholder
  return null
}
