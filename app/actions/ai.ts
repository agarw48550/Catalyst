'use server'

/**
 * Server actions for AI operations
 */

import { executeAITask, analyzeResume, generateInterviewQuestions, provideInterviewFeedback } from '@/lib/ai'

export interface AIResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Analyze resume content
 */
export async function analyzeResumeAction(resumeText: string): Promise<AIResult> {
  try {
    if (!resumeText || resumeText.trim().length === 0) {
      return { success: false, error: 'Resume text is required' }
    }

    const result = await analyzeResume(resumeText)
    
    return { 
      success: true, 
      data: {
        analysis: result.text,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to analyze resume' }
  }
}

/**
 * Generate interview questions
 */
export async function generateQuestionsAction(
  jobDescription: string,
  role: string,
  count: number = 5
): Promise<AIResult> {
  try {
    if (!jobDescription || !role) {
      return { success: false, error: 'Job description and role are required' }
    }

    const result = await generateInterviewQuestions(jobDescription, role, count)
    
    return { 
      success: true, 
      data: {
        questions: result.text,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate questions' }
  }
}

/**
 * Provide interview feedback
 */
export async function provideFeedbackAction(
  questions: string[],
  answers: string[]
): Promise<AIResult> {
  try {
    if (!questions || !answers || questions.length !== answers.length) {
      return { success: false, error: 'Questions and answers must match' }
    }

    const result = await provideInterviewFeedback(questions, answers)
    
    return { 
      success: true, 
      data: {
        feedback: result.text,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to provide feedback' }
  }
}

/**
 * General AI chat
 */
export async function chatAction(message: string): Promise<AIResult> {
  try {
    if (!message || message.trim().length === 0) {
      return { success: false, error: 'Message is required' }
    }

    const result = await executeAITask('chat', message)
    
    return { 
      success: true, 
      data: {
        response: result.text,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to process chat' }
  }
}
