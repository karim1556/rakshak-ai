'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mic, Shield, Phone, Heart, Flame } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-800/50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-zinc-400" />
            <span className="font-semibold text-sm">Rakshak AI</span>
          </div>
          <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Responder Login →
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="text-center max-w-md mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800 mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[11px] text-zinc-400">AI Emergency Assistant — 24/7</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
            Need help?
            <br />
            <span className="text-zinc-500">Talk to me.</span>
          </h1>

          <p className="text-sm text-zinc-500 mb-10 max-w-sm mx-auto">
            AI-powered emergency assistant. Describe your situation, get real-time guidance, and auto-dispatch responders.
          </p>

          {/* CTA */}
          <button
            onClick={() => router.push('/emergency')}
            className="group w-32 h-32 md:w-36 md:h-36 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all duration-300 mb-6 mx-auto flex flex-col items-center justify-center relative"
          >
            <Mic className="h-10 w-10 md:h-12 md:w-12 mb-1.5 text-zinc-300 group-hover:text-white transition-colors" />
            <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Get Help</span>
            <div className="absolute inset-0 rounded-full animate-ping bg-zinc-700/10" style={{ animationDuration: '3s' }} />
          </button>

          <p className="text-[11px] text-zinc-600 mb-14">Tap to start • Voice + Camera + Location</p>

          {/* Emergency numbers */}
          <div className="flex flex-wrap justify-center gap-3">
            <a href="tel:112" className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors">
              <Phone className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-zinc-400">112</span>
            </a>
            <a href="tel:108" className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors">
              <Heart className="h-3.5 w-3.5 text-pink-400" />
              <span className="text-xs text-zinc-400">108</span>
            </a>
            <a href="tel:101" className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs text-zinc-400">101</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-zinc-800/30">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-zinc-600">
          <span>Encrypted & private</span>
          <div className="flex gap-4">
            <Link href="/dashboard/dispatch" className="hover:text-zinc-400 transition-colors">Dispatch</Link>
            <Link href="/dashboard/police" className="hover:text-zinc-400 transition-colors">Police</Link>
            <Link href="/dashboard/medical" className="hover:text-zinc-400 transition-colors">Medical</Link>
            <Link href="/dashboard/fire" className="hover:text-zinc-400 transition-colors">Fire</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
