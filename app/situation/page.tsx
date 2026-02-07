'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mic, MicOff, Loader2, Heart, Flame, ShieldAlert, AlertTriangle } from 'lucide-react'
import { useIncidentStore } from '@/lib/store'

type ScenarioType = 'medical' | 'fire' | 'safety' | null

export default function SituationPage() {
  const router = useRouter()
  const [scenario, setScenario] = useState<ScenarioType>(null)
  const [description, setDescription] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  
  const { setCurrentAnalysis, setCurrentDescription } = useIncidentStore()

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          let transcript = ''
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          setDescription(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError('Please describe your emergency')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: description,
          scenario: scenario,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze emergency')
      }

      const data = await response.json()
      
      // Store in Zustand
      setCurrentAnalysis(data)
      setCurrentDescription(description)
      
      // Navigate to guidance
      router.push('/guidance')
    } catch (err) {
      setError('Failed to analyze. Please try again or call 112.')
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const scenarios = [
    { type: 'medical' as const, icon: Heart, label: 'Medical', color: 'bg-red-50 border-red-200 text-red-700', activeColor: 'bg-red-500 text-white border-red-500' },
    { type: 'fire' as const, icon: Flame, label: 'Fire', color: 'bg-orange-50 border-orange-200 text-orange-700', activeColor: 'bg-orange-500 text-white border-orange-500' },
    { type: 'safety' as const, icon: ShieldAlert, label: 'Safety Threat', color: 'bg-purple-50 border-purple-200 text-purple-700', activeColor: 'bg-purple-500 text-white border-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="font-semibold text-gray-900">Describe Your Emergency</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Scenario Cards */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            What type of emergency? (optional)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {scenarios.map(({ type, icon: Icon, label, color, activeColor }) => (
              <button
                key={type}
                onClick={() => setScenario(scenario === type ? null : type)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  scenario === type ? activeColor : color
                }`}
              >
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description Input */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            What is happening?
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the emergency situation..."
              rows={5}
              className="w-full p-4 pr-14 rounded-xl border-2 border-gray-200 focus:border-gray-900 focus:ring-0 resize-none text-gray-900 placeholder:text-gray-400 transition-colors"
            />
            {/* Mic Button */}
            <button
              onClick={toggleListening}
              className={`absolute right-3 bottom-3 p-3 rounded-full transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
          {isListening && (
            <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Listening... speak now
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !description.trim()}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Get Instructions'
          )}
        </button>

        {/* Emergency Call Reminder */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Life-threatening emergency?</p>
          <a 
            href="tel:112" 
            className="text-red-500 font-semibold hover:text-red-600 transition-colors"
          >
            Call 112 Now
          </a>
        </div>
      </main>
    </div>
  )
}
