'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Phone, PhoneOff, MessageSquare, MapPin, Clock, 
  AlertTriangle, Users, Shield, Radio, Send, Mic, MicOff,
  Volume2, VolumeX, ChevronRight, User, Bot, CheckCircle,
  Ambulance, Car, Flame, Siren, Timer, TrendingUp, Zap,
  Headphones, Eye, MoreVertical
} from 'lucide-react'

// Mock escalated sessions for demo
const mockEscalatedSessions = [
  {
    id: 'EM-1707300000-abc123',
    status: 'escalated',
    type: 'medical',
    severity: 'CRITICAL',
    summary: 'Person collapsed and not breathing',
    location: { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, Delhi' },
    createdAt: Date.now() - 300000,
    escalatedAt: Date.now() - 60000,
    messages: [
      { id: '1', role: 'ai', content: "I'm here to help. What's happening?", timestamp: Date.now() - 290000 },
      { id: '2', role: 'user', content: "My father just collapsed! He's not moving!", timestamp: Date.now() - 280000 },
      { id: '3', role: 'ai', content: "I understand this is frightening. Is he breathing? Can you see his chest moving?", timestamp: Date.now() - 270000 },
      { id: '4', role: 'user', content: "No, no I don't think so. His lips are turning blue!", timestamp: Date.now() - 260000 },
      { id: '5', role: 'ai', content: "This is critical. I'm connecting you to emergency dispatch right now. While we connect, do you know CPR?", timestamp: Date.now() - 250000 },
      { id: '6', role: 'user', content: "No I don't know!", timestamp: Date.now() - 240000 },
      { id: '7', role: 'system', content: "⚠️ Escalating to emergency dispatch...", timestamp: Date.now() - 60000 },
    ],
    steps: [
      { id: 's1', text: 'Check if person is responsive - tap shoulders and call their name', completed: true },
      { id: 's2', text: 'Call out for help from anyone nearby', completed: true },
      { id: 's3', text: 'Place person flat on their back on a firm surface', completed: false },
      { id: 's4', text: 'Begin chest compressions: Press hard and fast on center of chest', completed: false },
    ]
  },
  {
    id: 'EM-1707300001-def456',
    status: 'escalated',
    type: 'fire',
    severity: 'HIGH',
    summary: 'Fire in apartment building',
    location: { lat: 28.5355, lng: 77.3910, address: 'Sector 18, Noida' },
    createdAt: Date.now() - 600000,
    escalatedAt: Date.now() - 120000,
    messages: [
      { id: '1', role: 'ai', content: "I'm here to help. What's happening?", timestamp: Date.now() - 590000 },
      { id: '2', role: 'user', content: "There's smoke coming from my neighbor's apartment!", timestamp: Date.now() - 580000 },
      { id: '3', role: 'ai', content: "Can you see flames or just smoke? Are you in a safe place?", timestamp: Date.now() - 570000 },
      { id: '4', role: 'user', content: "I can see flames through the window! I'm in the hallway", timestamp: Date.now() - 560000 },
      { id: '5', role: 'system', content: "⚠️ Escalating to emergency dispatch...", timestamp: Date.now() - 120000 },
    ],
    steps: [
      { id: 's1', text: 'Alert other residents by knocking on doors while evacuating', completed: true },
      { id: 's2', text: 'Use stairs only - never use elevator during fire', completed: false },
      { id: 's3', text: 'Stay low if there is smoke - crawl if necessary', completed: false },
    ]
  },
  {
    id: 'EM-1707300002-ghi789',
    status: 'connected',
    type: 'accident',
    severity: 'HIGH',
    summary: 'Multiple vehicle accident on highway',
    location: { lat: 28.4595, lng: 77.0266, address: 'NH48, Gurgaon' },
    createdAt: Date.now() - 900000,
    escalatedAt: Date.now() - 300000,
    assignedResponder: { id: 'R1', name: 'Officer Sharma', role: 'Police', unit: 'PCR-42' },
    messages: [
      { id: '1', role: 'user', content: "There's been a big accident! Multiple cars!", timestamp: Date.now() - 890000 },
      { id: '2', role: 'ai', content: "How many vehicles are involved? Is anyone injured?", timestamp: Date.now() - 880000 },
      { id: '3', role: 'user', content: "3 or 4 cars, people are trapped!", timestamp: Date.now() - 870000 },
      { id: '4', role: 'system', content: "⚠️ Escalating to emergency dispatch...", timestamp: Date.now() - 300000 },
      { id: '5', role: 'dispatch', content: "This is Officer Sharma from PCR-42. We're 5 minutes away. Stay on the line.", timestamp: Date.now() - 200000 },
    ],
    steps: [
      { id: 's1', text: 'Move to a safe distance from the accident', completed: true },
      { id: 's2', text: 'Turn on hazard lights if you have a vehicle nearby', completed: true },
      { id: 's3', text: 'Guide emergency vehicles when they arrive', completed: false },
    ]
  },
]

export default function DispatchDashboard() {
  const [sessions, setSessions] = useState(mockEscalatedSessions)
  const [selectedSession, setSelectedSession] = useState(mockEscalatedSessions[0])
  const [messageInput, setMessageInput] = useState('')
  const [isCalling, setIsCalling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedSession?.messages])

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return <Ambulance className="h-5 w-5" />
      case 'fire': return <Flame className="h-5 w-5" />
      case 'safety': return <Shield className="h-5 w-5# " />
      case 'accident': return <Car className="h-5 w-5" />
      default: return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedSession) return

    const newMessage = {
      id: `msg-${Date.now()}`,
      role: 'dispatch' as const,
      content: messageInput,
      timestamp: Date.now(),
    }

    setSessions(sessions.map(s => 
      s.id === selectedSession.id 
        ? { ...s, messages: [...s.messages, newMessage] }
        : s
    ))
    setSelectedSession({
      ...selectedSession,
      messages: [...selectedSession.messages, newMessage],
    })
    setMessageInput('')
  }

  const handleConnectCall = () => {
    setIsCalling(!isCalling)
  }

  const handleAssign = (sessionId: string) => {
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            status: 'connected',
            assignedResponder: { id: 'D1', name: 'You', role: 'Dispatcher', unit: 'DISPATCH-1' }
          }
        : s
    ))
    if (selectedSession?.id === sessionId) {
      setSelectedSession({
        ...selectedSession,
        status: 'connected',
        assignedResponder: { id: 'D1', name: 'You', role: 'Dispatcher', unit: 'DISPATCH-1' }
      })
    }
  }

  const stats = {
    escalated: sessions.filter(s => s.status === 'escalated').length,
    connected: sessions.filter(s => s.status === 'connected').length,
    critical: sessions.filter(s => s.severity === 'CRITICAL').length,
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      
      <div className="relative">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                  <ArrowLeft className="h-5 w-5 text-slate-400" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                    <Siren className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="font-bold">Dispatch Command Center</h1>
                    <p className="text-xs text-slate-500">Live Emergency Escalations</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/30 animate-pulse">
                  <Zap className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">{stats.escalated} Waiting</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <Radio className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-73px)]">
          {/* Sessions List */}
          <div className="w-80 border-r border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800">
              <h2 className="font-semibold text-sm text-slate-400 uppercase tracking-wide">Escalated Incidents</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full p-4 text-left border-b border-slate-800/50 transition-all hover:bg-slate-800/50 ${
                    selectedSession?.id === session.id ? 'bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      session.type === 'medical' ? 'bg-pink-500/20 text-pink-400' :
                      session.type === 'fire' ? 'bg-orange-500/20 text-orange-400' :
                      session.type === 'accident' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {getTypeIcon(session.type || 'other')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${getSeverityColor(session.severity || 'LOW')} ${
                          session.severity === 'CRITICAL' ? 'animate-pulse' : ''
                        }`} />
                        <span className="font-medium text-sm truncate">{session.summary}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>Escalated {formatTime(session.escalatedAt || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          session.status === 'escalated' ? 'bg-red-500/20 text-red-400' :
                          session.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {session.status === 'escalated' ? 'WAITING' : 'CONNECTED'}
                        </span>
                        {session.assignedResponder && (
                          <span className="text-xs text-slate-500">{session.assignedResponder.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          {selectedSession ? (
            <div className="flex-1 flex flex-col">
              {/* Session Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${getSeverityColor(selectedSession.severity || 'LOW')}`}>
                        {selectedSession.severity}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{selectedSession.id}</span>
                    </div>
                    <h2 className="text-lg font-semibold">{selectedSession.summary}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedSession.location?.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Started {formatTime(selectedSession.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSession.status === 'escalated' && (
                      <button
                        onClick={() => handleAssign(selectedSession.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                      >
                        <Headphones className="h-4 w-4" />
                        Take Over
                      </button>
                    )}
                    <button
                      onClick={handleConnectCall}
                      className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                        isCalling 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isCalling ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                      {isCalling ? 'End Call' : 'Voice Call'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex">
                {/* Messages */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedSession.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'dispatch' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-3 max-w-[70%] ${msg.role === 'dispatch' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'user' ? 'bg-blue-600' :
                            msg.role === 'ai' ? 'bg-purple-600' :
                            msg.role === 'dispatch' ? 'bg-emerald-600' :
                            'bg-amber-600'
                          }`}>
                            {msg.role === 'user' ? <User className="h-4 w-4" /> :
                             msg.role === 'ai' ? <Bot className="h-4 w-4" /> :
                             msg.role === 'dispatch' ? <Headphones className="h-4 w-4" /> :
                             <AlertTriangle className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className={`rounded-2xl px-4 py-2 ${
                              msg.role === 'dispatch' ? 'bg-emerald-600' :
                              msg.role === 'system' ? 'bg-amber-500/20 border border-amber-500/30' :
                              'bg-slate-800'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            <span className="text-xs text-slate-500 mt-1 block px-2">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-slate-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Send message to citizen..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sidebar - Steps & Info */}
                <div className="w-72 border-l border-slate-800 bg-slate-900/30">
                  {/* Steps */}
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">AI-Generated Steps</h3>
                    <div className="space-y-2">
                      {selectedSession.steps.map((step, i) => (
                        <div key={step.id} className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                            step.completed ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}>
                            {step.completed ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <span className="text-xs">{i + 1}</span>
                            )}
                          </div>
                          <p className={`text-xs ${step.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                            {step.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Dispatch Units</h3>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-3 p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl hover:bg-pink-500/20 transition-colors">
                        <Ambulance className="h-4 w-4 text-pink-400" />
                        <span className="text-sm text-pink-400">Dispatch Ambulance</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors">
                        <Car className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-blue-400">Dispatch Police</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors">
                        <Flame className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-orange-400">Dispatch Fire</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Siren className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-400">Select an Incident</h3>
                <p className="text-sm text-slate-500">Choose from the escalated incidents list</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
