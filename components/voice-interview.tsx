'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LoadingBar } from '@/components/ui/loading-bar'
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2 } from 'lucide-react'

interface VoiceInterviewProps {
  jobRole: string
  interviewType: string
  onComplete: () => void
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening' | 'error' | 'ended'

export function VoiceInterview({ jobRole, interviewType, onComplete }: VoiceInterviewProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<{ role: 'user' | 'model'; text: string }[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<ConnectionStatus>('idle')

  useEffect(() => { statusRef.current = status }, [status])
  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [transcript])

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    isPlayingRef.current = true
    const ctx = audioContextRef.current
    if (!ctx) { isPlayingRef.current = false; return }
    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift()!
      try {
        const pcm16 = new Int16Array(chunk)
        const float32 = new Float32Array(pcm16.length)
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768
        const buf = ctx.createBuffer(1, float32.length, 24000)
        buf.getChannelData(0).set(float32)
        const src = ctx.createBufferSource()
        src.buffer = buf; src.connect(ctx.destination); src.start()
        await new Promise<void>(r => { src.onended = () => r() })
      } catch {}
    }
    isPlayingRef.current = false
  }, [])

  const startSession = useCallback(async () => {
    setStatus('connecting'); setError(null); setTranscript([])
    try {
      const res = await fetch('/api/interview/voice-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole, interviewType }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create session') }
      const { apiKey, model, systemInstruction, websocketUrl } = await res.json()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      mediaStreamRef.current = stream

      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      const ws = new WebSocket(websocketUrl + '?key=' + apiKey)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({
          setup: {
            model: 'models/' + model,
            generationConfig: {
              responseModalities: ['AUDIO', 'TEXT'],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
          },
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.setupComplete) { setStatus('connected'); startAudioCapture(ws, audioContext, stream); return }
          if (data.error) { setError('AI error: ' + (data.error.message || JSON.stringify(data.error))); setStatus('error'); return }
          if (data.serverContent) {
            const parts = data.serverContent.modelTurn?.parts || []
            for (const part of parts) {
              if (part.text) {
                setTranscript(prev => {
                  const last = prev[prev.length - 1]
                  if (last && last.role === 'model') return [...prev.slice(0, -1), { role: 'model', text: last.text + part.text }]
                  return [...prev, { role: 'model', text: part.text }]
                })
              }
              if (part.inlineData?.data) {
                const raw = atob(part.inlineData.data)
                const buf = new ArrayBuffer(raw.length)
                const view = new Uint8Array(buf)
                for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
                audioQueueRef.current.push(buf)
                setStatus('speaking')
                playAudioQueue()
              }
            }
            if (data.serverContent.turnComplete) setStatus('listening')
          }
        } catch {}
      }

      ws.onerror = () => { setError('Connection error. Please check your internet.'); setStatus('error') }
      ws.onclose = (e) => {
        if (statusRef.current !== 'error' && statusRef.current !== 'ended') setStatus('ended')
        cleanup()
      }
    } catch (err: any) { setError(err.message || 'Failed to start'); setStatus('error'); cleanup() }
  }, [jobRole, interviewType, playAudioQueue])

  function startAudioCapture(ws: WebSocket, audioContext: AudioContext, stream: MediaStream) {
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048
    source.connect(analyser)

    // Use ScriptProcessorNode as fallback (AudioWorklet needs served files)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    processor.onaudioprocess = (e) => {
      if (isMuted || ws.readyState !== WebSocket.OPEN) return
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
        realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: btoa(binary) }] },
      }))
    }

    source.connect(processor)
    processor.connect(audioContext.destination)
    setStatus('listening')
  }

  function cleanup() {
    workletNodeRef.current?.disconnect()
    workletNodeRef.current = null
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    mediaStreamRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    audioQueueRef.current = []
    isPlayingRef.current = false
  }

  function endSession() {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close()
    cleanup(); setStatus('ended')
    const c = parseInt(localStorage.getItem('catalyst_interview_count') || '0', 10)
    localStorage.setItem('catalyst_interview_count', (c + 1).toString())
  }

  function toggleMute() {
    setIsMuted(!isMuted)
    mediaStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = isMuted })
  }

  const statusConfig: Record<ConnectionStatus, { label: string; color: string }> = {
    idle: { label: 'Ready', color: 'text-slate-500' },
    connecting: { label: 'Connecting...', color: 'text-amber-500' },
    connected: { label: 'Connected', color: 'text-green-500' },
    speaking: { label: 'Interviewer speaking...', color: 'text-blue-500' },
    listening: { label: 'Listening to you...', color: 'text-green-500' },
    error: { label: 'Error', color: 'text-red-500' },
    ended: { label: 'Interview ended', color: 'text-slate-500' },
  }

  return (
    <div className="space-y-4">
      <Card className="dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between dark:text-white">
            <span>Voice Interview</span>
            <span className={'text-sm font-normal ' + statusConfig[status].color}>{'\u25CF'} {statusConfig[status].label}</span>
          </CardTitle>
          <CardDescription>Speak naturally - the AI interviewer will ask questions and give feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
          {status === 'connecting' && <LoadingBar active={true} estimatedTime={5} label="Connecting to AI interviewer..." />}

          {(status === 'listening' || status === 'speaking') && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div className="relative">
                {status === 'listening' ? <Mic className="h-8 w-8 text-green-500" /> : <Volume2 className="h-8 w-8 text-blue-500 animate-pulse" />}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={'h-full rounded-full transition-all duration-100 ' + (status === 'listening' ? 'bg-green-500' : 'bg-blue-500')} style={{ width: Math.min(100, status === 'listening' ? audioLevel * 3 : 50 + Math.sin(Date.now() / 200) * 30) + '%' }} />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {(status === 'idle' || status === 'error') ? (
              <Button onClick={startSession} className="gap-2 h-12 px-6 rounded-xl"><Phone className="h-5 w-5" /> Start Voice Interview</Button>
            ) : status === 'connecting' ? (
              <Button disabled className="gap-2 h-12 px-6 rounded-xl"><Loader2 className="h-5 w-5 animate-spin" /> Connecting...</Button>
            ) : status === 'ended' ? (
              <Button onClick={onComplete} variant="outline" className="gap-2 h-12 px-6 rounded-xl">Done</Button>
            ) : (
              <>
                <Button onClick={toggleMute} variant="outline" className={'gap-2 h-12 px-6 rounded-xl ' + (isMuted ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : '')}>
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />} {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button onClick={endSession} variant="destructive" className="gap-2 h-12 px-6 rounded-xl"><PhoneOff className="h-5 w-5" /> End Interview</Button>
              </>
            )}
          </div>

          {transcript.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2 text-slate-500 dark:text-slate-400">Live Transcript</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                {transcript.map((entry, i) => (
                  <div key={i} className={'text-sm p-2 rounded-lg ' + (entry.role === 'model' ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200' : 'bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-200 ml-8')}>
                    <span className="font-semibold text-xs uppercase tracking-wider opacity-60">{entry.role === 'model' ? 'Interviewer' : 'You'}</span>
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
