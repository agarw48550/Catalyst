'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { AppHeader } from '@/components/app-header'
import { VoiceInterview } from '@/components/voice-interview'
import { Mic, PenTool } from 'lucide-react'

type Phase = 'setup' | 'interview' | 'review'
type InterviewMode = 'written' | 'spoken'

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
      setCurrentIndex(0)
      setCurrentAnswer('')
      setPhase('interview')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function submitAnswer() {
    const newAnswers = [...answers]
    newAnswers[currentIndex] = currentAnswer
    setAnswers(newAnswers)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer(newAnswers[currentIndex + 1] || '')
    } else {
      getFeedback(newAnswers)
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
                <textarea
                  className="w-full min-h-[150px] p-3 text-sm border rounded-md bg-background resize-y"
                  placeholder="Type your answer here..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                />
                {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
                <Button
                  onClick={submitAnswer}
                  className="w-full"
                  disabled={loading || !currentAnswer.trim()}
                >
                  {loading
                    ? 'Getting Feedback...'
                    : currentIndex < questions.length - 1
                      ? 'Submit & Next Question'
                      : 'Finish & Get Feedback'}
                </Button>
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

            <Button onClick={() => { setPhase('setup'); setFeedback(null); setMode('written') }} variant="outline" className="w-full">
              Start New Interview
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
