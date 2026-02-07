'use client'

import Link from 'next/link'
import { AlertCircle, PhoneOff, Shield, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-white">Rakshak AI</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/citizen">
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
                Citizen Portal
              </Button>
            </Link>
            <Link href="/responder/medical">
              <Button className="bg-blue-600 hover:bg-blue-700">Medical Responder</Button>
            </Link>
            <Link href="/responder/police">
              <Button className="bg-purple-600 hover:bg-purple-700">Police Responder</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="space-y-6 text-center">
          <h2 className="text-5xl font-bold text-white text-balance">
            Emergency Intelligence Platform
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-slate-300 text-pretty">
            Rakshak AI uses advanced artificial intelligence to analyze emergency situations in real-time, prioritize response, and coordinate multiple emergency services for faster, more effective help.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/citizen">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                Report Emergency
              </Button>
            </Link>
            <Link href="/responder/medical">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 bg-transparent">
                Responder Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <Zap className="mb-2 h-8 w-8 text-yellow-500" />
              <CardTitle className="text-white">AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Real-time analysis of emergency situations using advanced AI algorithms to assess severity and urgency.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-blue-500" />
              <CardTitle className="text-white">Multi-Agency Coordination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Seamlessly coordinate between medical responders, police, and other emergency services in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <Shield className="mb-2 h-8 w-8 text-green-500" />
              <CardTitle className="text-white">Secure Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                End-to-end encrypted voice and data communication between citizens and responders.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <PhoneOff className="mb-2 h-8 w-8 text-red-500" />
              <CardTitle className="text-white">One-Click Emergency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Simple, intuitive interface for reporting emergencies - no navigation needed in crisis moments.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <AlertCircle className="mb-2 h-8 w-8 text-orange-500" />
              <CardTitle className="text-white">Smart Prioritization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Automatic prioritization based on emergency severity, location, and available resources.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <Zap className="mb-2 h-8 w-8 text-cyan-500" />
              <CardTitle className="text-white">Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Live incident tracking and status updates for all stakeholders throughout the emergency response.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="rounded-lg bg-slate-800 p-8 border border-slate-700">
          <h3 className="mb-4 text-3xl font-bold text-white">
            Be Part of the Emergency Response Revolution
          </h3>
          <p className="mb-6 text-slate-300">
            Rakshak AI is bringing faster, smarter emergency response to your community.
          </p>
          <Link href="/citizen">
            <Button size="lg" className="bg-red-600 hover:bg-red-700">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400">
          <p>&copy; 2024 Rakshak AI - Intelligent Emergency Response. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
