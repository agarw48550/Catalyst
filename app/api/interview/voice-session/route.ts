import { NextResponse } from 'next/server'

/**
 * Returns a temporary Gemini API key for the Live API voice interview.
 * Only accessible to authenticated users (protected by middleware).
 */
export async function POST(request: Request) {
  try {
    const { jobRole, interviewType } = await request.json()

    if (!jobRole) {
      return NextResponse.json({ error: 'jobRole is required' }, { status: 400 })
    }

    // Use the primary key, fall back to secondary
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_SECONDARY
    if (!apiKey) {
      return NextResponse.json({ error: 'No Gemini API keys configured' }, { status: 500 })
    }

    // Build the system instruction for the voice interview
    const systemInstruction = `You are a professional interview coach conducting a live voice interview practice session.

Role being interviewed for: ${jobRole}
Interview type: ${interviewType || 'behavioral'}

Instructions:
- Start by briefly introducing yourself and the interview format
- Ask one question at a time, wait for the candidate to answer
- After each answer, give brief encouraging feedback (1-2 sentences), then move to the next question
- Ask 5 questions total
- Keep your responses concise since this is a voice conversation
- After the 5th question, provide a brief overall assessment with key strengths and areas to improve
- Be warm, professional, and encouraging
- Speak naturally as if in a real interview setting`

    // Return the config for the client to connect to Gemini Live API
    return NextResponse.json({
      apiKey,
      model: 'gemini-2.5-flash-native-audio-dialog',
      systemInstruction,
      websocketUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`,
    })
  } catch (error: any) {
    console.error('Voice session error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create voice session' }, { status: 500 })
  }
}
