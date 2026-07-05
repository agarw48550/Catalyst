import { describe, expect, it } from 'vitest'

import { POST as interviewStart } from '../interview/start/route'
import { GET as jobsSearch } from '../jobs/search/route'
import { POST as researchPost } from '../research/route'
import { POST as invitePost } from '../invite/route'

describe('retired feature APIs', () => {
  it('returns 410 for interview start', async () => {
    const response = await interviewStart()

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: 'Interview Practice is coming soon and is not available in the current production release.',
    })
  })

  it('returns 410 for job search', async () => {
    const response = await jobsSearch()

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: 'Job Search is coming soon and is not available in the current production release.',
    })
  })

  it('returns 410 for career research', async () => {
    const response = await researchPost()

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: 'Career Research is coming soon and is not available in the current production release.',
    })
  })

  it('returns 410 for custom settings invite actions', async () => {
    const response = await invitePost()

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: 'Account Settings is coming soon and is not available in the current production release.',
    })
  })
})
