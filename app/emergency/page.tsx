'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mic, MicOff, X, Phone, Volume2, VolumeX, Loader2, 
  CheckCircle2, Circle, Shield, AlertTriangle, Heart,
  Flame, Car, Users, ChevronRight, Video, VideoOff, Camera,
  MapPin, AlertOctagon
} from 'lucide-react'
import { useEmergencyStore } from '@/lib/emergency-store'
import { supabase } from '@/lib/supabase'

type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking'

const typeIcons: Record<string, any> = {
  medical: Heart,
  fire: Flame,
  accident: Car,
  safety: Shield,
  other: AlertTriangle,
}

export default function EmergencyPage() {
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  
  const {
    session,
    isEscalated,
    startSession,
    endSession,
    addMessage,
    addStep,
    completeStep,
    updateSessionInfo,
    escalateToDispatch,
  } = useEmergencyStore()
  
  const [state, setState] = useState<ConversationState>('idle')
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(20).fill(0.2))
  const animationRef = useRef<number | null>(null)
  
  // Camera state
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  // Geolocation
  const [geoStatus, setGeoStatus] = useState<'pending' | 'ok' | 'denied'>('pending')
  const locationRef = useRef<{ lat: number; lng: number; address?: string } | null>(null)

  // SOS state
  const [sosCountdown, setSosCountdown] = useState<number | null>(null)
  const sosTapRef = useRef<number[]>([])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  // Geolocation — auto-capture on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc: { lat: number; lng: number; address?: string } = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        // Reverse geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`)
          const data = await res.json()
          loc.address = data.display_name || undefined
        } catch {}
        locationRef.current = loc
        updateSessionInfo({ location: loc })
        setGeoStatus('ok')
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // Listen for dispatch messages via Supabase Realtime
  useEffect(() => {
    if (!session?.id) return
    const channel = supabase
      .channel(`comms-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communications', filter: `session_id=eq.${session.id}` },
        (payload: any) => {
          const msg = payload.new
          if (msg.sender_role === 'dispatch') {
            addMessage('dispatch', msg.content)
            speakText(msg.content)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session?.id])

  // SOS — triple-tap anywhere triggers silent panic
  const handleSOSTap = useCallback(() => {
    const now = Date.now()
    sosTapRef.current = [...sosTapRef.current.filter(t => now - t < 1000), now]
    if (sosTapRef.current.length >= 3) {
      sosTapRef.current = []
      triggerSOS()
    }
  }, [])

  const triggerSOS = async () => {
    setSosCountdown(3)
    const timer = setInterval(() => {
      setSosCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return null
        }
        return prev - 1
      })
    }, 1000)

    const currentSession = useEmergencyStore.getState().session
    if (!currentSession) return

    // Capture everything silently
    const imageBase64 = cameraStreamRef.current ? captureFrame() : null
    const loc = locationRef.current

    escalateToDispatch()
    addMessage('system', 'SOS activated — silent alert sent to dispatch')

    try {
      await fetch('/api/escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSession.id,
          type: currentSession.type || 'safety',
          severity: 'CRITICAL',
          summary: 'SILENT SOS — ' + (currentSession.summary || 'Emergency'),
          location: loc,
          messages: currentSession.messages,
          steps: currentSession.steps,
          imageSnapshot: imageBase64,
        }),
      })

      // Auto-dispatch if we have location
      if (loc) {
        await fetch('/api/auto-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSession.id,
            type: currentSession.type || 'safety',
            severity: 'CRITICAL',
            lat: loc.lat,
            lng: loc.lng,
          }),
        })
      }
    } catch (e) {
      console.error('SOS error:', e)
    }
  }

  // Waveform animation
  useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      const animate = () => {
        setWaveformBars(prev => 
          prev.map(() => 
            state === 'listening' 
              ? 0.3 + Math.random() * 0.7
              : 0.2 + Math.sin(Date.now() / 100) * 0.3 + Math.random() * 0.3
          )
        )
        animationRef.current = requestAnimationFrame(animate)
      }
      animate()
    } else {
      setWaveformBars(Array(20).fill(0.2))
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [state])

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      let stream: MediaStream | null = null
      
      // Try different camera configurations
      try {
        // First try back camera (for mobile)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          }
        })
        console.log('Back camera obtained')
      } catch (e) {
        // Fallback to any camera
        console.log('Back camera not available, trying default camera')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          }
        })
        console.log('Default camera obtained')
      }
      
      if (!stream) {
        throw new Error('Could not get camera stream')
      }
      
      const tracks = stream.getVideoTracks()
      console.log('Video tracks:', tracks.length, tracks[0]?.label)
      
      cameraStreamRef.current = stream
      setCameraEnabled(true)
      // The stream will be attached to the video element via useEffect
      // after React renders the conditionally-shown <video>
    } catch (error) {
      console.error('Camera error:', error)
      alert('Could not access camera. Please check permissions and make sure no other app is using the camera.')
      setCameraEnabled(false)
      setCameraReady(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraEnabled(false)
    setCameraReady(false)
  }, [])

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Use refs and direct video checks to avoid stale closures
    if (!video || !canvas || !cameraStreamRef.current) return null
    if (!video.videoWidth || !video.videoHeight) {
      console.warn('Video dimensions not ready:', video.videoWidth, video.videoHeight)
      return null
    }
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0)
    
    // Convert to base64 JPEG (smaller than PNG)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    console.log('Frame captured, size:', dataUrl.length)
    return dataUrl
  }, [])

  const toggleCamera = useCallback(() => {
    if (cameraEnabled) {
      stopCamera()
    } else {
      startCamera()
    }
  }, [cameraEnabled, startCamera, stopCamera])

  // Attach camera stream to video element once it's rendered
  useEffect(() => {
    if (cameraEnabled && cameraStreamRef.current && videoRef.current) {
      const video = videoRef.current
      video.srcObject = cameraStreamRef.current
      
      const playVideo = async () => {
        try {
          await video.play()
          setCameraReady(true)
          console.log('Camera started successfully')
        } catch (playError) {
          console.error('Play failed, waiting for loadedmetadata:', playError)
          video.onloadedmetadata = async () => {
            try {
              await video.play()
              setCameraReady(true)
              console.log('Camera started after metadata loaded')
            } catch (err) {
              console.error('Video play error after metadata:', err)
              setCameraReady(true)
            }
          }
        }
      }
      playVideo()
    }
  }, [cameraEnabled])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Initialize
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      
      if (!useEmergencyStore.getState().session) {
        startSession()
      }
      
      setTimeout(() => {
        const greeting = "Hey, I'm Rakshak. Tell me what's happening - I'm here to help you through this."
        addMessage('ai', greeting)
        speakText(greeting)
      }, 600)
    }
  }, [])

  // TTS with ElevenLabs
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
          audioRef.current.onerror = () => setState('idle')
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

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setState('idle')
  }, [])

  // Recording
  const startRecording = useCallback(async () => {
    stopSpeaking()
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true }
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
        
        if (Date.now() - recordingStartRef.current < 500) {
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
      
    } catch (error) {
      console.error('Mic error:', error)
      setState('idle')
    }
  }, [stopSpeaking])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setState('processing')
    }
  }, [])

  // Process conversation
  const processAudio = async (audioBlob: Blob) => {
    setState('processing')
    
    try {
      // Transcribe
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
      addMessage('user', userText)
      
      // Capture camera frame if enabled (use ref to avoid stale closure)
      const isCameraOn = !!cameraStreamRef.current
      const imageBase64 = isCameraOn ? captureFrame() : null
      console.log('Camera on:', isCameraOn, 'Image captured:', !!imageBase64)
      
      // Get AI response
      const currentSession = useEmergencyStore.getState().session
      const aiResponse = await fetch('/api/emergency-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession?.id,
          message: userText,
          conversationHistory: currentSession?.messages || [],
          currentSteps: currentSession?.steps || [],
          imageBase64: imageBase64,
        }),
      })
      
      if (!aiResponse.ok) throw new Error('AI error')
      
      const aiData = await aiResponse.json()
      
      addMessage('ai', aiData.response)
      
      if (aiData.sessionInfo) updateSessionInfo(aiData.sessionInfo)
      
      // Add new steps dynamically
      if (aiData.steps?.length) {
        aiData.steps.forEach((s: any) => addStep(s.text, s.imageUrl))
      }
      
      if (aiData.shouldEscalate && !useEmergencyStore.getState().session?.isEscalated) {
        // Full escalation: push to Supabase so dispatch + department dashboards see it
        escalateToDispatch()
        addMessage('system', 'Connecting to emergency dispatch...')

        const s = useEmergencyStore.getState().session!
        const loc = locationRef.current || s.location
        const snapshot = cameraStreamRef.current ? captureFrame() : null

        fetch('/api/escalation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: s.id,
            type: s.type || 'other',
            severity: s.severity || 'MEDIUM',
            summary: s.summary || 'Emergency',
            location: loc,
            messages: s.messages,
            steps: s.steps,
            risks: aiData.sessionInfo?.risks || [],
            tacticalAdvice: aiData.sessionInfo?.tacticalAdvice || '',
            imageSnapshot: snapshot,
          }),
        }).then(r => r.json()).then(data => {
          if (data.success) {
            addMessage('system', 'Dispatch team notified — help is on the way!')
            speakText('Dispatch team has been notified. Help is on the way.')
            // Auto-dispatch if we have location
            if (loc?.lat && loc?.lng) {
              fetch('/api/auto-dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: s.id, type: s.type, severity: s.severity, lat: loc.lat, lng: loc.lng }),
              }).then(r => r.json()).then(dd => {
                if (dd.dispatched?.length) {
                  addMessage('system', `${dd.dispatched[0].name} dispatched — ETA ${dd.dispatched[0].eta} min`)
                }
              }).catch(() => {})
            }
          }
        }).catch(err => {
          console.error('Auto-escalation error:', err)
        })
      }
      
      await speakText(aiData.response)
      
    } catch (error) {
      console.error('Error:', error)
      const errorMsg = "I didn't catch that. Can you say that again?"
      addMessage('ai', errorMsg)
      await speakText(errorMsg)
    }
  }

  const handleMicPress = () => {
    if (state === 'idle' || state === 'speaking') {
      startRecording()
    }
  }

  const handleMicRelease = () => {
    if (state === 'listening') {
      stopRecording()
    }
  }

  const handleEndSession = () => {
    stopSpeaking()
    if (confirm('End this session?')) {
      endSession()
      router.push('/')
    }
  }

  const handleEscalate = async () => {
    if (!confirm('Connect to emergency dispatch? Professional responders will be alerted.')) {
      return
    }
    
    const currentSession = useEmergencyStore.getState().session
    if (!currentSession) return
    
    // Update local state
    escalateToDispatch()
    addMessage('system', 'Connecting to emergency dispatch...')
    
    try {
      const loc = locationRef.current || currentSession.location
      const imageBase64 = cameraStreamRef.current ? captureFrame() : null

      const response = await fetch('/api/escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSession.id,
          type: currentSession.type || 'other',
          severity: currentSession.severity || 'MEDIUM',
          summary: currentSession.summary || 'Emergency',
          location: loc,
          messages: currentSession.messages,
          steps: currentSession.steps,
          risks: currentSession.risks || [],
          tacticalAdvice: currentSession.tacticalAdvice || '',
          imageSnapshot: imageBase64,
        }),
      })
      
      if (response.ok) {
        addMessage('system', 'Dispatch team notified - help is on the way!')
        speakText('Dispatch team has been notified. Professional help is on the way. Stay on the line, I\'m still here with you.')

        // Auto-dispatch nearest responder if location available
        if (loc?.lat && loc?.lng) {
          fetch('/api/auto-dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentSession.id,
              type: currentSession.type || 'other',
              severity: currentSession.severity || 'MEDIUM',
              lat: loc.lat,
              lng: loc.lng,
            }),
          }).then(r => r.json()).then(data => {
            if (data.dispatched?.length) {
              addMessage('system', `${data.dispatched[0].name} dispatched — ETA ${data.dispatched[0].eta} min`)
            }
          }).catch(() => {})
        }
      } else {
        throw new Error('Escalation failed')
      }
    } catch (error) {
      console.error('Escalation error:', error)
      addMessage('system', 'Connection issue - retrying...')
      speakText('Having trouble connecting. Please call 112 directly if this is life-threatening.')
    }
  }

  const TypeIcon = session?.type ? typeIcons[session.type] || AlertTriangle : Shield
  const completedSteps = session?.steps?.filter(s => s.completed).length || 0
  const totalSteps = session?.steps?.length || 0

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden" onClick={handleSOSTap}>
      <audio ref={audioRef} />
      <canvas ref={canvasRef} className="hidden" />

      {/* SOS Countdown Overlay */}
      {sosCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-red-600 flex items-center justify-center">
          <div className="text-center">
            <AlertOctagon className="h-20 w-20 mx-auto mb-4 animate-pulse" />
            <p className="text-4xl font-bold">SILENT SOS</p>
            <p className="text-lg mt-2 text-red-200">Alerting dispatch...</p>
          </div>
        </div>
      )}

      {/* Geolocation indicator */}
      {geoStatus !== 'pending' && (
        <div className="absolute top-4 left-16 z-30 flex items-center gap-1 px-2 py-1 bg-zinc-900/80 rounded-full">
          <MapPin className={`h-3 w-3 ${geoStatus === 'ok' ? 'text-green-400' : 'text-red-400'}`} />
          <span className="text-[10px] text-zinc-400">
            {geoStatus === 'ok' ? (locationRef.current?.address?.split(',')[0] || 'Located') : 'No GPS'}
          </span>
        </div>
      )}
      
      {/* Camera Preview - Floating */}
      {cameraEnabled && (
        <div className="absolute top-20 right-4 z-30 animate-in slide-in-from-right">
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden w-48 h-36">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width="192"
              height="144"
              className="absolute inset-0 w-full h-full object-cover border-2 border-green-500/50 shadow-lg shadow-green-500/20 bg-slate-900"
              onError={(e) => {
                console.error('Video element error:', e)
                alert('Video playback error. Camera might not be supported.')
              }}
              onLoadedMetadata={() => {
                console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
              }}
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-green-500/80 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-medium">{cameraReady ? 'LIVE' : 'STARTING...'}</span>
            </div>
            <button
              onClick={toggleCamera}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-green-400 text-center mt-2">
            {cameraReady ? 'AI can see this' : 'Loading camera...'}
          </p>
        </div>
      )}
      
      {/* Main Conversation Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
        
        {/* Header */}
        <header className="relative z-10 p-4 flex items-center justify-between border-b border-white/5">
          <button onClick={handleEndSession} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              session?.severity === 'CRITICAL' ? 'bg-red-500/20' :
              session?.severity === 'HIGH' ? 'bg-orange-500/20' :
              session?.severity === 'MEDIUM' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
            }`}>
              <TypeIcon className={`h-5 w-5 ${
                session?.severity === 'CRITICAL' ? 'text-red-400' :
                session?.severity === 'HIGH' ? 'text-orange-400' :
                session?.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-blue-400'
              }`} />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Rakshak AI</h1>
              <p className="text-xs text-slate-500">
                {isEscalated ? 'Dispatch Connected' : session?.summary || 'Emergency Assistant'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={state === 'speaking' ? stopSpeaking : undefined}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            {state === 'speaking' ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 text-slate-500" />}
          </button>
        </header>

        {/* Messages */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
          {session?.messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {msg.role === 'system' ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-300">{msg.content}</span>
                </div>
              ) : (
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`rounded-2xl px-5 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 ml-auto' 
                      : 'bg-white/5 backdrop-blur-sm border border-white/10'
                  }`}>
                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 px-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          ))}
          
          {state === 'processing' && (
            <div className="flex justify-start animate-in fade-in">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Control */}
        <div className="relative z-10 p-6 pb-8">
          {/* Waveform */}
          <div className="flex items-center justify-center gap-1 h-16 mb-6">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  state === 'listening' ? 'bg-red-500' :
                  state === 'speaking' ? 'bg-purple-500' :
                  state === 'processing' ? 'bg-yellow-500' : 'bg-slate-700'
                }`}
                style={{ 
                  height: `${height * 100}%`,
                  opacity: state === 'idle' ? 0.3 : 1
                }}
              />
            ))}
          </div>

          {/* Mic Button */}
          <div className="flex items-center justify-center gap-6">
            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center ${
                cameraEnabled 
                  ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                  : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              {cameraEnabled ? (
                <Video className="h-6 w-6" />
              ) : (
                <VideoOff className="h-6 w-6 text-slate-400" />
              )}
            </button>
            
            {/* Main Mic Button */}
            <button
              onMouseDown={handleMicPress}
              onMouseUp={handleMicRelease}
              onMouseLeave={handleMicRelease}
              onTouchStart={handleMicPress}
              onTouchEnd={handleMicRelease}
              disabled={state === 'processing'}
              className={`relative w-20 h-20 rounded-full transition-all duration-200 flex items-center justify-center active:scale-95 disabled:opacity-50 ${
                state === 'listening' 
                  ? 'bg-red-500 shadow-lg shadow-red-500/50' 
                  : state === 'speaking'
                  ? 'bg-purple-600 shadow-lg shadow-purple-500/50'
                  : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              {state === 'processing' ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : state === 'listening' ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
              
              {state === 'listening' && (
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
              )}
            </button>
            
            {/* Capture Frame Button - only visible when camera is on */}
            <button
              onClick={async () => {
                if (!cameraEnabled) return
                const frame = captureFrame()
                if (frame) {
                  addMessage('user', '[Shared camera view with AI]')
                  setState('processing')
                  try {
                    const currentSession = useEmergencyStore.getState().session
                    const aiResponse = await fetch('/api/emergency-agent', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: currentSession?.id,
                        message: 'Look at what I\'m showing you',
                        conversationHistory: currentSession?.messages || [],
                        currentSteps: currentSession?.steps || [],
                        imageBase64: frame,
                      }),
                    })
                    if (aiResponse.ok) {
                      const aiData = await aiResponse.json()
                      addMessage('ai', aiData.response)
                      if (aiData.sessionInfo) updateSessionInfo(aiData.sessionInfo)
                      if (aiData.steps?.length) {
                        aiData.steps.forEach((s: any) => addStep(s.text, s.imageUrl))
                      }
                      await speakText(aiData.response)
                    }
                  } catch (error) {
                    console.error('Vision error:', error)
                    setState('idle')
                  }
                }
              }}
              disabled={!cameraEnabled || state === 'processing'}
              className={`w-14 h-14 rounded-full transition-all duration-200 flex items-center justify-center ${
                cameraEnabled 
                  ? 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/50' 
                  : 'bg-white/5 cursor-not-allowed'
              }`}
            >
              <Camera className={`h-6 w-6 ${cameraEnabled ? 'text-white' : 'text-slate-600'}`} />
            </button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            {state === 'listening' ? 'Listening... release to send' :
             state === 'processing' ? (cameraEnabled ? 'Analyzing with vision...' : 'Processing...') :
             state === 'speaking' ? 'Speaking...' :
             cameraEnabled ? 'Hold mic to talk • Tap camera to share view' : 'Hold to talk'}
          </p>
          <p className="text-center text-[10px] text-zinc-700 mt-2">Triple-tap anywhere for silent SOS</p>
        </div>

        {/* Escalated Banner */}
        {isEscalated && (
          <div className="absolute top-20 left-4 right-4 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-4 z-20 animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold">Emergency Dispatch Connected</p>
                <p className="text-sm text-red-200">Professional help is on the way</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Steps Sidebar */}
      <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-l border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Action Steps</h2>
            {totalSteps > 0 && (
              <span className="text-xs text-slate-500">{completedSteps}/{totalSteps}</span>
            )}
          </div>
          {totalSteps > 0 && (
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {session?.steps && session.steps.length > 0 ? (
            session.steps.map((step, index) => (
              <div
                key={step.id}
                className={`group rounded-xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-right ${
                  step.completed 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => completeStep(step.id)}
                    className={`mt-0.5 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                      step.completed 
                        ? 'bg-green-500 text-white' 
                        : 'border-2 border-slate-600 hover:border-green-400 text-slate-600 hover:text-green-400'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </button>
                  <p className={`text-sm leading-relaxed ${step.completed ? 'text-green-300/70 line-through' : 'text-slate-300'}`}>
                    {step.text}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <ChevronRight className="h-6 w-6 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">Steps will appear here as we work through your situation</p>
            </div>
          )}
        </div>

        {/* Escalate Button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleEscalate}
            disabled={isEscalated}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              isEscalated 
                ? 'bg-green-600/20 text-green-400 cursor-default' 
                : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
            }`}
          >
            <Phone className="h-5 w-5" />
            {isEscalated ? 'Dispatch Connected' : 'Connect to Emergency Services'}
          </button>
          {!isEscalated && (
            <p className="text-[10px] text-slate-600 text-center mt-2">
              Use only if you need professional emergency help
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
