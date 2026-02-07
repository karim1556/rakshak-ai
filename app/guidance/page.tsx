'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Volume2, VolumeX, ChevronRight, ChevronLeft, AlertTriangle, CheckCircle2, Phone } from 'lucide-react'
import { useIncidentStore } from '@/lib/store'

export default function GuidancePage() {
  const router = useRouter()
  const { currentAnalysis, currentDescription, addIncident, clearCurrentAnalysis } = useIncidentStore()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [incidentCreated, setIncidentCreated] = useState(false)

  // Redirect if no analysis
  useEffect(() => {
    if (!currentAnalysis) {
      router.push('/situation')
    }
  }, [currentAnalysis, router])

  // Create incident on first load
  useEffect(() => {
    if (currentAnalysis && !incidentCreated) {
      addIncident({
        type: currentAnalysis.incidentType,
        summary: currentAnalysis.summary,
        description: currentDescription,
        victims: currentAnalysis.victims,
        risks: currentAnalysis.risks,
        steps: currentAnalysis.steps,
        tacticalAdvice: currentAnalysis.tacticalAdvice,
        severity: currentAnalysis.severity,
      })
      setIncidentCreated(true)
    }
  }, [currentAnalysis, currentDescription, addIncident, incidentCreated])

  // Text-to-speech for current step
  const speakStep = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking()
    } else if (currentAnalysis?.steps[currentStep]) {
      speakStep(currentAnalysis.steps[currentStep])
    }
  }

  const nextStep = () => {
    if (currentAnalysis && currentStep < currentAnalysis.steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep])
      setCurrentStep(currentStep + 1)
      stopSpeaking()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setCompletedSteps(completedSteps.filter(s => s !== currentStep - 1))
      stopSpeaking()
    }
  }

  const handleDone = () => {
    clearCurrentAnalysis()
    router.push('/')
  }

  if (!currentAnalysis) {
    return null
  }

  const progress = ((currentStep + 1) / currentAnalysis.steps.length) * 100
  const isLastStep = currentStep === currentAnalysis.steps.length - 1

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/situation" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">Follow These Steps</h1>
              <p className="text-sm text-gray-500">{currentAnalysis.summary}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentAnalysis.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
            currentAnalysis.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
            currentAnalysis.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {currentAnalysis.severity}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6 max-w-lg mx-auto w-full">
        {/* Step Counter */}
        <div className="text-center mb-6">
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {currentAnalysis.steps.length}
          </span>
        </div>

        {/* Current Step Card */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 flex-1 flex flex-col justify-center">
            <p className="text-2xl font-medium text-gray-900 text-center leading-relaxed">
              {currentAnalysis.steps[currentStep]}
            </p>
          </div>

          {/* Voice Button */}
          <button
            onClick={toggleSpeech}
            className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 font-medium transition-all mb-4 ${
              isSpeaking 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-5 w-5" />
                Stop Speaking
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5" />
                Read Aloud
              </>
            )}
          </button>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-700 font-medium transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </button>
            
            {isLastStep ? (
              <button
                onClick={handleDone}
                className="flex-1 py-4 px-6 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                Done
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex-1 py-4 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium transition-all flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Risks Warning */}
        {currentAnalysis.risks.length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 mb-1">Risks to be aware of:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {currentAnalysis.risks.map((risk, i) => (
                    <li key={i}>• {risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Call */}
        <div className="mt-6 text-center">
          <a 
            href="tel:112" 
            className="inline-flex items-center gap-2 text-red-500 font-semibold hover:text-red-600 transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call 112 for Immediate Help
          </a>
        </div>
      </main>
    </div>
  )
}
