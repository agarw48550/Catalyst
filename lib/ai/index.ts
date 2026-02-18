/**
 * AI wrapper that selects optimal model based on task type
 */

import { generateContent, GeminiRequest, GeminiResponse, streamContent } from './gemini'

export type TaskType = 
  | 'resume-analysis'
  | 'resume-generation'
  | 'interview-questions'
  | 'interview-feedback'
  | 'job-matching'
  | 'career-research'
  | 'chat'
  | 'general'

/**
 * Task-specific configuration for optimal model selection
 */
const taskConfig: Record<TaskType, Partial<GeminiRequest>> = {
  'resume-analysis': {
    model: 'gemini-1.5-pro',
    temperature: 0.3,
    maxTokens: 2048,
    systemInstruction: 'You are an expert resume analyst. Analyze resumes for ATS optimization, clarity, and impact.',
  },
  'resume-generation': {
    model: 'gemini-1.5-pro',
    temperature: 0.5,
    maxTokens: 3072,
    systemInstruction: 'You are a professional resume writer. Create clear, ATS-optimized content.',
  },
  'interview-questions': {
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxTokens: 1024,
    systemInstruction: 'You are an experienced interviewer. Ask relevant, probing questions.',
  },
  'interview-feedback': {
    model: 'gemini-1.5-pro',
    temperature: 0.4,
    maxTokens: 2048,
    systemInstruction: 'You are an interview coach. Provide constructive, actionable feedback.',
  },
  'job-matching': {
    model: 'gemini-2.0-flash-exp',
    temperature: 0.2,
    maxTokens: 1024,
    systemInstruction: 'You are a career counselor. Match candidates with suitable job opportunities.',
  },
  'career-research': {
    model: 'gemini-1.5-pro',
    temperature: 0.6,
    maxTokens: 3072,
    systemInstruction: 'You are a career research expert. Provide insights on industries, trends, and opportunities.',
  },
  'chat': {
    model: 'gemini-2.0-flash-exp',
    temperature: 0.8,
    maxTokens: 2048,
    systemInstruction: 'You are a helpful career assistant. Be conversational and supportive.',
  },
  'general': {
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxTokens: 2048,
  },
}

/**
 * Execute AI task with optimal model selection
 */
export async function executeAITask(
  taskType: TaskType,
  prompt: string,
  overrides?: Partial<GeminiRequest>
): Promise<GeminiResponse> {
  const config = taskConfig[taskType]
  
  return await generateContent({
    ...config,
    ...overrides,
    prompt,
  })
}

/**
 * Stream AI task response
 */
export async function* streamAITask(
  taskType: TaskType,
  prompt: string,
  overrides?: Partial<GeminiRequest>
): AsyncGenerator<string, void, unknown> {
  const config = taskConfig[taskType]
  
  yield* streamContent({
    ...config,
    ...overrides,
    prompt,
  })
}

/**
 * Analyze resume content
 */
export async function analyzeResume(resumeText: string) {
  return await executeAITask('resume-analysis', `
    Analyze this resume and provide feedback on:
    1. ATS optimization (keywords, formatting)
    2. Content clarity and impact
    3. Skills and experience presentation
    4. Suggestions for improvement
    
    Resume:
    ${resumeText}
    
    Provide structured feedback in JSON format.
  `)
}

/**
 * Generate interview questions based on job description
 */
export async function generateInterviewQuestions(
  jobDescription: string,
  role: string,
  count: number = 5
) {
  return await executeAITask('interview-questions', `
    Generate ${count} relevant interview questions for a ${role} position.
    
    Job Description:
    ${jobDescription}
    
    Return questions in JSON array format.
  `)
}

/**
 * Provide interview feedback
 */
export async function provideInterviewFeedback(
  questions: string[],
  answers: string[]
) {
  const qaText = questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n\n')
  
  return await executeAITask('interview-feedback', `
    Evaluate these interview responses and provide detailed feedback:
    
    ${qaText}
    
    Provide:
    1. Overall assessment
    2. Strengths
    3. Areas for improvement
    4. Specific suggestions
    
    Return feedback in JSON format.
  `)
}

/**
 * Match jobs to candidate profile
 */
export async function matchJobs(
  candidateProfile: any,
  jobs: any[]
) {
  return await executeAITask('job-matching', `
    Match these jobs to the candidate profile and rank by relevance.
    
    Candidate: ${JSON.stringify(candidateProfile)}
    Jobs: ${JSON.stringify(jobs)}
    
    Return ranked job IDs with match scores and reasons in JSON.
  `)
}
