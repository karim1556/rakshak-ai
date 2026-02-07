'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('Check your email to confirm your account.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard/dispatch')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  // Demo login — skip auth for hackathon demo
  const handleDemoLogin = () => {
    localStorage.setItem('rakshak-auth', 'demo')
    router.push('/dashboard/dispatch')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-zinc-900" />
          </div>
          <h1 className="text-xl font-semibold">Rakshak AI</h1>
          <p className="text-sm text-zinc-500 mt-1">Dispatch & Responder Access</p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
          />

          {error && (
            <p className={`text-xs ${error.includes('Check') ? 'text-green-400' : 'text-red-400'}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" />
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-600">OR</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Demo Login */}
        <button
          onClick={handleDemoLogin}
          className="w-full py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors flex items-center justify-center gap-2"
        >
          Continue as Demo User
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-[10px] text-zinc-700 text-center mt-6">
          Citizens don&apos;t need an account. Go to{' '}
          <a href="/" className="text-zinc-500 hover:text-white">/</a>
          {' '}to report an emergency.
        </p>
      </div>
    </div>
  )
}
