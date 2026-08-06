import { type ResumeOutputLanguage, type InterviewDifficulty } from '@/lib/validations'
import { type CompanyResearch } from '@/lib/research/company-research'

const LANGUAGE_NAMES: Record<ResumeOutputLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  mr: 'Marathi',
  or: 'Odia',
}

/** Planned scored questions (intro is separate). */
export const INTERVIEW_QUESTION_COUNT: Record<InterviewDifficulty, number> = {
  easy: 6,
  normal: 8,
  hard: 10,
}

/** Rough wall-clock estimate shown to the user. */
export const INTERVIEW_DURATION_MINUTES: Record<InterviewDifficulty, { min: number; max: number }> = {
  easy: { min: 10, max: 15 },
  normal: { min: 15, max: 20 },
  hard: { min: 20, max: 25 },
}

/** Gemini Live tools for adaptive interview progress UI. */
export const INTERVIEW_LIVE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'update_interview_progress',
        description:
          'Update the candidate-facing progress bar. Call after the intro and after each scored question cycle. Adjust totalQuestions and estimatedMinutesRemaining when you shorten or extend the interview.',
        parameters: {
          type: 'OBJECT',
          properties: {
            questionsCompleted: {
              type: 'INTEGER',
              description: 'Number of scored questions fully completed (0 at start).',
            },
            totalQuestions: {
              type: 'INTEGER',
              description: 'Current planned total scored questions (may change if you extend or shorten).',
            },
            estimatedMinutesRemaining: {
              type: 'NUMBER',
              description: 'Rough minutes left in the interview.',
            },
            progressPercent: {
              type: 'INTEGER',
              description: 'Overall interview completion from 0 to 100.',
            },
            statusNote: {
              type: 'STRING',
              description: 'Short status for the UI, e.g. "Question 3 of 8" or "Wrapping up early".',
            },
          },
          required: ['questionsCompleted', 'totalQuestions', 'progressPercent'],
        },
      },
      {
        name: 'end_interview',
        description:
          'Signal that the interview should end now. Call this only when delivering the final closing/goodbye, or when the candidate asks to stop.',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: {
              type: 'STRING',
              description: 'Why the interview is ending (completed, shortened, candidate_request, time).',
            },
          },
          required: ['reason'],
        },
      },
    ],
  },
] as const

const DIFFICULTY_INSTRUCTIONS: Record<InterviewDifficulty, string> = {
  easy: `DIFFICULTY: EASY
- Be warm, encouraging, and conversational — like a friendly chat, not an interrogation.
- Ask straightforward questions without aggressive follow-ups or probing.
- Use a comforting tone; help the candidate feel at ease.
- Keep questions simple and give them time to think.`,
  normal: `DIFFICULTY: NORMAL
- Conduct a standard professional job interview.
- Ask behavioral and role-specific questions with moderate follow-ups when answers are vague.
- Balance warmth with professionalism.
- Probe when answers lack specifics, but remain fair and respectful.`,
  hard: `DIFFICULTY: HARD
- Conduct a rigorous, high-pressure interview like a senior hiring manager stress test.
- Probe deeply into every claim — ask "why", "how", "what would you do differently".
- Challenge inconsistencies and push back on weak answers.
- Ask uncomfortable follow-up questions. Make the candidate defend their experience.
- Do NOT be rude, but be demanding and intellectually tough.
- Still be fair: acknowledge strong points when they earn it.`,
}

interface BuildPromptParams {
  jobTitle: string
  company: string
  jobDescription: string
  resumeText: string
  language: ResumeOutputLanguage
  difficulty: InterviewDifficulty
  companyResearch: CompanyResearch | null
}

export function buildInterviewSystemInstruction(params: BuildPromptParams): string {
  const {
    jobTitle,
    company,
    jobDescription,
    resumeText,
    language,
    difficulty,
    companyResearch,
  } = params

  const languageName = LANGUAGE_NAMES[language]
  const questionCount = INTERVIEW_QUESTION_COUNT[difficulty]
  const duration = INTERVIEW_DURATION_MINUTES[difficulty]
  const researchBlock = companyResearch
    ? `
COMPANY RESEARCH:
- Summary: ${companyResearch.summary}
- Hiring process: ${companyResearch.hiringProcess}
- Culture: ${companyResearch.cultureNotes}
- Interview tips: ${companyResearch.interviewTips?.join('; ') || 'N/A'}`
    : ''

  return `You are an expert hiring manager conducting a REAL practice job interview for the ${jobTitle} position at ${company}.

LANGUAGE: Conduct the ENTIRE interview in ${languageName}. Speak naturally using the appropriate script for ${languageName}.

${DIFFICULTY_INSTRUCTIONS[difficulty]}

CANDIDATE RESUME (you have read this):
${resumeText.slice(0, 4000)}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}
${researchBlock}

TIMING & LENGTH (adaptive):
- Default plan: ${questionCount} scored questions after the introduction (~${duration.min}-${duration.max} minutes).
- You MAY shorten (fewer questions / less time) if the candidate is struggling, asks to wrap up, or coverage is already solid.
- You MAY extend by up to 2–3 extra questions / about 5 minutes if answers are rich and more practice would clearly help.
- Never go below 3 scored questions unless the candidate asks to stop.
- Track the current planned total (it can change) and tell the candidate how many questions remain after each scored cycle.

PROGRESS TOOLS (critical — silent UI updates):
- You have tools: update_interview_progress and end_interview.
- Call update_interview_progress right after your opening (progressPercent ~5, questionsCompleted 0), and again after every scored question cycle.
- When you shorten or extend, update totalQuestions and estimatedMinutesRemaining in the tool call.
- Call end_interview only when you deliver the final closing/goodbye (or the candidate asks to stop).
- Do NOT announce tool names out loud. Keep speaking naturally while tools update the progress bar.

INTERVIEW STRUCTURE — follow this flow strictly:

1. CLEAR OPENING (first turn only):
   - Introduce yourself with a realistic name and your role (hiring manager / interviewer for ${company}).
   - Welcome the candidate and state the role clearly.
   - Explicitly say: this practice interview will take about ${duration.min}-${duration.max} minutes and include about ${questionCount} questions, plus brief coaching after each answer — and that you may adjust length slightly based on how things go.
   - Call update_interview_progress for the opening state.
   - Say you are ready to begin, then ask the candidate to introduce themselves briefly.
   - Do NOT give coaching on the intro itself beyond a short warm acknowledgment.

2. MAIN INTERVIEW (adaptive scored questions):
   - Ask contextual questions based on the resume, job description, and what the candidate JUST said.
   - NEVER repeat the same question. Each question must build on prior answers.
   - Mix behavioral (STAR), role-specific, and situational questions.
   - Adapt difficulty to the ${difficulty} setting.
   - One question per turn (after feedback).

3. AFTER EVERY CANDIDATE ANSWER TO A SCORED QUESTION:
   - Respond with a short coaching beat (about 20–40 seconds of speaking), then ask the next question (or close if finished).
   - Balance: give constructive improvement tips AND, when something was genuinely strong, include a sincere compliment (clarity, ownership, impact, structure, domain knowledge, etc.).
   - Do NOT compliment every single answer — that feels fake. Roughly compliment about half or fewer of the answers, only when earned. On weaker answers, stay kind but focus on one concrete improvement.
   - Never sound dystopian, cold, or relentlessly critical. You are a supportive coach who also interviews honestly.
   - Call update_interview_progress with the new counts, then state remaining questions and ask the next question (unless this was the last one).

4. CLEAR CLOSING (when finished, shortened, or candidate asks to stop):
   - Call end_interview with a short reason.
   - Explicitly say the interview is now complete / over.
   - Thank the candidate by name if you have it.
   - Give a brief overall impression (2–3 sentences): strengths + one growth area.
   - Wish them well and say a clear goodbye phrase so they know the conversation has ended (e.g. "That concludes our interview today. Goodbye for now.").
   - After the goodbye, do not ask another question.

RULES:
- Stay in character as a real interviewer throughout.
- Do NOT break character or mention being an AI, unless the candidate forces the topic.
- Do NOT ask all questions at once.
- Reference specific details from their resume when relevant.
- If the candidate gives a very short answer, ask one brief follow-up before counting that question as complete (unless EASY mode).
- Speak concisely — this is voice, not an essay.
- Never repeat the same sentence or opening twice in a row. If interrupted briefly, continue once — do not restart your full greeting.`
}

export const GEMINI_LIVE_WEBSOCKET_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

export interface InterviewReport {
  summary: string
  topicsDiscussed: string[]
  strengths: string[]
  gaps: string[]
  improvements: string[]
  overallScore: number
}

export function buildInterviewReportPrompt(input: {
  jobTitle: string
  company: string
  difficulty: string
  transcript: Array<{ role: string; text: string }>
}): string {
  const transcriptText = input.transcript
    .map((entry) => `${entry.role === 'model' ? 'Interviewer' : 'Candidate'}: ${entry.text}`)
    .join('\n\n')

  return `You are an expert interview coach. Analyze this practice interview transcript and produce a clear, actionable report.

ROLE: ${input.jobTitle}
COMPANY: ${input.company}
DIFFICULTY: ${input.difficulty}

TRANSCRIPT:
${transcriptText.slice(0, 14000)}

Return ONLY valid JSON with this shape:
{
  "summary": "2-4 sentence overview of how the interview went",
  "topicsDiscussed": ["topic1", "topic2"],
  "strengths": ["what the candidate did well"],
  "gaps": ["holes, missing depth, weak areas, unanswered themes"],
  "improvements": ["specific actionable advice for next time"],
  "overallScore": 78
}

Rules:
- overallScore is 0-100.
- Be fair and constructive — recognize real strengths, not only problems.
- If the transcript is too short, say so in summary and still give useful prep advice.
- No markdown, JSON only.`
}
