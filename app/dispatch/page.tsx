'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, MapPin, Phone, Clock, Send, CheckCircle2,
  Heart, Flame, Car, Shield, AlertTriangle, Bell,
  Radio, UserCheck, ChevronRight, MessageSquare,
  FileText, Loader2, X
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

const typeIcons: Record<string, any> = { medical: Heart, fire: Flame, accident: Car, safety: Shield, other: AlertTriangle }

function DispatchContent() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selected, setSelected] = useState<Session | null>(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [qaLoading, setQaLoading] = useState(false)
  const [qaReport, setQaReport] = useState<any>(null)
  const [showQA, setShowQA] = useState(false)
  const [responders, setResponders] = useState<any[]>([])

  // Fetch sessions from Supabase
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

  // Fetch responders from Supabase
  const fetchResponders = async () => {
    const { data } = await supabase.from('responders').select('*')
    if (data) setResponders(data)
  }

  // Initial load
  useEffect(() => {
    fetchSessions()
    fetchResponders()
  }, [])

  // Realtime: listen for new/updated escalated sessions
  useEffect(() => {
    const channel = supabase
      .channel('dispatch-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalated_sessions' }, () => {
        fetchSessions()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchSessions])

  // Send dispatch message
  const sendMessage = async () => {
    if (!selected || !msg.trim()) return
    await fetch('/api/escalation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: selected.id, message: msg }),
    })
    setMsg('')
    fetchSessions()
  }

  // Assign responder
  const assignResponder = async (type: 'medical' | 'police' | 'fire') => {
    if (!selected) return
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
            message: `${data.dispatched[0].name} dispatched — ETA ${data.dispatched[0].eta} min`,
          }),
        })
      }
    } else {
      // Fallback: hardcoded assignment
      const responder = { medical: { name: 'Ambulance Unit 3', unit: 'EMS-3' }, police: { name: 'Patrol Unit 7', unit: 'PATROL-7' }, fire: { name: 'Engine 5', unit: 'ENGINE-5' } }[type]
      await fetch('/api/escalation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selected.id, status: 'assigned',
          assignedResponder: { id: type, name: responder.name, role: type, unit: responder.unit },
          message: `${responder.name} dispatched`,
        }),
      })
    }
    fetchSessions()
    fetchResponders()
  }

  // Generate QA report
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

  // Map markers from all sessions + responders
  const mapMarkers = useMemo(() => {
    const markers: any[] = []
    sessions.forEach(s => {
      if (s.location?.lat && s.location?.lng) {
        markers.push({
          position: [s.location.lat, s.location.lng] as [number, number],
          popup: `<b>${s.summary || 'Emergency'}</b><br/>${s.severity} • ${s.type}`,
          type: 'incident' as const,
        })
      }
    })
    responders.filter(r => r.location_lat && r.location_lng).forEach(r => {
      markers.push({
        position: [Number(r.location_lat), Number(r.location_lng)] as [number, number],
        popup: `<b>${r.name}</b><br/>${r.unit_id} • ${r.status}`,
        type: 'responder' as const,
      })
    })
    return markers
  }, [sessions, responders])

  const criticalCount = sessions.filter(s => s.severity === 'CRITICAL').length

  const severity = (s: string) => s === 'CRITICAL' ? 'text-red-400 bg-red-500/10' : s === 'HIGH' ? 'text-orange-400 bg-orange-500/10' : 'text-yellow-400 bg-yellow-500/10'

  const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return 'Just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    return `${Math.floor(s / 3600)}h ago`
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800/50 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4 text-zinc-500" />
          </Link>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Dispatch</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded-full animate-pulse">
              <Bell className="h-3 w-3" /> {criticalCount}
            </span>
          )}
          <span>{sessions.length} active</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Session List */}
        <div className="w-80 border-r border-zinc-800/50 flex flex-col flex-shrink-0">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 text-zinc-600 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <CheckCircle2 className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">No active emergencies</p>
              </div>
            ) : sessions.map(s => {
              const Icon = typeIcons[s.type] || AlertTriangle
              const active = selected?.id === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); setShowQA(false); setQaReport(s.qaReport || null) }}
                  className={`w-full p-3 text-left border-b border-zinc-800/30 transition-colors ${active ? 'bg-zinc-800/50' : 'hover:bg-zinc-900'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-3.5 w-3.5 ${s.severity === 'CRITICAL' ? 'text-red-400' : s.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}`} />
                    <span className="text-sm font-medium truncate flex-1">{s.summary || 'Emergency'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${severity(s.severity)}`}>{s.severity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                    <Clock className="h-3 w-3" />
                    {timeAgo(s.escalatedAt)}
                    {s.location?.address && (
                      <>
                        <span>·</span>
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{s.location.address.split(',')[0]}</span>
                      </>
                    )}
                  </div>
                  {s.assignedResponder && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-green-500">
                      <UserCheck className="h-3 w-3" />
                      {s.assignedResponder.name}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Session Header */}
              <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">{selected.summary || 'Emergency'}</h2>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${severity(selected.severity)}`}>{selected.severity}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{selected.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-600 mt-1">
                    <span>{selected.id}</span>
                    <span>·</span>
                    <span>{timeAgo(selected.escalatedAt)}</span>
                    {selected.location?.address && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selected.location.address.split(',').slice(0, 2).join(',')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => assignResponder('medical')} className="px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1"><Heart className="h-3 w-3 text-pink-400" />EMS</button>
                  <button onClick={() => assignResponder('police')} className="px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1"><Shield className="h-3 w-3 text-blue-400" />Police</button>
                  <button onClick={() => assignResponder('fire')} className="px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" />Fire</button>
                  <button onClick={generateQA} disabled={qaLoading} className="px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1">
                    {qaLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3 text-zinc-400" />}QA
                  </button>
                </div>
              </div>

              {/* Assigned Responder Banner */}
              {selected.assignedResponder && (
                <div className="mx-4 mt-2 p-2 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-2 text-xs text-green-400 flex-shrink-0">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>{selected.assignedResponder.name}</span>
                  <span className="text-green-500/50">({selected.assignedResponder.unit})</span>
                  <span className="ml-auto text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded">En Route</span>
                </div>
              )}

              {/* Content: Map + Transcript + Steps */}
              <div className="flex-1 flex overflow-hidden">
                {/* Transcript + Map column */}
                <div className="flex-1 flex flex-col border-r border-zinc-800/50">
                  {/* Map */}
                  {(selected.location?.lat || mapMarkers.length > 0) && (
                    <div className="h-48 border-b border-zinc-800/50 flex-shrink-0">
                      <MapComponent
                        center={selected.location?.lat && selected.location?.lng ? [selected.location.lat, selected.location.lng] : undefined}
                        zoom={14}
                        markers={mapMarkers}
                      />
                    </div>
                  )}

                  {/* Transcript */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {selected.messages?.filter((m: any) => m.role !== 'system').map((m: any) => (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          m.role === 'user' ? 'bg-blue-600/20 text-blue-100' :
                          m.role === 'dispatch' ? 'bg-green-600/20 text-green-100' :
                          'bg-zinc-800/50 text-zinc-300'
                        }`}>
                          <p className="text-[10px] text-zinc-500 mb-0.5">{m.role === 'user' ? 'Caller' : m.role === 'dispatch' ? 'Dispatch' : 'AI'}</p>
                          <p className="text-xs">{m.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-zinc-800/50 flex gap-2 flex-shrink-0">
                    <input
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Message to caller..."
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
                    />
                    <button onClick={sendMessage} className="px-3 py-2 bg-white text-zinc-900 rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Steps Panel */}
                <div className="w-64 flex flex-col flex-shrink-0">
                  <div className="p-3 border-b border-zinc-800/50 text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Steps
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {/* QA Report */}
                    {showQA && qaReport && (
                      <div className="mb-3 p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">QA Report</span>
                          <button onClick={() => setShowQA(false)}>
                            <X className="h-3 w-3 text-zinc-600" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <div className="bg-zinc-800/50 rounded p-1.5">
                            <span className="text-zinc-500">Score</span>
                            <p className="font-bold text-white">{qaReport.responseScore}/100</p>
                          </div>
                          <div className="bg-zinc-800/50 rounded p-1.5">
                            <span className="text-zinc-500">Quality</span>
                            <p className="font-bold text-white">{qaReport.responseQuality}</p>
                          </div>
                          <div className="bg-zinc-800/50 rounded p-1.5">
                            <span className="text-zinc-500">Empathy</span>
                            <p className="font-bold text-white">{qaReport.aiPerformance?.empathy}/10</p>
                          </div>
                          <div className="bg-zinc-800/50 rounded p-1.5">
                            <span className="text-zinc-500">Accuracy</span>
                            <p className="font-bold text-white">{qaReport.aiPerformance?.accuracy}/10</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-400">{qaReport.summary}</p>
                        {qaReport.recommendations?.length > 0 && (
                          <div className="text-[10px] text-zinc-500">
                            <span className="text-zinc-400 font-medium">Recommendations:</span>
                            <ul className="list-disc pl-3 mt-0.5 space-y-0.5">
                              {qaReport.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {selected.steps?.length > 0 ? (
                      selected.steps.map((step: any, i: number) => (
                        <div key={step.id} className={`p-2 rounded-lg text-xs ${step.completed ? 'bg-green-500/5 text-green-400/70 line-through' : 'bg-zinc-800/30 text-zinc-300'}`}>
                          <div className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] ${step.completed ? 'bg-green-500 text-white' : 'bg-zinc-700'}`}>
                              {step.completed ? '✓' : i + 1}
                            </div>
                            <span>{step.text}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-zinc-700 text-center py-8">No steps yet</p>
                    )}
                  </div>

                  {/* Camera Snapshot */}
                  {selected.imageSnapshot && (
                    <div className="p-3 border-t border-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 mb-1">Scene Snapshot</p>
                      <img src={selected.imageSnapshot} alt="Scene" className="w-full rounded-lg border border-zinc-800" />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Radio className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Select an emergency</p>
                <p className="text-xs text-zinc-700">Escalated calls appear on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DispatchPage() {
  return (
    <AuthGuard>
      <DispatchContent />
    </AuthGuard>
  )
}
