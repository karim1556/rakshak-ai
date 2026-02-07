'use client'

import Link from 'next/link'
import { Phone, HelpCircle, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-500" />
          <span className="font-semibold text-gray-900">Rakshak AI</span>
        </div>
        <nav className="flex gap-2">
          <Link 
            href="/dashboard/medical" 
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Medical
          </Link>
          <Link 
            href="/dashboard/police" 
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Police
          </Link>
        </nav>
      </header>

      {/* Main Content - Two Big Buttons */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Title */}
          <div className="text-center space-y-2 mb-12">
            <h1 className="text-3xl font-bold text-gray-900">Emergency Help</h1>
            <p className="text-gray-500">Get immediate assistance</p>
          </div>

          {/* Call Emergency Button */}
          <a 
            href="tel:112"
            className="block w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl p-8 text-center transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/20"
          >
            <Phone className="h-12 w-12 mx-auto mb-4" />
            <span className="text-2xl font-semibold block">Call Emergency</span>
            <span className="text-red-100 text-sm mt-1 block">Dial 112 immediately</span>
          </a>

          {/* What Should I Do Button */}
          <Link 
            href="/situation"
            className="block w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl p-8 text-center transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            <HelpCircle className="h-12 w-12 mx-auto mb-4" />
            <span className="text-2xl font-semibold block">What should I do?</span>
            <span className="text-gray-400 text-sm mt-1 block">Get AI-guided instructions</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-sm text-gray-400 border-t border-gray-100">
        <p>Stay calm. Help is on the way.</p>
      </footer>
    </div>
  )
}
