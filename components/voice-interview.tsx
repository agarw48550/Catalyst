'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LoadingBar } from '@/components/ui/loading-bar'
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2, Clock, CheckCircle2 } from 'lucide-react'
import type { InterviewDifficulty } from '@/lib/validations'
import {
  INTERVIEW_DURATION_MINUTES,
  INTERVIEW_QUESTION_COUNT,
  type InterviewReport,
} from '@/lib/interview/prompts'

interface VoiceInterviewProps {
  applicationId: string
  jobRole: string
  company: string
  difficulty: InterviewDifficulty
  onComplete: () => void
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error' | 'ended'

const LIVE_MODEL_FALLBACKS = [
  'gemini-3.1-flash-live-preview',
  'gemini-3-flash-live',
  'gemini-2.5-flash-native-audio-preview-12-2025',
] as const

function appendTranscript(
  prev: { role: 'user' | 'model'; text: string }[],
  role: 'user' | 'model',
  text: string,
) {
  if (!text) return prev
  const last = prev[prev.length - 1]
  if (last && last.role === role) {
    return [...prev.slice(0, -1), { role, text: last.text + text }]
  }
  return [...prev, { role, text }]
}

export function VoiceInterview({ applicationId, jobRole, company, difficulty, onComplete }: VoiceInterviewProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<{ role: 'user' | 'model'; text: string }[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(INTERVIEW_QUESTION_COUNT[difficulty])
  const [durationRange, setDurationRange] = useState(INTERVIEW_DURATION_MINUTES[difficulty])
  const [report, setReport] = useState<InterviewReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const finishingRef = useRef(false)
  const finishInterviewRef = useRef<() => void>(() => undefined)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<ConnectionStatus>('idle')
  const transcriptRef = useRef(transcript)
  const intentionalCloseRef = useRef(false)
  const mutedRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { transcriptRef.current = transcript }, [transcript])
  useEffect(() => { mutedRef.current = isMuted }, [isMuted])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcript])

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    isPlayingRef.current = true
    const ctx = audioContextRef.current
    if (!ctx) { isPlayingRef.current = false; return }

    if (ctx.state === 'suspended') {
      try { await ctx.resume() } catch { /* ignore */ }
    }

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift()!
      try {
        const pcm16 = new Int16Array(chunk)
        const float32 = new Float32Array(pcm16.length)
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768
        const buf = ctx.createBuffer(1, float32.length, 24000)
        buf.getChannelData(0).set(float32)
        const src = ctx.createBufferSource()
        src.buffer = buf
        src.connect(ctx.destination)
        src.start()
        await new Promise<void>((r) => { src.onended = () => r() })
      } catch {
        // skip bad audio chunk
      }
    }
    isPlayingRef.current = false
  }, [])

  function stopAudioCapture() {
    try { processorRef.current?.disconnect() } catch { /* ignore */ }
    processorRef.current = null
  }

  function cleanup() {
    stopAudioCapture()
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
    audioQueueRef.current = []
    isPlayingRef.current = false
  }

  const startAudioCapture = useCallback((ws: WebSocket, audioContext: AudioContext, stream: MediaStream) => {
    stopAudioCapture()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)

    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    processor.onaudioprocess = (e) => {
      if (mutedRef.current || ws.readyState !== WebSocket.OPEN) return
      const input = e.inputBuffer.getChannelData(0)

      analyser.getByteFrequencyData(dataArray)
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
      setAudioLevel((sum / dataArray.length / 255) * 100)

      const pcm16 = new Int16Array(input.length)
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }
      const bytes = new Uint8Array(pcm16.buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])

      ws.send(JSON.stringify({
        realtimeInput: {
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: btoa(binary),
          },
        },
      }))
    }

    source.connect(processor)
    // Keep the processor graph alive without echoing mic to speakers
    const silent = audioContext.createGain()
    silent.gain.value = 0
    processor.connect(silent)
    silent.connect(audioContext.destination)
    setStatus('listening')
  }, [])

  async function saveSession(nextStatus: 'completed' | 'cancelled', currentTranscript: typeof transcript) {
    const id = sessionIdRef.current
    if (!id) return
    try {
      await fetch('/api/interview/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: id,
          transcript: currentTranscript,
          status: nextStatus,
        }),
      })
    } catch {
      // non-blocking
    }
  }

  async function generateReport(currentTranscript: typeof transcript) {
    const id = sessionIdRef.current
    if (!id || currentTranscript.length === 0) {
      setReportError('Not enough conversation was captured to generate a report.')
      return
    }
    setReportLoading(true)
    setReportError(null)
    try {
      const res = await fetch('/api/interview/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: id,
          jobTitle: jobRole,
          company,
          difficulty,
          transcript: currentTranscript,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate report')
      }
      const data = await res.json()
      setReport(data.report as InterviewReport)
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setReportLoading(false)
    }
  }

  function finishInterview() {
    if (finishingRef.current) return
    finishingRef.current = true
    intentionalCloseRef.current = true
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close()
    cleanup()
    setStatus('ended')
    const current = transcriptRef.current
    void saveSession('completed', current)
    void generateReport(current)
  }
  finishInterviewRef.current = finishInterview

  const handleServerPayload = useCallback((
    data: any,
    ws: WebSocket,
    audioContext: AudioContext,
    stream: MediaStream,
    onSetupComplete: () => void,
    onSetupError: (message: string) => void,
  ) => {
    if (!data || typeof data !== 'object') return

    if (data.error) {
      onSetupError(data.error.message || JSON.stringify(data.error))
      return
    }

    if (data.setupComplete) {
      setStatus('connected')
      startAudioCapture(ws, audioContext, stream)
      ws.send(JSON.stringify({
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{ text: 'Please begin the interview now with a clear opening: introduce yourself, say how long this will take and how many questions there are, then ask me to introduce myself.' }],
          }],
          turnComplete: true,
        },
      }))
      onSetupComplete()
      return
    }

    if (data.serverContent) {
      const content = data.serverContent
      if (content.interrupted) {
        audioQueueRef.current = []
        isPlayingRef.current = false
      }

      if (content.inputTranscription?.text) {
        setTranscript((prev) => appendTranscript(prev, 'user', content.inputTranscription.text))
      }
      if (content.outputTranscription?.text) {
        setTranscript((prev) => appendTranscript(prev, 'model', content.outputTranscription.text))
      }

      const parts = content.modelTurn?.parts || []
      for (const part of parts) {
        if (part.text) {
          setTranscript((prev) => appendTranscript(prev, 'model', part.text))
        }
        if (part.inlineData?.data) {
          const raw = atob(part.inlineData.data)
          const buf = new ArrayBuffer(raw.length)
          const view = new Uint8Array(buf)
          for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
          audioQueueRef.current.push(buf)
          setStatus('speaking')
          void playAudioQueue()
        }
      }

      if (content.turnComplete) setStatus('listening')
    }
  }, [playAudioQueue, startAudioCapture])

  const connectWithModel = useCallback(async (
    args: {
      apiKey: string
      websocketUrl: string
      systemInstruction: string
      model: string
      stream: MediaStream
      audioContext: AudioContext
      remainingModels: string[]
    }
  ) => {
    const { apiKey, websocketUrl, systemInstruction, model, stream, audioContext, remainingModels } = args
    intentionalCloseRef.current = false
    setActiveModel(model)

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${websocketUrl}?key=${encodeURIComponent(apiKey)}`)
      wsRef.current = ws
      let settled = false

      const settleOk = () => {
        if (settled) return
        settled = true
        clearTimeout(timeoutId)
        resolve()
      }
      const settleErr = (message: string) => {
        if (settled) return
        settled = true
        clearTimeout(timeoutId)
        reject(new Error(message))
      }

      const timeoutId = window.setTimeout(() => {
        intentionalCloseRef.current = true
        try { ws.close() } catch { /* ignore */ }
        if (remainingModels.length > 0) {
          settleErr(`MODEL_RETRY:timeout:${model}`)
        } else {
          settleErr(`Timed out connecting to ${model}. Check that GEMINI_API_KEY is a valid Google AI Studio key with Live API access.`)
        }
      }, 12000)

      ws.onopen = () => {
        // Live API supports ONLY one response modality. Use AUDIO + transcriptions.
        ws.send(JSON.stringify({
          setup: {
            model: model.startsWith('models/') ? model : `models/${model}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
              },
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        }))
      }

      ws.onmessage = (event) => {
        const processText = (text: string) => {
          try {
            handleServerPayload(
              JSON.parse(text),
              ws,
              audioContext,
              stream,
              settleOk,
              (message) => {
                intentionalCloseRef.current = true
                try { ws.close() } catch { /* ignore */ }
                settleErr(message)
              },
            )
          } catch {
            // ignore malformed messages
          }
        }

        // Gemini Live may send JSON as string OR Blob/ArrayBuffer
        if (typeof event.data === 'string') {
          processText(event.data)
          return
        }

        if (event.data instanceof Blob) {
          void event.data.text().then(processText).catch(() => undefined)
          return
        }

        if (event.data instanceof ArrayBuffer) {
          processText(new TextDecoder().decode(event.data))
        }
      }

      ws.onerror = () => {
        settleErr('WebSocket connection failed. Check your Gemini API key and model access.')
      }

      ws.onclose = (event) => {
        if (!settled) {
          if (remainingModels.length > 0) {
            settleErr(`MODEL_RETRY:${event.code}:${event.reason || 'closed'}`)
            return
          }
          const detail = event.reason || `code ${event.code}`
          settleErr(`Interview connection closed before start (${detail}). Check GEMINI_API_KEY and Live model access.`)
          return
        }

        if (intentionalCloseRef.current) {
          cleanup()
          return
        }

        if (statusRef.current !== 'error' && statusRef.current !== 'ended') {
          finishInterviewRef.current()
        } else {
          cleanup()
        }
      }
    }).catch(async (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      if (message.startsWith('MODEL_RETRY:') && remainingModels.length > 0) {
        const [next, ...rest] = remainingModels
        return connectWithModel({
          apiKey,
          websocketUrl,
          systemInstruction,
          model: next,
          stream,
          audioContext,
          remainingModels: rest,
        })
      }
      throw err instanceof Error ? err : new Error(message)
    })
  }, [handleServerPayload])

  const startSession = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    setTranscript([])
    setReport(null)
    setReportError(null)
    finishingRef.current = false
    intentionalCloseRef.current = false

    try {
      const res = await fetch('/api/interview/voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, difficulty }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create session')
      }
      const data = await res.json()
      const { apiKey, model, systemInstruction, websocketUrl, sessionId: newSessionId } = data
      setSessionId(newSessionId)
      if (typeof data.questionCount === 'number') setQuestionCount(data.questionCount)
      if (data.durationMinutes?.min && data.durationMinutes?.max) {
        setDurationRange({ min: data.durationMinutes.min, max: data.durationMinutes.max })
      }

      if (!apiKey) throw new Error('Gemini API key was not returned by the server')

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      mediaStreamRef.current = stream

      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext
      if (audioContext.state === 'suspended') await audioContext.resume()

      const preferred = typeof model === 'string' && model ? model : LIVE_MODEL_FALLBACKS[0]
      const candidates = [preferred, ...LIVE_MODEL_FALLBACKS.filter((m) => m !== preferred)]

      await connectWithModel({
        apiKey,
        websocketUrl,
        systemInstruction,
        model: candidates[0],
        stream,
        audioContext,
        remainingModels: candidates.slice(1),
      })
    } catch (err: unknown) {
      intentionalCloseRef.current = true
      wsRef.current?.close()
      setError(err instanceof Error ? err.message : 'Failed to start')
      setStatus('error')
      cleanup()
    }
  }, [applicationId, connectWithModel, difficulty])

  function endSession() {
    finishInterview()
  }

  function toggleMute() {
    setIsMuted((prev) => {
      const next = !prev
      mediaStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next })
      return next
    })
  }

  const statusConfig: Record<ConnectionStatus, { label: string; color: string }> = {
    idle: { label: 'Ready to start', color: 'text-slate-500' },
    connecting: { label: 'Connecting...', color: 'text-amber-500' },
    connected: { label: 'Interview started', color: 'text-green-500' },
    speaking: { label: 'Interviewer speaking...', color: 'text-blue-500' },
    listening: { label: 'Your turn — listening...', color: 'text-green-500' },
    error: { label: 'Error', color: 'text-red-500' },
    ended: { label: 'Interview complete', color: 'text-slate-500' },
  }

  const isLive = status === 'connected' || status === 'speaking' || status === 'listening'

  return (
    <div className="space-y-4">
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between dark:text-white">
            <span>Live Interview — {company}</span>
            <span className={`text-sm font-normal ${statusConfig[status].color}`}>
              {'\u25CF'} {statusConfig[status].label}
            </span>
          </CardTitle>
          <CardDescription>
            {jobRole} · {difficulty} mode
            {activeModel ? ` · ${activeModel}` : ''} — coaching after answers, with sincere compliments when earned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              ~{durationRange.min}–{durationRange.max} min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-muted-foreground">
              {questionCount} scored questions
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                In progress — interviewer will announce remaining questions
              </span>
            )}
            {status === 'ended' && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Session ended
              </span>
            )}
          </div>

          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
          {status === 'connecting' && <LoadingBar active estimatedTime={5} label="Connecting to AI interviewer..." />}

          {(status === 'listening' || status === 'speaking') && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div className="relative">
                {status === 'listening'
                  ? <Mic className="h-8 w-8 text-green-500" />
                  : <Volume2 className="h-8 w-8 text-blue-500 animate-pulse" />}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${status === 'listening' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, status === 'listening' ? audioLevel * 3 : 50)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {(status === 'idle' || status === 'error') ? (
              <Button onClick={startSession} className="gap-2 h-12 px-6 rounded-xl">
                <Phone className="h-5 w-5" /> Start Interview
              </Button>
            ) : status === 'connecting' ? (
              <Button disabled className="gap-2 h-12 px-6 rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin" /> Connecting...
              </Button>
            ) : status === 'ended' ? (
              <Button onClick={onComplete} variant="outline" className="gap-2 h-12 px-6 rounded-xl">
                Back to setup
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  className={`gap-2 h-12 px-6 rounded-xl ${isMuted ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button onClick={endSession} variant="destructive" className="gap-2 h-12 px-6 rounded-xl">
                  <PhoneOff className="h-5 w-5" /> End Interview
                </Button>
              </>
            )}
          </div>

          {status === 'ended' && (
            <div className="space-y-3 rounded-xl border p-4">
              <h4 className="font-semibold">Interview report</h4>
              {reportLoading && (
                <LoadingBar active estimatedTime={12} label="Generating your coaching report from the transcript..." />
              )}
              {reportError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{reportError}</div>
              )}
              {report && (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-muted-foreground">{report.summary}</p>
                    <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-lg font-bold text-primary">
                      {report.overallScore}/100
                    </span>
                  </div>
                  {report.topicsDiscussed.length > 0 && (
                    <div>
                      <p className="mb-1 font-medium">What you talked about</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {report.topicsDiscussed.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.strengths.length > 0 && (
                    <div>
                      <p className="mb-1 font-medium text-green-700 dark:text-green-400">What went well</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {report.strengths.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.gaps.length > 0 && (
                    <div>
                      <p className="mb-1 font-medium text-amber-700 dark:text-amber-400">Gaps / holes</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {report.gaps.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.improvements.length > 0 && (
                    <div>
                      <p className="mb-1 font-medium">How to improve</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {report.improvements.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {transcript.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2 text-slate-500 dark:text-slate-400">Live Transcript</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                {transcript.map((entry, i) => (
                  <div
                    key={i}
                    className={`text-sm p-2 rounded-lg ${entry.role === 'model'
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-200 ml-8'}`}
                  >
                    <span className="font-semibold text-xs uppercase tracking-wider opacity-60">
                      {entry.role === 'model' ? 'Interviewer' : 'You'}
                    </span>
                    <p className="mt-0.5">{entry.text}</p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
