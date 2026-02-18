'use server'

/**
 * Server actions for job search
 */

import { searchJobs, searchJobsAggregated, type JobSearchParams } from '@/lib/jobs'

export interface JobSearchResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Search jobs with failover
 */
export async function searchJobsAction(params: JobSearchParams): Promise<JobSearchResult> {
  try {
    if (!params.query || params.query.trim().length === 0) {
      return { success: false, error: 'Search query is required' }
    }

    const jobs = await searchJobs(params)
    
    return { 
      success: true, 
      data: {
        jobs,
        count: jobs.length,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to search jobs' }
  }
}

/**
 * Search jobs from all sources (aggregated)
 */
export async function searchJobsAggregatedAction(params: JobSearchParams): Promise<JobSearchResult> {
  try {
    if (!params.query || params.query.trim().length === 0) {
      return { success: false, error: 'Search query is required' }
    }

    const jobs = await searchJobsAggregated(params)
    
    return { 
      success: true, 
      data: {
        jobs,
        count: jobs.length,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to search jobs' }
  }
}
