'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, MapPin, Phone, Clock, Send, CheckCircle2,
  Heart, Flame, Car, Shield, AlertTriangle, Bell,
  Radio, UserCheck, ChevronRight, MessageSquare,
  FileText, Loader2, X, Volume2, Eye, Zap, Activity
} from 'lucide-react'
import { AuthGuard } from '@/components/auth-guard'
import { supabase } from '@/lib/supabase'

const MapComponent = dynamic(() => import('@/components/map').then(m => ({ default: m.Map })), { ssr: false })

interface Session {
  id: string
  type: string
  severity: string
  summary: string
  status: string
  location?: { address?: string; lat?: number; lng?: number }
  messages: any[]
  steps: any[]
  escalatedAt: number
  assignedResponder?: any
  language?: string
  imageSnapshot?: string
  qaReport?: any
}

const typeIcons: Record<string, any> = {
  medical: Heart, fire: Flame, accident: Car, safety: Shield, other: AlertTriangle
}

const typeColors: Record<string, string> = {
  medical: 'text-pink-400', fire: 'text-orange-400', accident: 'text-yellow-400',
  safety: 'text-blue-400', other: 'text-zinc-400'
}

function DispatchContent() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selected, setSelected] = useState<Session | null>(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [qaLoading, setQaLoading] = useState(false)
  const [qaReport, setQaReport] = useState<any>(null)
  const [showQA, setShowQA] = useState(false)
  const [responders, setResponders] = useState<any[]>([])
  const [dispatching, setDispatching] = useState<string | null>(null)
  const msgEndRef = useRef<HTMLDivElement>(null)

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/escalation')
      const data = await res.json()
      setSessions(data.sessions || [])
      if (selected) {
        const updated = data.sessions?.find((s: Session) => s.id === selected.id)
        if (updated) setSelected(updated)
      }
    } catch {}
    setLoading(false)
  }, [selected])

  // Fetch responders
  const fetchResponders = async () => {
    const { data } = await supabase.from('responders').select('*')
    if (data) setResponders(data)
  }

  useEffect(() => { fetchSessions(); fetchResponders() }, [])

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('dispatch-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalated_sessions' }, () => fetchSessions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responders' }, () => fetchResponders())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchSessions])

  // Auto-scroll messages
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selected?.messages])

  // Send message
  const sendMessage = async () => {
    if (!selected || !msg.trim()) return
    const text = msg.trim()
    setMsg('')
    await fetch('/api/escalation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selected.id, message: text }),
    })
    fetchSessions()
  }

  // Dispatch responder
  const assignResponder = async (type: 'medical' | 'police' | 'fire') => {
    if (!selected) return
    setDispatching(type)
    const loc = selected.location

    if (loc?.lat && loc?.lng) {
      const res = await fetch('/api/auto-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selected.id, type, severity: selected.severity,
          lat: loc.lat, lng: loc.lng,
        }),
      })
      const data = await res.json()
      if (data.dispatched?.length) {
        await fetch('/api/escalation', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selected.id,
            message: `${data.dispatched[0].name} (${data.dispatched[0].unit}) dispatched — ETA ${data.dispatched[0].eta} min`,
          }),
        })
      }
    } else {
      const units: Record<string, any> = {
        medical: { name: 'Ambulance Unit 3', unit: 'EMS-3' },
        police: { name: 'Patrol Unit 7', unit: 'POL-7' },
        fire: { name: 'Engine 5', unit: 'FIRE-5' },
      }
      await fetch('/api/escalation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selected.id, status: 'assigned',
          assignedResponder: { id: type, name: units[type].name, role: type, unit: units[type].unit },
          message: `${units[type].name} dispatched`,
        }),
      })
    }
    setDispatching(null)
    fetchSessions()
    fetchResponders()
  }

  // Resolve session
  const resolveSession = async () => {
    if (!selected) return
    await fetch('/api/escalation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selected.id, status: 'resolved', message: 'Session resolved by dispatch' }),
    })
    // Also resolve the incident
    await supabase.from('incidents').update({ status: 'resolved' }).eq('reported_by', selected.id)
    // Free up responders
    if (selected.assignedResponder?.id) {
      await supabase.from('responders').update({ status: 'available', current_incident_id: null }).eq('id', selected.assignedResponder.id)
    }
    setSelected(null)
    fetchSessions()
    fetchResponders()
  }

  // QA Report
  const generateQA = async () => {
    if (!selected) return
    setQaLoading(true)
    try {
      const res = await fetch('/api/qa-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selected.id }),
      })
      const data = await res.json()
      setQaReport(data.report)
      setShowQA(true)
      fetchSessions()
    } catch (e) { console.error(e) }
    setQaLoading(false)
  }

  // Map markers
  const mapMarkers = useMemo(() => {
    const m: any[] = []
    sessions.forEach(s => {
      if (s.location?.lat && s.location?.lng) {
        m.push({ position: [s.location.lat, s.location.lng] as [number, number], popup: `<b>${s.summary || 'Emergency'}</b><br/>${s.severity} • ${s.type}`, type: 'incident' as const })
      }
    })
    responders.filter(r => r.location_lat && r.location_lng).forEach(r => {
      m.push({ position: [Number(r.location_lat), Number(r.location_lng)] as [number, number], popup: `<b>${r.name}</b><br/>${r.unit_id} • ${r.status}`, type: 'responder' as const })
    })
    return m
  }, [sessions, responders])

  const criticalCount = sessions.filter(s => s.severity === 'CRITICAL').length
  const availableUnits = responders.filter(r => r.status === 'available').length

  const sevBadge = (s: string) => s === 'CRITICAL' ? 'text-red-400 bg-red-500/10 border-red-500/20' : s === 'HIGH' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
  const statusBadge = (s: string) => s === 'resolved' ? 'text-green-400 bg-green-500/10' : s === 'assigned' ? 'text-blue-400 bg-blue-500/10' : s === 'connected' ? 'text-green-400 bg-green-500/10' : 'text-amber-400 bg-amber-500/10'

  const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return 'Just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    return `${Math.floor(s / 3600)}h ago`
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-12 border-b border-zinc-800/50 flex items-center justify-between px-4 flex-shrink-0 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 hover:bg-zinc-800 rounded transition-colors">
            <ArrowLeft className="h-4 w-4 text-zinc-500" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="h-4 w-4 text-red-500" />
              {sessions.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </div>
            <span className="text-sm font-semibold tracking-tight">Dispatch Command</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 animate-pulse">
              <Zap className="h-3 w-3" /> {criticalCount} critical
            </span>
          )}
          <span className="text-zinc-500">{sessions.length} active</span>
          <span className="text-zinc-600">|</span>
          <span className="text-green-400">{availableUnits} units ready</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Session List */}
        <div className="w-72 border-r border-zinc-800/50 flex flex-col flex-shrink-0 bg-zinc-950/50">
          <div className="p-2 border-b border-zinc-800/30">
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-medium px-1">Escalated Incidents</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 text-zinc-700 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <CheckCircle2 className="h-8 w-8 text-zinc-800 mb-2" />
                <p className="text-[11px] text-zinc-600">All clear</p>
                <p className="text-[10px] text-zinc-700">No active emergencies</p>
              </div>
            ) : sessions.map(s => {
              const Icon = typeIcons[s.type] || AlertTriangle
              const active = selected?.id === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setShowQA(false); setQaReport(s.qaReport || null) }}
                  className={`w-full p-3 text-left border-b border-zinc-800/20 transition-all ${active ? 'bg-zinc-800/60 border-l-2 border-l-red-500' : 'hover:bg-zinc-900/60 border-l-2 border-l-transparent'}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${typeColors[s.type] || 'text-zinc-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium truncate">{s.summary || 'Emergency'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[9px] px-1 py-px rounded border ${sevBadge(s.severity)}`}>{s.severity}</span>
                        <span className={`text-[9px] px-1 py-px rounded ${statusBadge(s.status)}`}>{s.status}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(s.escalatedAt)}
                        {s.location?.address && (
                          <>
                            <span className="text-zinc-800">·</span>
                            <span className="truncate">{s.location.address.split(',')[0]}</span>
                          </>
                        )}
                      </div>
                      {s.assignedResponder && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-green-500">
                          <UserCheck className="h-2.5 w-2.5" />
                          {s.assignedResponder.name}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Session Header */}
              <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-sm font-semibold">{selected.summary || 'Emergency'}</h2>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${sevBadge(selected.severity)}`}>{selected.severity}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${statusBadge(selected.status)}`}>{selected.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                    <span className="font-mono">{selected.id}</span>
                    <span>·</span>
                    <Clock className="h-2.5 w-2.5" />
                    <span>{timeAgo(selected.escalatedAt)}</span>
                    {selected.location?.address && (
                      <>
                        <span>·</span>
                        <MapPin className="h-2.5 w-2.5" />
                        <span>{selected.location.address.split(',').slice(0, 2).join(',')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['medical', 'police', 'fire'] as const).map(type => {
                    const icons = { medical: Heart, police: Shield, fire: Flame }
                    const labels = { medical: 'EMS', police: 'Police', fire: 'Fire' }
                    const colors = { medical: 'hover:bg-pink-500/10 hover:border-pink-500/30', police: 'hover:bg-blue-500/10 hover:border-blue-500/30', fire: 'hover:bg-orange-500/10 hover:border-orange-500/30' }
                    const IconC = icons[type]
                    return (
                      <button key={type} onClick={() => assignResponder(type)} disabled={dispatching === type}
                        className={`px-2 py-1.5 text-[11px] bg-zinc-900 border border-zinc-800 rounded-lg transition-all flex items-center gap-1 ${colors[type]} ${dispatching === type ? 'opacity-50' : ''}`}>
                        {dispatching === type ? <Loader2 className="h-3 w-3 animate-spin" /> : <IconC className={`h-3 w-3 ${typeColors[type] || ''}`} />}
                        {labels[type]}
                      </button>
                    )
                  })}
                  <button onClick={generateQA} disabled={qaLoading}
                    className="px-2 py-1.5 text-[11px] bg-zinc-900 border border-zinc-800 rounded-lg transition-all hover:bg-zinc-800 flex items-center gap-1">
                    {qaLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3 text-zinc-500" />}
                    QA
                  </button>
                  {selected.status !== 'resolved' && (
                    <button onClick={resolveSession}
                      className="px-2 py-1.5 text-[11px] bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg transition-all hover:bg-green-500/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Resolve
                    </button>
                  )}
                </div>
              </div>

              {/* Assigned Responder Banner */}
              {selected.assignedResponder && (
                <div className="mx-4 mt-2 p-2 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-2 text-xs flex-shrink-0">
                  <UserCheck className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-green-300 font-medium">{selected.assignedResponder.name}</span>
                  <span className="text-green-500/50 text-[10px]">({selected.assignedResponder.unit})</span>
                  <span className="ml-auto text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                    <Activity className="h-2.5 w-2.5" /> En Route
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Transcript + Map */}
                <div className="flex-1 flex flex-col border-r border-zinc-800/50">
                  {/* Map */}
                  {(selected.location?.lat || mapMarkers.length > 0) && (
                    <div className="h-44 border-b border-zinc-800/50 flex-shrink-0">
                      <MapComponent
                        center={selected.location?.lat && selected.location?.lng ? [selected.location.lat, selected.location.lng] : undefined}
                        zoom={14}
                        markers={mapMarkers}
                      />
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {selected.messages?.map((m: any) => {
                      const isSystem = m.role === 'system'
                      const isUser = m.role === 'user'
                      const isDispatch = m.role === 'dispatch'
                      const isAI = m.role === 'ai'

                      if (isSystem) {
                        return (
                          <div key={m.id} className="flex justify-center">
                            <span className="text-[10px] text-amber-400/60 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-full">
                              {m.content}
                            </span>
                          </div>
                        )
                      }

                      return (
                        <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-xl px-3 py-2 ${
                            isUser ? 'bg-blue-600/15 border border-blue-500/20' :
                            isDispatch ? 'bg-green-600/15 border border-green-500/20' :
                            'bg-zinc-800/40 border border-zinc-700/30'
                          }`}>
                            <p className={`text-[9px] mb-0.5 font-medium ${
                              isUser ? 'text-blue-400' : isDispatch ? 'text-green-400' : 'text-zinc-500'
                            }`}>
                              {isUser ? 'Caller' : isDispatch ? 'You (Dispatch)' : 'AI Assistant'}
                            </p>
                            <p className="text-xs text-zinc-200 leading-relaxed">{m.content}</p>
                            <p className="text-[9px] text-zinc-600 mt-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={msgEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-zinc-800/50 flex gap-2 flex-shrink-0">
                    <input
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Message to caller..."
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700 transition-colors"
                    />
                    <button onClick={sendMessage} disabled={!msg.trim()} className="px-3 py-2 bg-white text-zinc-900 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Panel: Steps + QA + Snapshot */}
                <div className="w-60 flex flex-col flex-shrink-0 bg-zinc-950/30">
                  <div className="p-3 border-b border-zinc-800/30 text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> AI-Generated Steps
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                    {/* QA Report */}
                    {showQA && qaReport && (
                      <div className="mb-2 p-2.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium flex items-center gap-1"><FileText className="h-3 w-3 text-zinc-500" /> QA Report</span>
                          <button onClick={() => setShowQA(false)} className="hover:bg-zinc-800 p-0.5 rounded"><X className="h-3 w-3 text-zinc-600" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          {[
                            { label: 'Score', value: `${qaReport.responseScore}/100`, color: (qaReport.responseScore || 0) >= 80 ? 'text-green-400' : 'text-yellow-400' },
                            { label: 'Quality', value: qaReport.responseQuality, color: 'text-white' },
                            { label: 'Empathy', value: `${qaReport.aiPerformance?.empathy}/10`, color: 'text-white' },
                            { label: 'Accuracy', value: `${qaReport.aiPerformance?.accuracy}/10`, color: 'text-white' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-zinc-800/50 rounded p-1.5">
                              <span className="text-zinc-600 text-[9px]">{label}</span>
                              <p className={`font-bold ${color}`}>{value}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">{qaReport.summary}</p>
                        {qaReport.recommendations?.length > 0 && (
                          <div className="text-[10px]">
                            <span className="text-zinc-500 font-medium">Recommendations:</span>
                            <ul className="list-disc pl-3 mt-0.5 space-y-0.5 text-zinc-600">
                              {qaReport.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Steps */}
                    {selected.steps?.length > 0 ? (
                      selected.steps.map((step: any, i: number) => (
                        <div key={step.id || i} className={`p-2 rounded-lg text-[11px] transition-all ${step.completed ? 'bg-green-500/5 border border-green-500/10' : 'bg-zinc-900/50 border border-zinc-800/30'}`}>
                          <div className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold mt-px ${
                              step.completed ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-400'
                            }`}>
                              {step.completed ? '✓' : i + 1}
                            </div>
                            <span className={step.completed ? 'text-green-400/50 line-through' : 'text-zinc-300'}>{step.text}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-zinc-700 text-center py-6">No steps generated yet</p>
                    )}
                  </div>

                  {/* Camera Snapshot */}
                  {selected.imageSnapshot && (
                    <div className="p-2 border-t border-zinc-800/30">
                      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Eye className="h-2.5 w-2.5" /> Scene Capture
                      </div>
                      <img src={selected.imageSnapshot} alt="Scene" className="w-full rounded-lg border border-zinc-800/50" />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Radio className="h-12 w-12 text-zinc-800 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-medium">Dispatch Command Center</p>
                <p className="text-[11px] text-zinc-700 mt-1">Escalated emergencies will appear on the left</p>
                <p className="text-[10px] text-zinc-800 mt-3">{responders.length} responders registered • {availableUnits} available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DispatchDashboard() {
  return <AuthGuard><DispatchContent /></AuthGuard>
}
