'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, X, Phone, Volume2, Loader2 } from 'lucide-react'
import { useEmergencyStore } from '@/lib/emergency-store'

type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking'

export default function EmergencyPage() {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef<number>(0)
  const initializedRef = useRef(false)
  
  const {
    session,
    isEscalated,
    startSession,
    endSession,
    addMessage,
    addStep,
    updateSessionInfo,
    escalateToDispatch,
  } = useEmergencyStore()
  
  const [state, setState] = useState<ConversationState>('idle')
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  // Initialize session and greet user
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      
      const existing = useEmergencyStore.getState().session
      if (!existing) {
        startSession()
      }
      
      // Initial greeting
      setTimeout(() => {
        const greeting = "Hi, I'm here to help. What's your emergency?"
        setAiResponse(greeting)
        addMessage('ai', greeting)
        speakText(greeting)
      }, 500)
    }
  }, [])

  // Text-to-speech using ElevenLabs
  const speakText = async (text: string) => {
    setState('speaking')
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.onended = () => {
            setState('idle')
            URL.revokeObjectURL(audioUrl)
          }
          audioRef.current.onerror = () => {
            setState('idle')
          }
          await audioRef.current.play()
        }
      } else {
        setState('idle')
      }
    } catch (error) {
      console.error('TTS error:', error)
      setState('idle')
    }
  }

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setState('idle')
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    stopSpeaking()
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      
      audioChunksRef.current = []
      recordingStartRef.current = Date.now()
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        
        const duration = Date.now() - recordingStartRef.current
        if (duration < 500 || audioChunksRef.current.length === 0) {
          setState('idle')
          return
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size > 1000) {
          await processAudio(audioBlob)
        } else {
          setState('idle')
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100)
      setState('listening')
      setCurrentTranscript('')
      
    } catch (error) {
      console.error('Mic error:', error)
      alert('Could not access microphone')
      setState('idle')
    }
  }, [stopSpeaking])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setState('processing')
    }
  }, [])

  // Process audio -> transcribe -> AI -> speak
  const processAudio = async (audioBlob: Blob) => {
    setState('processing')
    
    try {
      // 1. Transcribe with Deepgram
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const sttResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      })
      
      const sttData = await sttResponse.json()
      
      if (!sttData.text?.trim()) {
        setState('idle')
        return
      }
      
      const userText = sttData.text.trim()
      setCurrentTranscript(userText)
      addMessage('user', userText)
      
      // 2. Get AI response
      const currentSession = useEmergencyStore.getState().session
      const aiResponse = await fetch('/api/emergency-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession?.id,
          message: userText,
          conversationHistory: currentSession?.messages || [],
          currentSteps: currentSession?.steps || [],
        }),
      })
      
      if (!aiResponse.ok) throw new Error('AI failed')
      
      const aiData = await aiResponse.json()
      
      setAiResponse(aiData.response)
      addMessage('ai', aiData.response)
      
      if (aiData.sessionInfo) updateSessionInfo(aiData.sessionInfo)
      if (aiData.steps?.length) {
        aiData.steps.forEach((s: any) => addStep(s.text, s.imageUrl))
      }
      
      // 3. Escalate if needed
      if (aiData.shouldEscalate) {
        escalateToDispatch()
        addMessage('system', '⚠️ Connecting to emergency dispatch...')
      }
      
      // 4. Speak response
      await speakText(aiData.response)
      
    } catch (error) {
      console.error('Processing error:', error)
      const errorMsg = "Sorry, I had trouble understanding. Can you repeat that?"
      setAiResponse(errorMsg)
      await speakText(errorMsg)
    }
  }

  // Handle mic button
  const handleMicDown = () => {
    if (state === 'idle' || state === 'speaking') {
      startRecording()
    }
  }

  const handleMicUp = () => {
    if (state === 'listening') {
      stopRecording()
    }
  }

  const handleEndSession = () => {
    stopSpeaking()
    if (confirm('End this emergency session?')) {
      endSession()
      router.push('/')
    }
  }

  // Get visual state
  const getStateColor = () => {
    switch (state) {
      case 'listening': return 'from-red-500 to-red-600'
      case 'processing': return 'from-yellow-500 to-orange-500'
      case 'speaking': return 'from-purple-500 to-pink-500'
      default: return 'from-blue-500 to-blue-600'
    }
  }

  const getStateText = () => {
    switch (state) {
      case 'listening': return 'Listening...'
      case 'processing': return 'Processing...'
      case 'speaking': return 'Speaking...'
      default: return 'Tap & hold to speak'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex flex-col">
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <button onClick={handleEndSession} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="h-6 w-6 text-slate-400" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isEscalated ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-sm text-slate-400">
            {isEscalated ? 'Dispatch Connected' : 'AI Assistant'}
          </span>
        </div>
        
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Volume2 className="h-6 w-6 text-slate-400" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* AI Response Display */}
        <div className="max-w-lg text-center mb-12">
          {state === 'processing' ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="text-slate-400">Thinking...</span>
            </div>
          ) : (
            <p className="text-xl md:text-2xl leading-relaxed text-white/90">
              {aiResponse || "Hi, I'm here to help. What's your emergency?"}
            </p>
          )}
        </div>

        {/* User Transcript */}
        {currentTranscript && state !== 'listening' && (
          <div className="mb-8 px-4 py-2 bg-white/5 rounded-full">
            <p className="text-sm text-slate-400">You said: "{currentTranscript}"</p>
          </div>
        )}

        {/* Animated Orb */}
        <div className="relative mb-8">
          {/* Pulse rings */}
          {state === 'listening' && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-[-20px] rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
            </>
          )}
          {state === 'speaking' && (
            <>
              <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse" />
              <div className="absolute inset-[-15px] rounded-full bg-purple-500/15 animate-pulse" style={{ animationDelay: '0.2s' }} />
            </>
          )}
          
          {/* Main button */}
          <button
            onMouseDown={handleMicDown}
            onMouseUp={handleMicUp}
            onMouseLeave={handleMicUp}
            onTouchStart={handleMicDown}
            onTouchEnd={handleMicUp}
            disabled={state === 'processing'}
            className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${getStateColor()} shadow-2xl transition-all duration-300 flex items-center justify-center active:scale-95 disabled:opacity-50`}
          >
            {state === 'processing' ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : (
              <Mic className={`h-12 w-12 ${state === 'listening' ? 'animate-pulse' : ''}`} />
            )}
          </button>
        </div>

        {/* State indicator */}
        <p className="text-slate-400 text-sm font-medium mb-4">
          {getStateText()}
        </p>

        {/* Severity badge */}
        {session?.severity && (
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
            session.severity === 'CRITICAL' ? 'bg-red-500' :
            session.severity === 'HIGH' ? 'bg-orange-500' :
            session.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
          }`}>
            {session.severity} PRIORITY
          </div>
        )}
      </main>

      {/* Emergency Call Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <button
          onClick={() => {
            escalateToDispatch()
            addMessage('system', '⚠️ Escalating to emergency dispatch...')
            speakText('Connecting you to emergency dispatch now.')
          }}
          disabled={isEscalated}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-medium shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
        >
          <Phone className="h-5 w-5" />
          {isEscalated ? 'Dispatch Connected' : 'Connect to Dispatch'}
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
          <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold">Conversation</h3>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-800 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)] space-y-4">
              {session?.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                    msg.role === 'user' ? 'bg-blue-600' :
                    msg.role === 'system' ? 'bg-amber-500/20 border border-amber-500/30' :
                    'bg-slate-800'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Escalated Banner */}
      {isEscalated && (
        <div className="fixed top-16 left-4 right-4 bg-red-600 rounded-xl p-4 animate-pulse z-40">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 animate-bounce" />
            <div>
              <p className="font-semibold">Emergency Dispatch Connected</p>
              <p className="text-sm text-red-200">Help is on the way</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
