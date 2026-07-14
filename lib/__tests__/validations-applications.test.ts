import { describe, expect, it } from 'vitest'
import { jobApplicationCreateSchema, interviewSessionSchema } from '@/lib/validations'

describe('jobApplicationCreateSchema', () => {
  it('accepts valid application input', () => {
    const result = jobApplicationCreateSchema.safeParse({
      jobTitle: 'Engineer',
      company: 'Acme',
      jobDescription: 'Build things',
      resumeText: 'Experienced developer',
      language: 'hi',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty job title', () => {
    const result = jobApplicationCreateSchema.safeParse({
      jobTitle: '',
      company: 'Acme',
      jobDescription: 'Build things',
      resumeText: 'Experienced developer',
    })
    expect(result.success).toBe(false)
  })
})

describe('interviewSessionSchema', () => {
  it('accepts valid session input', () => {
    const result = interviewSessionSchema.safeParse({
      applicationId: '550e8400-e29b-41d4-a716-446655440000',
      difficulty: 'hard',
    })
    expect(result.success).toBe(true)
  })

  it('defaults difficulty to normal', () => {
    const result = interviewSessionSchema.safeParse({
      applicationId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.difficulty).toBe('normal')
    }
  })
})
