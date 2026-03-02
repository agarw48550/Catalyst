/**
 * Zod validation schemas for all API route inputs.
 * Centralised to ensure consistent validation across the app.
 */
import { z } from 'zod'

// ── Sanitisation helpers ────────────────────────────────────────────
/** Strip control characters and excessive whitespace */
function sanitize(val: string) {
    // eslint-disable-next-line no-control-regex
    return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim()
}

const safeString = (max: number) =>
    z.string().transform(sanitize).pipe(z.string().min(1).max(max))

// ── Resume Tailor ───────────────────────────────────────────────────
export const resumeTailorSchema = z.object({
    resumeText: safeString(10_000),
    jobTitle: z.string().max(200).optional().default(''),
    company: z.string().max(200).optional().default(''),
    jobDescription: safeString(10_000),
})
export type ResumeTailorInput = z.infer<typeof resumeTailorSchema>

// ── Interview Start ─────────────────────────────────────────────────
export const interviewStartSchema = z.object({
    jobRole: safeString(200),
    targetCompany: z.string().max(200).optional().default(''),
    interviewType: z.enum(['technical', 'behavioral', 'hr', 'case']),
    language: z.string().max(50).optional().default('English'),
})
export type InterviewStartInput = z.infer<typeof interviewStartSchema>

// ── Interview Feedback (single answer) ──────────────────────────────
export const interviewFeedbackSchema = z.object({
    question: safeString(1000),
    answer: safeString(5000),
    jobRole: safeString(200),
    interviewType: z.string().max(50).optional().default(''),
})
export type InterviewFeedbackInput = z.infer<typeof interviewFeedbackSchema>

// ── Research ────────────────────────────────────────────────────────
export const researchSchema = z.object({
    query: safeString(500),
    type: z.enum(['company', 'industry', 'salary', 'career-path', 'general']).optional().default('general'),
})
export type ResearchInput = z.infer<typeof researchSchema>

// ── Jobs Search (GET query params) ──────────────────────────────────
export const jobsSearchSchema = z.object({
    q: safeString(200),
    location: z.string().max(200).optional(),
    page: z.coerce.number().int().min(1).max(50).optional().default(1),
})
export type JobsSearchInput = z.infer<typeof jobsSearchSchema>

// ── Resend Confirmation ─────────────────────────────────────────────
export const resendConfirmationSchema = z.object({
    email: z.string().email().max(320),
})
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>
