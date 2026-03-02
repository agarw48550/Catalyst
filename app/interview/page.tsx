'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { LoadingBar } from '@/components/ui/loading-bar'
import { AppHeader } from '@/components/app-header'
import { VoiceInterview } from '@/components/voice-interview'
import { useLanguage } from '@/lib/i18n/context'
import { Mic, PenTool, Loader2, CheckCircle, Download, Mail, AlertCircle } from 'lucide-react'

type Phase = 'setup' | 'interview' | 'review' | 'report'
type InterviewMode = 'written' | 'spoken'

interface AnswerFeedback { feedback: string; score: number; tip: string }
interface QuestionFeedback { question: string; feedback: string; score: number }
interface FeedbackResult {
  overallScore: number
  perQuestion: QuestionFeedback[]
  strengths: string[]
  weaknesses: string[]
  tips: string[]
}
interface InterviewReport {
  id: string; date: string; jobRole: string; interviewType: string
  overallScore: number; executiveSummary: string; performanceAnalysis: string
  skillGaps: string[]; actionPlan: string[]; resources: string[]
  overallAssessment: string; emailSent?: boolean; emailError?: string
}

const typeInfo: Record<string, { en: string; hi: string; mr: string; icon: string }> = {
  behavioral: {
    en: 'About your past experiences - "Tell me about a time when..."',
    hi: '\u0906\u092a\u0915\u0947 \u092a\u093f\u091b\u0932\u0947 \u0905\u0928\u0941\u092d\u0935\u094b\u0902 \u0915\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902',
    mr: '\u0924\u0941\u092e\u091a\u094d\u092f\u093e \u092e\u093e\u0917\u0940\u0932 \u0905\u0928\u0941\u092d\u0935\u093e\u0902\u092c\u0926\u094d\u0926\u0932',
    icon: '\U0001f4ac',
  },
  technical: {
    en: 'About your skills & knowledge - tests what you know',
    hi: '\u0906\u092a\u0915\u0947 \u0915\u094c\u0936\u0932 \u0914\u0930 \u091c\u094d\u091e\u093e\u0928 \u0915\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902',
    mr: '\u0924\u0941\u092e\u091a\u094d\u092f\u093e \u0915\u094c\u0936\u0932\u094d\u092f \u0906\u0923\u093f \u091c\u094d\u091e\u093e\u0928\u093e\u092c\u0926\u094d\u0926\u0932',
    icon: '\U0001f9e0',
  },
  hr: {
    en: 'General questions - salary, why you want this job, your plans',
    hi: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u092a\u094d\u0930\u0936\u094d\u0928 - \u0935\u0947\u0924\u0928, \u092f\u094b\u091c\u0928\u093e\u090f\u0902',
    mr: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u092a\u094d\u0930\u0936\u094d\u0928 - \u092a\u0917\u093e\u0930, \u092f\u094b\u091c\u0928\u093e',
    icon: '\U0001f91d',
  },
}
const typeLabels: Record<string, { en: string; hi: string; mr: string }> = {
  behavioral: { en: 'Experience Questions', hi: '\u0905\u0928\u0941\u092d\u0935 \u0915\u0947 \u092a\u094d\u0930\u0936\u094d\u0928', mr: '\u0905\u0928\u0941\u092d\u0935\u093e\u091a\u0947 \u092a\u094d\u0930\u0936\u094d\u0928' },
  technical: { en: 'Skill & Knowledge Test', hi: '\u0915\u094c\u0936\u0932 \u0914\u0930 \u091c\u094d\u091e\u093e\u0928 \u092a\u0930\u0940\u0915\u094d\u0937\u093e', mr: '\u0915\u094c\u0936\u0932\u094d\u092f \u091a\u093e\u091a\u0923\u0940' },
  hr: { en: 'General / HR Questions', hi: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f / HR \u092a\u094d\u0930\u0936\u094d\u0928', mr: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f / HR \u092a\u094d\u0930\u0936\u094d\u0928' },
}

export default function InterviewPage() {
  const { lang: language } = useLanguage()
  const lang = (language || 'en') as 'en' | 'hi' | 'mr'
  const t = (en: string, hi: string, mr?: string) => lang === 'hi' ? hi : lang === 'mr' ? (mr || hi) : en

  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<InterviewMode>('written')
  const [jobRole, setJobRole] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [interviewType, setInterviewType] = useState('behavioral')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answerFeedbacks, setAnswerFeedbacks] = useState<(AnswerFeedback | null)[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [showingFeedback, setShowingFeedback] = useState(false)
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase-browser')
        const { data } = await getSupabaseBrowserClient().auth.getUser()
        if (data?.user?.email) setUserEmail(data.user.email)
      } catch {}
    })()
  }, [])

  async function startInterview(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole, targetCompany, interviewType, language: 'English' }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      const data = await res.json()
      setQuestions(data.questions)
      setAnswers(new Array(data.questions.length).fill(''))
      setAnswerFeedbacks(new Array(data.questions.length).fill(null))
      setCurrentIndex(0); setCurrentAnswer(''); setShowingFeedback(false)
      setPhase('interview')
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  async function submitAnswer() {
    if (!currentAnswer.trim()) return
    const newAnswers = [...answers]
    newAnswers[currentIndex] = currentAnswer
    setAnswers(newAnswers)
    setFeedbackLoading(true)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/interview/answer-feedback', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: questions[currentIndex], answer: currentAnswer,
            jobRole, interviewType,
            previousQA: questions.slice(0, currentIndex).map((q, i) => ({
              question: q, answer: newAnswers[i] || ''
            })),
          }),
        })
        if (res.ok) {
          const fb = await res.json()
          const nf = [...answerFeedbacks]; nf[currentIndex] = fb; setAnswerFeedbacks(nf)
          break
        }
      } catch {}
      if (attempt < 1) await new Promise(r => setTimeout(r, 800))
    }
    setFeedbackLoading(false); setShowingFeedback(true)
  }

  function nextQuestion() {
    setShowingFeedback(false)
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCurrentAnswer(answers[currentIndex + 1] || '')
    } else {
      const fa = [...answers]
      fa[currentIndex] = currentAnswer || fa[currentIndex]
      getFeedback(fa)
    }
  }

  async function getFeedback(finalAnswers: string[]) {
    setLoading(true); setError(null)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('/api/interview/feedback', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions, answers: finalAnswers, jobRole }),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
        setFeedback(await res.json()); setPhase('review')
        const c = parseInt(localStorage.getItem('catalyst_interview_count') || '0', 10)
        localStorage.setItem('catalyst_interview_count', (c + 1).toString())
        setLoading(false); return
      } catch (err: any) {
        if (attempt >= 2) { setError(err.message); setLoading(false) }
        else await new Promise(r => setTimeout(r, 1200))
      }
    }
  }

  async function generateReport() {
    if (!feedback) return
    setReportLoading(true); setError(null)
    try {
      const res = await fetch('/api/interview/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers, jobRole, interviewType, feedback, userEmail }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      const rpt = await res.json(); setReport(rpt); setPhase('report')
    } catch (err: any) { setError(err.message) } finally { setReportLoading(false) }
  }

  function startOver() {
    setPhase('setup'); setFeedback(null); setReport(null)
    setAnswerFeedbacks([]); setShowingFeedback(false); setError(null)
  }

  const scoreColor = (s: number) => s >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : s >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'

  return (
    <>
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('AI Interview Coach', 'AI \u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u0915\u094b\u091a', 'AI \u092e\u0941\u0932\u093e\u0916\u0924 \u092a\u094d\u0930\u0936\u093f\u0915\u094d\u0937\u0915')}</h1>
          <p className="text-muted-foreground">{t('Practice interviews and get AI-powered feedback', '\u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u0915\u093e \u0905\u092d\u094d\u092f\u093e\u0938 \u0915\u0930\u0947\u0902 \u0914\u0930 AI \u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e \u092a\u093e\u090f\u0902')}</p>
        </div>

        {/* SETUP */}
        {phase === 'setup' && (
          <Card className="dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="dark:text-white">{t('Setup Your Interview', '\u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u0938\u0947\u091f\u0905\u092a')}</CardTitle>
              <CardDescription>{t('Configure your practice session', '\u0905\u092a\u0928\u093e \u0905\u092d\u094d\u092f\u093e\u0938 \u0938\u0924\u094d\u0930 \u0938\u0947\u091f \u0915\u0930\u0947\u0902')}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
              <form onSubmit={mode === 'written' ? startInterview : (e) => { e.preventDefault(); setPhase('interview') }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobRole">{t('Job Role', '\u0928\u094c\u0915\u0930\u0940 \u0915\u0940 \u092d\u0942\u092e\u093f\u0915\u093e')}</Label>
                  <Input id="jobRole" placeholder={t('e.g. Software Engineer', '\u0909\u0926\u093e. \u0938\u0949\u092b\u094d\u091f\u0935\u0947\u092f\u0930 \u0907\u0902\u091c\u0940\u0928\u093f\u092f\u0930')} value={jobRole} onChange={(e) => setJobRole(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetCompany">{t('Target Company', '\u0915\u0902\u092a\u0928\u0940 \u0915\u093e \u0928\u093e\u092e')} <span className="text-muted-foreground text-xs">({t('optional', '\u0935\u0948\u0915\u0932\u094d\u092a\u093f\u0915')})</span></Label>
                  <Input id="targetCompany" placeholder="e.g. Google, TCS" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} />
                </div>
                <div className="space-y-3">
                  <Label>{t('Interview Type', '\u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u0915\u093e \u092a\u094d\u0930\u0915\u093e\u0930')}</Label>
                  <div className="space-y-2">
                    {(['behavioral', 'technical', 'hr'] as const).map((type) => (
                      <label key={type} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${interviewType === type ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-border hover:border-primary/40 dark:border-slate-700'}`}>
                        <input type="radio" name="interviewType" value={type} checked={interviewType === type} onChange={(e) => setInterviewType(e.target.value)} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{typeInfo[type].icon}</span>
                            <span className="font-medium text-sm dark:text-white">{typeLabels[type][lang]}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{typeInfo[type][lang]}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('Interview Mode', '\u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u092e\u094b\u0921')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setMode('written')} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${mode === 'written' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 dark:border-slate-700'}`}>
                      <PenTool className={`h-5 w-5 ${mode === 'written' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-medium text-sm dark:text-white">{t('Written', '\u0932\u093f\u0916\u093f\u0924')}</div>
                        <div className="text-xs text-muted-foreground">{t('Type your answers', '\u091c\u0935\u093e\u092c \u091f\u093e\u0907\u092a \u0915\u0930\u0947\u0902')}</div>
                      </div>
                    </button>
                    <button type="button" onClick={() => setMode('spoken')} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${mode === 'spoken' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 dark:border-slate-700'}`}>
                      <Mic className={`h-5 w-5 ${mode === 'spoken' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-medium text-sm dark:text-white">{t('Spoken', '\u092c\u094b\u0932\u0915\u0930')}</div>
                        <div className="text-xs text-muted-foreground">{t('Talk via microphone', '\u092e\u093e\u0907\u0915 \u0938\u0947 \u092c\u094b\u0932\u0947\u0902')}</div>
                      </div>
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !jobRole.trim()}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('Generating...', '\u0924\u0948\u092f\u093e\u0930 \u0939\u094b \u0930\u0939\u0947 \u0939\u0948\u0902...')}</> : mode === 'spoken' ? t('Start Voice Interview', '\u0935\u0949\u0907\u0938 \u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902') : t('Start Written Interview', '\u0932\u093f\u0916\u093f\u0924 \u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902')}
                </Button>
                {loading && <LoadingBar active={loading} estimatedTime={12} label={t('AI is preparing your questions...', 'AI \u092a\u094d\u0930\u0936\u094d\u0928 \u0924\u0948\u092f\u093e\u0930 \u0915\u0930 \u0930\u0939\u093e \u0939\u0948...')} />}
              </form>
            </CardContent>
          </Card>
        )}

        {/* VOICE */}
        {phase === 'interview' && mode === 'spoken' && (
          <div className="space-y-4">
            <Button onClick={() => { setPhase('setup'); setMode('written') }} variant="ghost" className="text-sm text-muted-foreground">&larr; {t('Back to setup', '\u0938\u0947\u091f\u0905\u092a \u092a\u0930 \u0935\u093e\u092a\u0938')}</Button>
            <VoiceInterview jobRole={jobRole} interviewType={interviewType} onComplete={() => setPhase('setup')} />
          </div>
        )}

        {/* WRITTEN */}
        {phase === 'interview' && mode === 'written' && questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('Question ' + (currentIndex + 1) + ' of ' + questions.length, '\u092a\u094d\u0930\u0936\u094d\u0928 ' + (currentIndex + 1) + ' / ' + questions.length)}</span>
              <span>{jobRole}</span>
            </div>
            <Progress value={(currentIndex / questions.length) * 100} />
            <Card className="dark:bg-slate-900/50">
              <CardHeader><CardTitle className="text-lg dark:text-white">{questions[currentIndex]}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {!showingFeedback && (
                  <>
                    <textarea className="w-full min-h-[150px] p-3 text-sm border rounded-md bg-background resize-y dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder={t('Type your answer here...', '\u0905\u092a\u0928\u093e \u091c\u0935\u093e\u092c \u092f\u0939\u093e\u0901 \u091f\u093e\u0907\u092a \u0915\u0930\u0947\u0902...')} value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} />
                    <Button onClick={submitAnswer} className="w-full" disabled={feedbackLoading || !currentAnswer.trim()}>
                      {feedbackLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('Analyzing...', '\u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923...')}</> : t('Submit Answer', '\u091c\u0935\u093e\u092c \u091c\u092e\u093e \u0915\u0930\u0947\u0902')}
                    </Button>
                    {feedbackLoading && <LoadingBar active={feedbackLoading} estimatedTime={8} label={t('AI is analyzing your answer...', 'AI \u0906\u092a\u0915\u0947 \u091c\u0935\u093e\u092c \u0915\u093e \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923 \u0915\u0930 \u0930\u0939\u093e \u0939\u0948...')} />}
                  </>
                )}
                {showingFeedback && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">{t('Your answer:', '\u0906\u092a\u0915\u093e \u091c\u0935\u093e\u092c:')}</p>
                      <p className="text-sm dark:text-slate-200">{answers[currentIndex]}</p>
                    </div>
                    {answerFeedbacks[currentIndex] ? (
                      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">{t('AI Feedback', 'AI \u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e')}</span>
                          <span className={'text-sm font-bold px-3 py-1 rounded-full ' + scoreColor(answerFeedbacks[currentIndex]!.score)}>{answerFeedbacks[currentIndex]!.score}%</span>
                        </div>
                        <p className="text-sm dark:text-slate-200">{answerFeedbacks[currentIndex]!.feedback}</p>
                        <div className="flex items-start gap-2 text-sm bg-white dark:bg-slate-800 p-3 rounded-md border dark:border-slate-700">
                          <span className="text-primary mt-0.5">{'\U0001f4a1'}</span>
                          <span className="dark:text-slate-200">{answerFeedbacks[currentIndex]!.tip}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
                        {t("Feedback unavailable - won't affect your final score.", '\u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902 - \u0905\u0902\u0924\u093f\u092e \u0938\u094d\u0915\u094b\u0930 \u092a\u0930 \u0905\u0938\u0930 \u0928\u0939\u0940\u0902\u0964')}
                      </div>
                    )}
                    <Button onClick={nextQuestion} className="w-full" disabled={loading}>
                      {currentIndex < questions.length - 1 ? t('Next Question \u2192', '\u0905\u0917\u0932\u093e \u092a\u094d\u0930\u0936\u094d\u0928 \u2192') : loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('Getting feedback...', '\u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e...')}</> : <><CheckCircle className="mr-2 h-4 w-4" />{t('Finish & Get Feedback', '\u0938\u092e\u093e\u092a\u094d\u0924 \u0915\u0930\u0947\u0902')}</>}
                    </Button>
                    {loading && <LoadingBar active={loading} estimatedTime={20} label={t('Generating overall feedback...', '\u0938\u092e\u0917\u094d\u0930 \u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e \u0924\u0948\u092f\u093e\u0930 \u0939\u094b \u0930\u0939\u0940 \u0939\u0948...')} />}
                  </div>
                )}
                {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
              </CardContent>
            </Card>
          </div>
        )}

        {/* REVIEW */}
        {phase === 'review' && feedback && (
          <div className="space-y-6">
            <Card className="dark:bg-slate-900/50">
              <CardHeader><CardTitle className="dark:text-white">{t('Overall Score', '\u0915\u0941\u0932 \u0938\u094d\u0915\u094b\u0930')}</CardTitle></CardHeader>
              <CardContent><div className="flex items-center gap-4"><Progress value={feedback.overallScore} className="flex-1" /><span className="text-2xl font-bold dark:text-white">{feedback.overallScore}%</span></div></CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <Card className="dark:bg-slate-900/50">
                <CardHeader><CardTitle className="text-sm text-green-600">{t('Strengths', '\u0924\u093e\u0915\u0924')}</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1">{feedback.strengths.map((s, i) => <li key={i} className="text-sm flex gap-2 dark:text-slate-200"><span className="text-green-500">{'\u2713'}</span>{s}</li>)}</ul></CardContent>
              </Card>
              <Card className="dark:bg-slate-900/50">
                <CardHeader><CardTitle className="text-sm text-orange-600">{t('Areas to Improve', '\u0938\u0941\u0927\u093e\u0930 \u0915\u0947 \u0915\u094d\u0937\u0947\u0924\u094d\u0930')}</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1">{feedback.weaknesses.map((w, i) => <li key={i} className="text-sm flex gap-2 dark:text-slate-200"><span className="text-orange-500">!</span>{w}</li>)}</ul></CardContent>
              </Card>
            </div>
            <Card className="dark:bg-slate-900/50">
              <CardHeader><CardTitle className="dark:text-white">{t('Per-Question Feedback', '\u092a\u094d\u0930\u0924\u093f-\u092a\u094d\u0930\u0936\u094d\u0928 \u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">{feedback.perQuestion.map((pq, i) => (
                <div key={i} className="border-b dark:border-slate-700 pb-3 last:border-b-0">
                  <p className="text-sm font-medium dark:text-white">{pq.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">{pq.feedback}</p>
                  <div className="flex items-center gap-2 mt-2"><Progress value={pq.score} className="w-24 h-2" /><span className="text-xs text-muted-foreground">{pq.score}%</span></div>
                </div>
              ))}</CardContent>
            </Card>
            <Card className="dark:bg-slate-900/50">
              <CardHeader><CardTitle className="dark:text-white">{t('Tips', '\u0938\u0941\u091d\u093e\u0935')}</CardTitle></CardHeader>
              <CardContent><ul className="space-y-1">{feedback.tips.map((tip, i) => <li key={i} className="text-sm flex gap-2 dark:text-slate-200"><span className="text-primary">{'\u2022'}</span>{tip}</li>)}</ul></CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardContent className="p-6 text-center space-y-3">
                <h3 className="text-lg font-semibold dark:text-white">{t('Want a detailed report?', '\u0935\u093f\u0938\u094d\u0924\u0943\u0924 \u0930\u093f\u092a\u094b\u0930\u094d\u091f \u091a\u093e\u0939\u093f\u090f?')}</h3>
                <p className="text-sm text-muted-foreground">{t('Get skill gap assessment and action plan.', '\u0915\u094c\u0936\u0932 \u0905\u0902\u0924\u0930 \u0914\u0930 \u0915\u093e\u0930\u094d\u092f \u092f\u094b\u091c\u0928\u093e \u092a\u094d\u0930\u093e\u092a\u094d\u0924 \u0915\u0930\u0947\u0902\u0964')}</p>
                {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
                <Button onClick={generateReport} disabled={reportLoading} className="px-8" size="lg">
                  {reportLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('Generating...', '\u092c\u0928 \u0930\u0939\u0940 \u0939\u0948...')}</> : <><Download className="mr-2 h-4 w-4" />{t('Generate Full Report', '\u092a\u0942\u0930\u0940 \u0930\u093f\u092a\u094b\u0930\u094d\u091f \u092c\u0928\u093e\u090f\u0902')}</>}
                </Button>
                {reportLoading && <LoadingBar active={reportLoading} estimatedTime={25} label={t('Preparing report...', '\u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0924\u0948\u092f\u093e\u0930 \u0939\u094b \u0930\u0939\u0940 \u0939\u0948...')} />}
              </CardContent>
            </Card>
            <Button onClick={startOver} variant="outline" className="w-full">{t('Start New Interview', '\u0928\u092f\u093e \u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902')}</Button>
          </div>
        )}

        {/* REPORT */}
        {phase === 'report' && report && (
          <div className="space-y-6">
            {report.emailSent && <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400"><Mail className="h-4 w-4" />{t('Report emailed to ' + userEmail, '\u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0908\u092e\u0947\u0932 \u0915\u0940 \u0917\u0908')}</div>}
            {report.emailSent === false && <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400"><AlertCircle className="h-4 w-4" />{t('Email could not be sent.', '\u0908\u092e\u0947\u0932 \u0928\u0939\u0940\u0902 \u092d\u0947\u091c\u0940 \u091c\u093e \u0938\u0915\u0940\u0964')}</div>}
            <Card className="dark:bg-slate-900/50"><CardContent className="p-6"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold dark:text-white">{report.jobRole}</h2><p className="text-muted-foreground">{typeLabels[report.interviewType]?.[lang] || report.interviewType}</p></div><div className="text-3xl font-bold dark:text-white">{report.overallScore}%</div></div></CardContent></Card>
            {report.executiveSummary && <Card className="dark:bg-slate-900/50"><CardHeader><CardTitle className="dark:text-white">{t('Executive Summary', '\u0915\u093e\u0930\u094d\u092f\u0915\u093e\u0930\u0940 \u0938\u093e\u0930\u093e\u0902\u0936')}</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed dark:text-slate-200">{report.executiveSummary}</p></CardContent></Card>}
            {report.performanceAnalysis && <Card className="dark:bg-slate-900/50"><CardHeader><CardTitle className="dark:text-white">{t('Performance Analysis', '\u092a\u094d\u0930\u0926\u0930\u094d\u0936\u0928 \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923')}</CardTitle></CardHeader><CardContent><p className="text-sm leading-relaxed dark:text-slate-200">{report.performanceAnalysis}</p></CardContent></Card>}
            {report.skillGaps?.length > 0 && <Card className="dark:bg-slate-900/50"><CardHeader><CardTitle className="text-orange-600">{t('Skill Gaps', '\u0915\u094c\u0936\u0932 \u0905\u0902\u0924\u0930')}</CardTitle></CardHeader><CardContent><ul className="space-y-2">{report.skillGaps.map((g, i) => <li key={i} className="text-sm flex gap-2 dark:text-slate-200"><span className="text-orange-500">{'\u26a0'}</span>{g}</li>)}</ul></CardContent></Card>}
            {report.actionPlan?.length > 0 && <Card className="dark:bg-slate-900/50"><CardHeader><CardTitle className="text-primary">{t('Action Plan', '\u0915\u093e\u0930\u094d\u092f \u092f\u094b\u091c\u0928\u093e')}</CardTitle></CardHeader><CardContent><ol className="space-y-3">{report.actionPlan.map((s, i) => <li key={i} className="text-sm flex gap-3 dark:text-slate-200"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>{s}</li>)}</ol></CardContent></Card>}
            {report.resources?.length > 0 && <Card className="dark:bg-slate-900/50"><CardHeader><CardTitle className="dark:text-white">{t('Resources', '\u0938\u0902\u0938\u093e\u0927\u0928')}</CardTitle></CardHeader><CardContent><ul className="space-y-1">{report.resources.map((r, i) => <li key={i} className="text-sm flex gap-2 dark:text-slate-200"><span className="text-primary">{'\U0001f4da'}</span>{r}</li>)}</ul></CardContent></Card>}
            <div className="flex gap-3">
              <Button onClick={() => setPhase('review')} variant="outline" className="flex-1">{'\u2190'} {t('Back to Feedback', '\u092a\u094d\u0930\u0924\u093f\u0915\u094d\u0930\u093f\u092f\u093e \u092a\u0930 \u0935\u093e\u092a\u0938')}</Button>
              <Button onClick={startOver} className="flex-1">{t('Start New Interview', '\u0928\u092f\u093e \u0907\u0902\u091f\u0930\u0935\u094d\u092f\u0942 \u0936\u0941\u0930\u0942 \u0915\u0930\u0947\u0902')}</Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
