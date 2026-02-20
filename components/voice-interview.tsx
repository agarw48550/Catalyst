'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<ConnectionStatus>('idle')

  // Keep statusRef in sync with state
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    isPlayingRef.current = true

    const ctx = audioContextRef.current
    if (!ctx) { isPlayingRef.current = false; return }

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift()!
      try {
        // Decode raw PCM 16-bit LE at 24kHz
        const pcm16 = new Int16Array(chunk)
        const float32 = new Float32Array(pcm16.length)
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768
        }
        const audioBuffer = ctx.createBuffer(1, float32.length, 24000)
        audioBuffer.getChannelData(0).set(float32)
        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)
        source.start()
        await new Promise<void>((resolve) => { source.onended = () => resolve() })
      } catch {
        // Skip bad audio chunks
      }
    }

    isPlayingRef.current = false
  }, [])

  const startSession = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    setTranscript([])

    try {
      // Get session config from server
      const res = await fetch('/api/interview/voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRole, interviewType }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create session')
      }
      const { apiKey, model, systemInstruction, websocketUrl } = await res.json()

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })
      mediaStreamRef.current = stream

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      // Connect to Gemini Live API
      const wsUrl = `${websocketUrl}?key=${apiKey}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected, sending setup...')
        // Send setup message
        const setupMsg = {
          setup: {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ['AUDIO', 'TEXT'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Aoede',
                  },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
          },
        }
        ws.send(JSON.stringify(setupMsg))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WS message type:', Object.keys(data).join(', '))

          // Setup complete
          if (data.setupComplete) {
            console.log('Setup complete, starting audio capture')
            setStatus('connected')
            startAudioCapture(ws, audioContext, stream)
            return
          }

          // Handle errors from the server
          if (data.error) {
            console.error('Gemini Live API error:', data.error)
            setError(`AI error: ${data.error.message || JSON.stringify(data.error)}`)
            setStatus('error')
            return
          }

          // Server content (model response)
          if (data.serverContent) {
            const parts = data.serverContent.modelTurn?.parts || []
            for (const part of parts) {
              if (part.text) {
                setTranscript((prev) => {
                  const last = prev[prev.length - 1]
                  if (last && last.role === 'model') {
                    return [...prev.slice(0, -1), { role: 'model', text: last.text + part.text }]
                  }
                  return [...prev, { role: 'model', text: part.text }]
                })
              }
              if (part.inlineData?.data) {
                // Decode base64 audio and queue for playback
                const raw = atob(part.inlineData.data)
                const buf = new ArrayBuffer(raw.length)
                const view = new Uint8Array(buf)
                for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
                audioQueueRef.current.push(buf)
                setStatus('speaking')
                playAudioQueue()
              }
            }

            if (data.serverContent.turnComplete) {
              setStatus('listening')
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      ws.onerror = (ev) => {
        console.error('WebSocket error:', ev)
        setError('Connection error. Please check your internet and try again.')
        setStatus('error')
      }

      ws.onclose = (e) => {
        console.log('WebSocket closed:', e.code, e.reason)
        if (statusRef.current !== 'error' && statusRef.current !== 'ended') {
          setStatus('ended')
        }
        cleanup()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start voice interview')
      setStatus('error')
      cleanup()
    }
  }, [jobRole, interviewType, playAudioQueue])

  function startAudioCapture(ws: WebSocket, audioContext: AudioContext, stream: MediaStream) {
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    processor.onaudioprocess = (e) => {
      if (isMuted || ws.readyState !== WebSocket.OPEN) return

      const input = e.inputBuffer.getChannelData(0)

      // Calculate audio level for visualization
      let sum = 0
      for (let i = 0; i < input.length; i++) sum += input[i] * input[i]
      setAudioLevel(Math.sqrt(sum / input.length) * 100)

      // Convert float32 to int16 PCM
      const pcm16 = new Int16Array(input.length)
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }

      // Base64 encode
      const bytes = new Uint8Array(pcm16.buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      const b64 = btoa(binary)

      // Send to Gemini
      ws.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{
            mimeType: 'audio/pcm;rate=16000',
            data: b64,
          }],
        },
      }))
    }

    source.connect(processor)
    processor.connect(audioContext.destination)
    setStatus('listening')
  }

  function cleanup() {
    processorRef.current?.disconnect()
    processorRef.current = null
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    audioQueueRef.current = []
    isPlayingRef.current = false
  }

  function endSession() {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }
    cleanup()
    setStatus('ended')

    // Track usage
    const count = parseInt(localStorage.getItem('catalyst_interview_count') || '0', 10)
    localStorage.setItem('catalyst_interview_count', (count + 1).toString())
  }

  function toggleMute() {
    setIsMuted(!isMuted)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = isMuted })
    }
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Voice Interview</span>
            <span className={`text-sm font-normal ${statusConfig[status].color}`}>
              ● {statusConfig[status].label}
            </span>
          </CardTitle>
          <CardDescription>
            Speak naturally — the AI interviewer will ask questions and give feedback in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
          )}

          {/* Audio level indicator */}
          {(status === 'listening' || status === 'speaking') && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
              <div className="relative">
                {status === 'listening' ? (
                  <Mic className="h-8 w-8 text-green-500" />
                ) : (
                  <Volume2 className="h-8 w-8 text-blue-500 animate-pulse" />
                )}
                <div
                  className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"
                  style={{ transform: `scale(${1 + audioLevel * 0.3})`, opacity: status === 'listening' ? 0.5 : 0 }}
                />
              </div>
              <div className="flex-1">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${status === 'listening' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, status === 'listening' ? audioLevel * 3 : 50 + Math.sin(Date.now() / 200) * 30)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 justify-center">
            {status === 'idle' || status === 'error' ? (
              <Button onClick={startSession} className="gap-2 h-12 px-6 rounded-xl">
                <Phone className="h-5 w-5" />
                Start Voice Interview
              </Button>
            ) : status === 'connecting' ? (
              <Button disabled className="gap-2 h-12 px-6 rounded-xl">
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </Button>
            ) : status === 'ended' ? (
              <Button onClick={onComplete} variant="outline" className="gap-2 h-12 px-6 rounded-xl">
                Done
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
                  <PhoneOff className="h-5 w-5" />
                  End Interview
                </Button>
              </>
            )}
          </div>

          {/* Live transcript */}
          {transcript.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2 text-slate-500">Live Transcript</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto p-3 bg-slate-50 rounded-xl">
                {transcript.map((entry, i) => (
                  <div
                    key={i}
                    className={`text-sm p-2 rounded-lg ${
                      entry.role === 'model'
                        ? 'bg-blue-50 text-blue-900'
                        : 'bg-green-50 text-green-900 ml-8'
                    }`}
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
