'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { AppHeader } from '@/components/app-header'
import { VoiceInterview } from '@/components/voice-interview'
import { Mic, PenTool, Download, Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react'

type Phase = 'setup' | 'interview' | 'review' | 'report'
type InterviewMode = 'written' | 'spoken'

interface AnswerFeedback {
  feedback: string
  score: number
  tip: string
}

interface QuestionFeedback {
  question: string
  feedback: string
  score: number
}

interface FeedbackResult {
  overallScore: number
  perQuestion: QuestionFeedback[]
  strengths: string[]
  weaknesses: string[]
  tips: string[]
}

interface InterviewReport {
  id: string
  date: string
  jobRole: string
  interviewType: string
  overallScore: number
  executiveSummary: string
  performanceAnalysis: string
  skillGaps: string[]
  actionPlan: string[]
  resources: string[]
  overallAssessment: string
  emailSent?: boolean
  emailError?: string
}

export default function InterviewPage() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<InterviewMode>('written')
  const [jobRole, setJobRole] = useState('')
  const [interviewType, setInterviewType] = useState('behavioral')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Per-answer feedback
  const [answerFeedbacks, setAnswerFeedbacks] = useState<(AnswerFeedback | null)[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [showingFeedback, setShowingFeedback] = useState(false)

  // Report
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Load user email from Supabase
  useEffect(() => {
    async function loadEmail() {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase-browser')
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getUser()
        if (data?.user?.email) setUserEmail(data.user.email)
      } catch {}
    }
    loadEmail()
  }, [])

  async function startInterview(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole, interviewType, language: 'English' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to start interview')
      }
      const data = await res.json()
      setQuestions(data.questions)
      setAnswers(new Array(data.questions.length).fill(''))
      setAnswerFeedbacks(new Array(data.questions.length).fill(null))
      setCurrentIndex(0)
      setCurrentAnswer('')
      setShowingFeedback(false)
      setPhase('interview')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer() {
    if (!currentAnswer.trim()) return

    // Save the answer
    const newAnswers = [...answers]
    newAnswers[currentIndex] = currentAnswer
    setAnswers(newAnswers)

    // Get per-answer feedback
    setFeedbackLoading(true)
    try {
      const res = await fetch('/api/interview/answer-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[currentIndex],
          answer: currentAnswer,
          jobRole,
          interviewType,
        }),
      })
      if (res.ok) {
        const fb = await res.json()
        const newFeedbacks = [...answerFeedbacks]
        newFeedbacks[currentIndex] = fb
        setAnswerFeedbacks(newFeedbacks)
      }
    } catch {
      // Non-critical — continue without per-answer feedback
    } finally {
      setFeedbackLoading(false)
      setShowingFeedback(true)
    }
  }

  function nextQuestion() {
    setShowingFeedback(false)
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer(answers[currentIndex + 1] || '')
    } else {
      getFeedback(answers)
    }
  }

  async function getFeedback(finalAnswers: string[]) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers: finalAnswers, jobRole }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to get feedback')
      }
      setFeedback(await res.json())
      setPhase('review')

      // Track usage
      const count = parseInt(localStorage.getItem('catalyst_interview_count') || '0', 10)
      localStorage.setItem('catalyst_interview_count', (count + 1).toString())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function generateReport() {
    if (!feedback) return
    setReportLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/interview/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          answers,
          jobRole,
          interviewType,
          feedback,
          userEmail,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate report')
      }
      const rpt = await res.json()
      setReport(rpt)
      setPhase('report')

      // Save to localStorage for dashboard
      try {
        const existing = JSON.parse(localStorage.getItem('catalyst_interview_reports') || '[]')
        existing.unshift(rpt)
        localStorage.setItem('catalyst_interview_reports', JSON.stringify(existing.slice(0, 20)))
      } catch {}
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReportLoading(false)
    }
  }

  function startOver() {
    setPhase('setup')
    setFeedback(null)
    setReport(null)
    setAnswerFeedbacks([])
    setShowingFeedback(false)
    setError(null)
  }

  return (
    <>
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Interview Coach</h1>
          <p className="text-muted-foreground">Practice interviews and get AI-powered feedback</p>
        </div>

        {phase === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Your Interview</CardTitle>
              <CardDescription>Configure your practice session</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
              <form onSubmit={mode === 'written' ? startInterview : (e) => { e.preventDefault(); setPhase('interview') }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobRole">Job Role</Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g. Software Engineer, Product Manager"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interview Type</Label>
                  <div className="flex gap-4">
                    {['behavioral', 'technical', 'hr'].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="interviewType"
                          value={type}
                          checked={interviewType === type}
                          onChange={(e) => setInterviewType(e.target.value)}
                        />
                        <span className="capitalize text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="space-y-2">
                  <Label>Interview Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('written')}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        mode === 'written'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <PenTool className={`h-5 w-5 ${mode === 'written' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-medium text-sm">Written</div>
                        <div className="text-xs text-muted-foreground">Type your answers</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('spoken')}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        mode === 'spoken'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <Mic className={`h-5 w-5 ${mode === 'spoken' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-medium text-sm">Spoken</div>
                        <div className="text-xs text-muted-foreground">Talk via microphone</div>
                      </div>
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !jobRole.trim()}>
                  {loading ? 'Generating Questions...' : mode === 'spoken' ? 'Start Voice Interview' : 'Start Written Interview'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {phase === 'interview' && mode === 'spoken' && (
          <div className="space-y-4">
            <Button
              onClick={() => { setPhase('setup'); setMode('written') }}
              variant="ghost"
              className="text-sm text-muted-foreground"
            >
              ← Back to setup
            </Button>
            <VoiceInterview
              jobRole={jobRole}
              interviewType={interviewType}
              onComplete={() => { setPhase('setup') }}
            />
          </div>
        )}

        {phase === 'interview' && mode === 'written' && questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{jobRole} • {interviewType}</span>
            </div>
            <Progress value={((currentIndex) / questions.length) * 100} />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{questions[currentIndex]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Answer input — hidden when showing feedback */}
                {!showingFeedback && (
                  <>
                    <textarea
                      className="w-full min-h-[150px] p-3 text-sm border rounded-md bg-background resize-y"
                      placeholder="Type your answer here..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                    />
                    <Button
                      onClick={submitAnswer}
                      className="w-full"
                      disabled={feedbackLoading || !currentAnswer.trim()}
                    >
                      {feedbackLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing your answer...</>
                      ) : (
                        'Submit Answer'
                      )}
                    </Button>
                  </>
                )}

                {/* Per-answer feedback */}
                {showingFeedback && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Your answer:</p>
                      <p className="text-sm">{answers[currentIndex]}</p>
                    </div>

                    {answerFeedbacks[currentIndex] ? (
                      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">AI Feedback</span>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                            answerFeedbacks[currentIndex]!.score >= 80 ? 'bg-green-100 text-green-700' :
                            answerFeedbacks[currentIndex]!.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {answerFeedbacks[currentIndex]!.score}%
                          </span>
                        </div>
                        <p className="text-sm">{answerFeedbacks[currentIndex]!.feedback}</p>
                        <div className="flex items-start gap-2 text-sm bg-white p-3 rounded-md border">
                          <span className="text-primary mt-0.5">💡</span>
                          <span>{answerFeedbacks[currentIndex]!.tip}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
                        Feedback unavailable for this answer.
                      </div>
                    )}

                    <Button onClick={nextQuestion} className="w-full">
                      {currentIndex < questions.length - 1 ? (
                        <>Next Question →</>
                      ) : (
                        <>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} Finish &amp; Get Overall Feedback</>
                      )}
                    </Button>
                  </div>
                )}

                {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
              </CardContent>
            </Card>
          </div>
        )}

        {phase === 'review' && feedback && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Progress value={feedback.overallScore} className="flex-1" />
                  <span className="text-2xl font-bold">{feedback.overallScore}%</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm text-green-600">Strengths</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex gap-2"><span className="text-green-500">✓</span>{s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm text-orange-600">Areas to Improve</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {feedback.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm flex gap-2"><span className="text-orange-500">!</span>{w}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Per-Question Feedback</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {feedback.perQuestion.map((pq, i) => (
                  <div key={i} className="border-b pb-3 last:border-b-0">
                    <p className="text-sm font-medium">{pq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">{pq.feedback}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={pq.score} className="w-24 h-2" />
                      <span className="text-xs text-muted-foreground">{pq.score}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tips for Next Time</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {feedback.tips.map((tip, i) => (
                    <li key={i} className="text-sm flex gap-2"><span className="text-primary">•</span>{tip}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Generate Full Report Button */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <h3 className="text-lg font-semibold">Want a detailed performance report?</h3>
                  <p className="text-sm text-muted-foreground">
                    Get a comprehensive analysis with skill gap assessment, action plan, and recommended resources.
                    {userEmail && ' The report will also be emailed to you.'}
                  </p>
                  {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
                  <Button
                    onClick={generateReport}
                    disabled={reportLoading}
                    className="px-8"
                    size="lg"
                  >
                    {reportLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Report...</>
                    ) : (
                      <><Download className="mr-2 h-4 w-4" /> Generate Full Report</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button onClick={startOver} variant="outline" className="w-full">
              Start New Interview
            </Button>
          </div>
        )}

        {/* ─── REPORT PHASE ─── */}
        {phase === 'report' && report && (
          <div className="space-y-6">
            {report.emailSent && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <Mail className="h-4 w-4" />
                Report emailed to {userEmail}
              </div>
            )}
            {report.emailSent === false && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                Report generated but email could not be sent.
              </div>
            )}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{report.jobRole}</h2>
                    <p className="text-muted-foreground capitalize">{report.interviewType} Interview</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(report.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{report.overallScore}%</div>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      report.overallAssessment?.includes('Ready') ? 'bg-green-100 text-green-700' :
                      report.overallAssessment?.includes('Practice') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {report.overallAssessment}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{report.executiveSummary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Performance Analysis</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{report.performanceAnalysis}</p>
              </CardContent>
            </Card>

            {report.skillGaps?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-orange-600">Skill Gaps</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.skillGaps.map((gap, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-orange-500 mt-0.5">⚠</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {report.actionPlan?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-primary">Action Plan</CardTitle></CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {report.actionPlan.map((step, i) => (
                      <li key={i} className="text-sm flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {report.resources?.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Recommended Resources</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {report.resources.map((r, i) => (
                      <li key={i} className="text-sm flex gap-2"><span className="text-primary">📚</span>{r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setPhase('review')} variant="outline" className="flex-1">
                ← Back to Feedback
              </Button>
              <Button onClick={startOver} className="flex-1">
                Start New Interview
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
