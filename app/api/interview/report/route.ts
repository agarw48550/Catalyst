import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/gemini'
import { sendEmail } from '@/lib/mailers'

export async function POST(request: Request) {
  try {
    const { questions, answers, jobRole, interviewType, feedback, userEmail } = await request.json()

    if (!questions || !answers || !feedback) {
      return NextResponse.json({ error: 'questions, answers, and feedback are required' }, { status: 400 })
    }

    // Build Q&A transcript
    const qaText = questions.map((q: string, i: number) =>
      `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || '(no answer)'}\nFeedback: ${feedback.perQuestion?.[i]?.feedback || 'N/A'}\nScore: ${feedback.perQuestion?.[i]?.score || 'N/A'}%`
    ).join('\n\n')

    // Generate detailed report with Gemini
    const prompt = `You are a senior career coach. Generate a comprehensive interview performance report.

Interview Details:
- Role: ${jobRole || 'General'}
- Type: ${interviewType || 'Behavioral'}
- Overall Score: ${feedback.overallScore}%
- Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}

Questions, Answers & Per-Question Feedback:
${qaText}

Strengths identified: ${(feedback.strengths || []).join(', ')}
Weaknesses identified: ${(feedback.weaknesses || []).join(', ')}

Generate a professional report with:
1. Executive Summary (2-3 sentences)
2. Detailed Performance Analysis (what went well, what needs work — with specific examples from their answers)
3. Skill Gap Analysis (specific skills to develop for this role)
4. Action Plan (3-5 concrete steps to improve)
5. Resources & Next Steps

Return ONLY a JSON object (no markdown, no code fences):
{
  "executiveSummary": "...",
  "performanceAnalysis": "...",
  "skillGaps": ["gap1", "gap2"],
  "actionPlan": ["step1", "step2", "step3"],
  "resources": ["resource1", "resource2"],
  "overallAssessment": "Ready / Needs Practice / Significant Improvement Needed"
}`

    const result = await generateContent({ prompt, model: 'gemini-2.5-pro', maxTokens: 4096 })
    let text = result.text.trim()
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    const report = JSON.parse(text)

    // Combine feedback + report into a complete report object
    const fullReport = {
      id: `report-${Date.now()}`,
      date: new Date().toISOString(),
      jobRole: jobRole || 'General',
      interviewType: interviewType || 'Behavioral',
      overallScore: feedback.overallScore,
      ...report,
      perQuestion: feedback.perQuestion || [],
      strengths: feedback.strengths || [],
      weaknesses: feedback.weaknesses || [],
      tips: feedback.tips || [],
    }

    // Try to email the report if we have the user's email
    if (userEmail) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 640px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 32px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0 0 8px; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .score-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 20px; font-size: 28px; font-weight: bold; margin-top: 16px; }
    .content { padding: 32px; background: #fff; }
    .section { margin: 24px 0; }
    .section h2 { font-size: 18px; color: #4F46E5; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
    .assessment { display: inline-block; padding: 6px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .assessment.ready { background: #D1FAE5; color: #065F46; }
    .assessment.practice { background: #FEF3C7; color: #92400E; }
    .assessment.improve { background: #FEE2E2; color: #991B1B; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .qa-block { background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 12px 0; border-left: 4px solid #4F46E5; }
    .qa-block .question { font-weight: 600; color: #1a1a2e; }
    .qa-block .answer { color: #6B7280; margin: 8px 0; }
    .qa-block .fb { color: #4F46E5; font-style: italic; }
    .footer { background: #F9FAFB; padding: 24px; text-align: center; font-size: 12px; color: #9CA3AF; border-radius: 0 0 12px 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Interview Performance Report</h1>
    <p>${jobRole} • ${interviewType} Interview • ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <div class="score-badge">${feedback.overallScore}%</div>
  </div>
  <div class="content">
    <div class="section">
      <span class="assessment ${report.overallAssessment?.includes('Ready') ? 'ready' : report.overallAssessment?.includes('Practice') ? 'practice' : 'improve'}">${report.overallAssessment}</span>
    </div>

    <div class="section">
      <h2>Executive Summary</h2>
      <p>${report.executiveSummary}</p>
    </div>

    <div class="section">
      <h2>Performance Analysis</h2>
      <p>${report.performanceAnalysis}</p>
    </div>

    <div class="section">
      <h2>Question-by-Question Breakdown</h2>
      ${(feedback.perQuestion || []).map((pq: any, i: number) => `
        <div class="qa-block">
          <div class="question">Q${i + 1}: ${pq.question}</div>
          <div class="answer">Your answer: ${answers[i]?.slice(0, 200) || '(no answer)'}${(answers[i]?.length || 0) > 200 ? '...' : ''}</div>
          <div class="fb">${pq.feedback} (Score: ${pq.score}%)</div>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Strengths</h2>
      <ul>${(feedback.strengths || []).map((s: string) => `<li>✓ ${s}</li>`).join('')}</ul>
    </div>

    <div class="section">
      <h2>Areas for Improvement</h2>
      <ul>${(feedback.weaknesses || []).map((w: string) => `<li>⚠ ${w}</li>`).join('')}</ul>
    </div>

    <div class="section">
      <h2>Skill Gaps</h2>
      <ul>${(report.skillGaps || []).map((g: string) => `<li>${g}</li>`).join('')}</ul>
    </div>

    <div class="section">
      <h2>Action Plan</h2>
      <ol>${(report.actionPlan || []).map((a: string) => `<li>${a}</li>`).join('')}</ol>
    </div>

    <div class="section">
      <h2>Recommended Resources</h2>
      <ul>${(report.resources || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
    </div>
  </div>
  <div class="footer">
    <p>Generated by Project Catalyst — AI-Powered Career Platform</p>
    <p>© ${new Date().getFullYear()} Project Catalyst</p>
  </div>
</body>
</html>`

        await sendEmail({
          to: userEmail,
          subject: `Your Interview Report — ${jobRole} (${feedback.overallScore}%)`,
          html: emailHtml,
          text: `Interview Report\nRole: ${jobRole}\nScore: ${feedback.overallScore}%\n\n${report.executiveSummary}\n\nAction Plan:\n${(report.actionPlan || []).map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}`,
        })
        fullReport.emailSent = true
      } catch (emailErr: any) {
        console.error('Failed to send report email:', emailErr.message)
        fullReport.emailSent = false
        fullReport.emailError = emailErr.message
      }
    }

    return NextResponse.json(fullReport)
  } catch (error: any) {
    console.error('Interview report error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 })
  }
}
