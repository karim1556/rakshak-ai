'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const check = async () => {
      // Check demo auth
      if (localStorage.getItem('rakshak-auth') === 'demo') {
        setAuthenticated(true)
        setLoading(false)
        return
      }
      // Check Supabase auth
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setAuthenticated(true)
      } else {
        router.replace('/login')
      }
      setLoading(false)
    }
    check()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
      </div>
    )
  }

  if (!authenticated) return null
  return <>{children}</>
}
