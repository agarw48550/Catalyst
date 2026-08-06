'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LoadingBar } from '@/components/ui/loading-bar'
import { Progress } from '@/components/ui/progress'
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2, Clock, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import type { InterviewDifficulty, ResumeOutputLanguage } from '@/lib/validations'
import {
  INTERVIEW_DURATION_MINUTES,
  INTERVIEW_LIVE_TOOLS,
  INTERVIEW_QUESTION_COUNT,
  type InterviewReport,
} from '@/lib/interview/prompts'

interface VoiceInterviewProps {
  applicationId: string
  jobRole: string
  company: string
  difficulty: InterviewDifficulty
  language?: ResumeOutputLanguage
  onComplete: () => void
}

interface InterviewProgressState {
  questionsCompleted: number
  totalQuestions: number
  estimatedMinutesRemaining: number | null
  progressPercent: number
  statusNote: string
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

export function VoiceInterview({
  applicationId,
  jobRole,
  company,
  difficulty,
  language = 'en',
  onComplete,
}: VoiceInterviewProps) {
  const { t } = useLanguage()
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
  const [progress, setProgress] = useState<InterviewProgressState>({
    questionsCompleted: 0,
    totalQuestions: INTERVIEW_QUESTION_COUNT[difficulty],
    estimatedMinutesRemaining: INTERVIEW_DURATION_MINUTES[difficulty].max,
    progressPercent: 0,
    statusNote: '',
  })

  const wsRef = useRef<WebSocket | null>(null)
  const finishingRef = useRef(false)
  const pendingEndRef = useRef(false)
  const finishInterviewRef = useRef<() => void>(() => undefined)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const playbackGenerationRef = useRef(0)
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const aiSpeakingRef = useRef(false)
  const modelTurnOpenRef = useRef(false)
  const kickoffSentRef = useRef(false)
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

  const clearAudioPlayback = useCallback(() => {
    playbackGenerationRef.current += 1
    audioQueueRef.current = []
    try { activeSourceRef.current?.stop() } catch { /* already stopped */ }
    activeSourceRef.current = null
    isPlayingRef.current = false
    modelTurnOpenRef.current = false
    aiSpeakingRef.current = false
  }, [])

  const releaseMicIfIdle = useCallback(() => {
    if (modelTurnOpenRef.current) return
    if (isPlayingRef.current || audioQueueRef.current.length > 0) return
    aiSpeakingRef.current = false
    if (statusRef.current === 'speaking' || statusRef.current === 'connected') {
      setStatus('listening')
    }
  }, [])

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    isPlayingRef.current = true
    const generation = playbackGenerationRef.current
    const ctx = audioContextRef.current
    if (!ctx) {
      isPlayingRef.current = false
      releaseMicIfIdle()
      return
    }

    if (ctx.state === 'suspended') {
      try { await ctx.resume() } catch { /* ignore */ }
    }

    while (audioQueueRef.current.length > 0) {
      // Abort if a newer playback generation started (interrupt / cleanup)
      if (playbackGenerationRef.current !== generation) break

      const chunk = audioQueueRef.current.shift()!
      try {
        const pcm16 = new Int16Array(chunk)
        const float32 = new Float32Array(pcm16.length)
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768
        const buf = ctx.createBuffer(1, float32.length, 24000)
        buf.getChannelData(0).set(float32)
        const src = ctx.createBufferSource()
        activeSourceRef.current = src
        src.buffer = buf
        src.connect(ctx.destination)
        src.start()
        await new Promise<void>((r) => { src.onended = () => r() })
        if (activeSourceRef.current === src) activeSourceRef.current = null
      } catch {
        // skip bad audio chunk
      }
    }

    if (playbackGenerationRef.current === generation) {
      isPlayingRef.current = false
      releaseMicIfIdle()
    }
  }, [releaseMicIfIdle])

  function stopAudioCapture() {
    try { processorRef.current?.disconnect() } catch { /* ignore */ }
    processorRef.current = null
  }

  function cleanup() {
    stopAudioCapture()
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    clearAudioPlayback()
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
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
      // Do not stream mic while the AI is talking — speaker echo makes the model
      // hear itself and often restart/repeat the same phrase.
      if (mutedRef.current || aiSpeakingRef.current || ws.readyState !== WebSocket.OPEN) return
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

  const handleToolCalls = useCallback((ws: WebSocket, functionCalls: any[]) => {
    if (!Array.isArray(functionCalls) || functionCalls.length === 0) return

    const responses = functionCalls.map((call) => {
      const name = call.name as string
      let args = call.args || call.arguments || {}
      if (typeof args === 'string') {
        try { args = JSON.parse(args) } catch { args = {} }
      }

      if (name === 'update_interview_progress') {
        const questionsCompleted = Number(args.questionsCompleted ?? 0)
        const totalQuestions = Math.max(1, Number(args.totalQuestions ?? questionCount))
        const progressPercent = Math.max(0, Math.min(100, Number(args.progressPercent ?? 0)))
        const estimatedMinutesRemaining = args.estimatedMinutesRemaining != null
          ? Number(args.estimatedMinutesRemaining)
          : null
        const statusNote = typeof args.statusNote === 'string' ? args.statusNote : ''

        setQuestionCount(totalQuestions)
        setProgress({
          questionsCompleted,
          totalQuestions,
          estimatedMinutesRemaining: Number.isFinite(estimatedMinutesRemaining as number)
            ? (estimatedMinutesRemaining as number)
            : null,
          progressPercent,
          statusNote,
        })

        return {
          id: call.id,
          name,
          response: { ok: true, progressPercent, questionsCompleted, totalQuestions },
        }
      }

      if (name === 'end_interview') {
        pendingEndRef.current = true
        setProgress((prev) => ({
          ...prev,
          progressPercent: 100,
          statusNote: typeof args.reason === 'string' ? `Ending: ${args.reason}` : 'Ending interview',
          estimatedMinutesRemaining: 0,
        }))
        return {
          id: call.id,
          name,
          response: { ok: true, willEnd: true },
        }
      }

      return {
        id: call.id,
        name,
        response: { ok: false, error: 'Unknown tool' },
      }
    })

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        toolResponse: { functionResponses: responses },
      }))
    }
  }, [questionCount])

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
      // Hold mic closed until after the opening so echo can't make the model
      // restart its greeting. Start capture after sending kickoff, but keep
      // aiSpeakingRef true until the first model turn finishes.
      if (!kickoffSentRef.current) {
        kickoffSentRef.current = true
        modelTurnOpenRef.current = true
        aiSpeakingRef.current = true
        ws.send(JSON.stringify({
          clientContent: {
            turns: [{
              role: 'user',
              parts: [{ text: 'Please begin the interview now with a clear opening: introduce yourself, say how long this will take and how many questions there are, call update_interview_progress for the opening state, then ask me to introduce myself. Do not repeat this opening.' }],
            }],
            turnComplete: true,
          },
        }))
      }
      startAudioCapture(ws, audioContext, stream)
      onSetupComplete()
      return
    }

    const toolCalls = data.toolCall?.functionCalls || data.toolCall?.function_calls
    if (toolCalls) {
      handleToolCalls(ws, toolCalls)
    }

    if (data.serverContent) {
      const content = data.serverContent
      if (content.interrupted) {
        clearAudioPlayback()
      }

      if (content.inputTranscription?.text) {
        setTranscript((prev) => appendTranscript(prev, 'user', content.inputTranscription.text))
      }

      // Prefer dedicated output transcription; avoid also appending part.text
      // when both are present (that doubles transcript lines).
      const hasOutputTranscription = Boolean(content.outputTranscription?.text)
      if (hasOutputTranscription) {
        setTranscript((prev) => appendTranscript(prev, 'model', content.outputTranscription.text))
      }

      const parts = content.modelTurn?.parts || []
      let receivedAudio = false
      for (const part of parts) {
        if (part.text && !hasOutputTranscription) {
          setTranscript((prev) => appendTranscript(prev, 'model', part.text))
        }
        if (part.functionCall) {
          handleToolCalls(ws, [part.functionCall])
        }
        if (part.inlineData?.data) {
          const raw = atob(part.inlineData.data)
          const buf = new ArrayBuffer(raw.length)
          const view = new Uint8Array(buf)
          for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
          audioQueueRef.current.push(buf)
          receivedAudio = true
        }
      }

      if (receivedAudio) {
        modelTurnOpenRef.current = true
        aiSpeakingRef.current = true
        setStatus('speaking')
        void playAudioQueue()
      }

      if (content.turnComplete) {
        modelTurnOpenRef.current = false
        releaseMicIfIdle()
        if (pendingEndRef.current) {
          window.setTimeout(() => finishInterviewRef.current(), 2500)
        }
      }
    }
  }, [clearAudioPlayback, handleToolCalls, playAudioQueue, releaseMicIfIdle, startAudioCapture])

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
        // Live API supports ONLY one response modality. Use AUDIO + transcriptions + progress tools.
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
            tools: INTERVIEW_LIVE_TOOLS,
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
    pendingEndRef.current = false
    intentionalCloseRef.current = false
    kickoffSentRef.current = false
    clearAudioPlayback()
    setProgress({
      questionsCompleted: 0,
      totalQuestions: INTERVIEW_QUESTION_COUNT[difficulty],
      estimatedMinutesRemaining: INTERVIEW_DURATION_MINUTES[difficulty].max,
      progressPercent: 0,
      statusNote: '',
    })

    try {
      const res = await fetch('/api/interview/voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, difficulty, language }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create session')
      }
      const data = await res.json()
      const { apiKey, model, systemInstruction, websocketUrl, sessionId: newSessionId } = data
      setSessionId(newSessionId)
      if (typeof data.questionCount === 'number') {
        setQuestionCount(data.questionCount)
        setProgress((prev) => ({ ...prev, totalQuestions: data.questionCount }))
      }
      if (data.durationMinutes?.min && data.durationMinutes?.max) {
        setDurationRange({ min: data.durationMinutes.min, max: data.durationMinutes.max })
        setProgress((prev) => ({ ...prev, estimatedMinutesRemaining: data.durationMinutes.max }))
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
  }, [applicationId, clearAudioPlayback, connectWithModel, difficulty, language])

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

  const statusConfig: Record<ConnectionStatus, { label: string; color: string; dot: string }> = {
    idle: { label: 'Ready to start', color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
    connecting: { label: 'Connecting...', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500 animate-pulse' },
    connected: { label: 'Interview started', color: 'text-secondary', dot: 'bg-secondary' },
    speaking: { label: 'Interviewer speaking...', color: 'text-secondary', dot: 'bg-secondary animate-pulse' },
    listening: { label: 'Your turn — listening...', color: 'text-primary', dot: 'bg-primary animate-pulse' },
    error: { label: 'Error', color: 'text-destructive', dot: 'bg-destructive' },
    ended: { label: 'Interview complete', color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  }

  const isLive = status === 'connected' || status === 'speaking' || status === 'listening'

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 bg-card shadow-harbor-md">
        <div className="h-1.5 w-full gradient-bg" />
        <CardHeader className="space-y-3">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-xl font-bold tracking-tight sm:text-2xl">
            <span>Live Interview — {company}</span>
            <span className={`inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-semibold sm:text-sm ${statusConfig[status].color}`}>
              <span className={`h-2 w-2 rounded-full ${statusConfig[status].dot}`} />
              {statusConfig[status].label}
            </span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {jobRole} · {difficulty} mode
            {activeModel ? ` · ${activeModel}` : ''} — coaching after answers, with sincere compliments when earned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2.5 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-secondary" />
              ~{durationRange.min}–{durationRange.max} min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 font-medium text-muted-foreground">
              {progress.totalQuestions || questionCount} scored questions
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1.5 font-medium text-secondary">
                In progress — {t('apps.interviewAdjusting')}
              </span>
            )}
            {status === 'ended' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 font-medium text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                Session ended
              </span>
            )}
          </div>

          {(isLive || status === 'ended' || status === 'connecting') && (
            <div className="space-y-3 rounded-xl border border-border/80 bg-gradient-to-br from-primary/5 via-card to-secondary/10 p-4 shadow-harbor">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">{t('apps.interviewProgress')}</span>
                <span className="font-medium text-muted-foreground">
                  {progress.questionsCompleted}/{progress.totalQuestions}
                  {progress.estimatedMinutesRemaining != null
                    ? ` · ~${Math.max(0, Math.round(progress.estimatedMinutesRemaining))} ${t('apps.interviewMinutesLeft')}`
                    : ''}
                </span>
              </div>
              <Progress value={progress.progressPercent} className="h-2.5" />
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {Math.max(0, progress.totalQuestions - progress.questionsCompleted)} {t('apps.interviewQuestionsLeft')}
                </span>
                <span className="font-semibold text-primary">{progress.progressPercent}%</span>
              </div>
              {progress.statusNote && (
                <p className="text-xs text-muted-foreground">{progress.statusNote}</p>
              )}
              {status === 'connecting' && (
                <LoadingBar active estimatedTime={5} label="Connecting to AI interviewer..." />
              )}
            </div>
          )}

          {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          {(status === 'listening' || status === 'speaking') && (
            <div className={`flex items-center gap-4 rounded-xl border p-4 ${
              status === 'listening'
                ? 'border-primary/25 bg-primary/5'
                : 'border-secondary/25 bg-secondary/5'
            }`}>
              <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                status === 'listening' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'
              }`}>
                <span className={`absolute inset-0 rounded-2xl ${status === 'listening' ? 'bg-primary/20' : 'bg-secondary/20'} animate-soft-pulse`} />
                {status === 'listening'
                  ? <Mic className="relative h-7 w-7" />
                  : <Volume2 className="relative h-7 w-7" />}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold">
                  {status === 'listening' ? 'Listening to you' : 'Interviewer is speaking'}
                </p>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${status === 'listening' ? 'bg-primary' : 'bg-secondary'}`}
                    style={{ width: `${Math.min(100, status === 'listening' ? audioLevel * 3 : 50)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            {(status === 'idle' || status === 'error') ? (
              <Button onClick={startSession} className="h-12 gap-2 rounded-xl px-7 font-bold shadow-harbor-md">
                <Phone className="h-5 w-5" /> Start Interview
              </Button>
            ) : status === 'connecting' ? (
              <Button disabled className="h-12 gap-2 rounded-xl px-7 font-bold">
                <Loader2 className="h-5 w-5 animate-spin" /> Connecting...
              </Button>
            ) : status === 'ended' ? (
              <Button onClick={onComplete} variant="outline" className="h-12 gap-2 rounded-xl px-7 font-semibold shadow-harbor">
                Back to setup
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  className={`h-12 gap-2 rounded-xl px-6 font-semibold shadow-harbor ${isMuted ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15' : ''}`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button onClick={endSession} variant="destructive" className="h-12 gap-2 rounded-xl px-6 font-bold shadow-harbor-md">
                  <PhoneOff className="h-5 w-5" /> End Interview
                </Button>
              </>
            )}
          </div>

          {status === 'ended' && (
            <div className="space-y-4 rounded-xl border border-border/80 bg-muted/30 p-5 shadow-harbor">
              <h4 className="text-lg font-bold tracking-tight">Interview report</h4>
              {reportLoading && (
                <LoadingBar active estimatedTime={12} label="Generating your coaching report from the transcript..." />
              )}
              {reportError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{reportError}</div>
              )}
              {report && (
                <div className="space-y-4 text-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-muted-foreground leading-relaxed">{report.summary}</p>
                    <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary/10 px-4 py-2 text-xl font-black text-primary">
                      {report.overallScore}/100
                    </span>
                  </div>
                  {report.topicsDiscussed.length > 0 && (
                    <div className="rounded-xl border border-border/70 bg-card p-4">
                      <p className="mb-2 font-semibold text-secondary">What you talked about</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {report.topicsDiscussed.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.strengths.length > 0 && (
                    <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
                      <p className="mb-2 font-semibold text-secondary">What went well</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {report.strengths.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.gaps.length > 0 && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="mb-2 font-semibold text-amber-700 dark:text-amber-400">Gaps / holes</p>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                        {report.gaps.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.improvements.length > 0 && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="mb-2 font-semibold text-primary">How to improve</p>
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
            <div className="mt-2">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Live Transcript</h4>
              <div className="max-h-72 space-y-2.5 overflow-y-auto rounded-xl border border-border/80 bg-muted/40 p-3.5">
                {transcript.map((entry, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 text-sm shadow-harbor ${entry.role === 'model'
                      ? 'border border-secondary/15 bg-secondary/10 text-foreground'
                      : 'ml-6 border border-primary/15 bg-primary/10 text-foreground'}`}
                  >
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      entry.role === 'model' ? 'text-secondary' : 'text-primary'
                    }`}>
                      {entry.role === 'model' ? 'Interviewer' : 'You'}
                    </span>
                    <p className="mt-1 leading-relaxed">{entry.text}</p>
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
