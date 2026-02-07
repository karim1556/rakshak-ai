'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, Shield, Mic, ChevronRight, Heart, Flame, AlertTriangle } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Background Effect */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
      <div className="fixed inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col">
        {/* Header */}
        <header className="px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl">Rakshak AI</span>
            </div>
            <Link 
              href="/dashboard/dispatch"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Responder Login →
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <div className="text-center max-w-2xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700 mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-300">AI Emergency Assistant Available 24/7</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Need help?
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Talk to me.
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-12 max-w-md mx-auto">
              I&apos;ll guide you step-by-step through any emergency. If needed, I&apos;ll connect you directly with responders.
            </p>

            {/* Main CTA Button */}
            <button
              onClick={() => router.push('/emergency')}
              className="group relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 mb-8"
            >
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent" />
              <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center">
                <Mic className="h-12 w-12 md:h-16 md:w-16 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-lg md:text-xl font-semibold">Get Help</span>
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full animate-ping bg-blue-500/20" style={{ animationDuration: '2s' }} />
              <div className="absolute -inset-3 rounded-full animate-ping bg-blue-500/10" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
            </button>

            <p className="text-sm text-slate-500 mb-16">
              Tap to start talking with AI assistant
            </p>

            {/* Emergency Numbers */}
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="tel:112"
                className="flex items-center gap-3 px-5 py-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors"
              >
                <Phone className="h-5 w-5 text-red-400" />
                <span className="text-red-400 font-medium">Call 112</span>
              </a>
              <a 
                href="tel:108"
                className="flex items-center gap-3 px-5 py-3 bg-pink-500/10 border border-pink-500/30 rounded-xl hover:bg-pink-500/20 transition-colors"
              >
                <Heart className="h-5 w-5 text-pink-400" />
                <span className="text-pink-400 font-medium">Ambulance 108</span>
              </a>
              <a 
                href="tel:101"
                className="flex items-center gap-3 px-5 py-3 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors"
              >
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-orange-400 font-medium">Fire 101</span>
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-slate-800/50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>Your safety is our priority. All conversations are private and secure.</p>
            <div className="flex gap-6">
              <Link href="/dashboard/medical" className="hover:text-white transition-colors flex items-center gap-1">
                Medical <ChevronRight className="h-3 w-3" />
              </Link>
              <Link href="/dashboard/police" className="hover:text-white transition-colors flex items-center gap-1">
                Police <ChevronRight className="h-3 w-3" />
              </Link>
              <Link href="/dashboard/fire" className="hover:text-white transition-colors flex items-center gap-1">
                Fire <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
