'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Shield, AlertTriangle, MapPin, Loader2, UserCheck, Clock } from 'lucide-react'
import { AuthGuard } from '@/components/auth-guard'
import { supabase } from '@/lib/supabase'

const MapComponent = dynamic(() => import('@/components/map').then(m => ({ default: m.Map })), { ssr: false })

function PoliceContent() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [responders, setResponders] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [{ data: inc }, { data: resp }] = await Promise.all([
      supabase.from('incidents').select('*').in('type', ['safety', 'accident', 'other']).neq('status', 'resolved').order('created_at', { ascending: false }),
      supabase.from('responders').select('*').eq('role', 'police'),
    ])
    setIncidents(inc || [])
    setResponders(resp || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('police-dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const available = responders.filter(r => r.status === 'available').length
  const active = incidents.filter(i => i.status === 'active').length

  const sevClass = (s: string) =>
    s === 'CRITICAL' ? 'text-red-600 bg-red-50 border border-red-200' :
    s === 'HIGH' ? 'text-orange-600 bg-orange-50 border border-orange-200' :
    'text-amber-600 bg-amber-50 border border-amber-200'

  const markers = [
    ...incidents.filter(i => i.location_lat && i.location_lng).map(i => ({
      position: [Number(i.location_lat), Number(i.location_lng)] as [number, number],
      popup: `<b>📍 ${i.summary || 'Incident'}</b><br/><em style="color:#6366f1">Live Location</em>`,
      type: 'user-live' as const
    })),
    ...responders.filter(r => r.location_lat && r.location_lng).map(r => ({
      position: [Number(r.location_lat), Number(r.location_lng)] as [number, number],
      popup: `<b>${r.name}</b>`,
      type: 'responder' as const
    }))
  ]

  const handleAssign = async (id: string) => {
    const freeUnit = responders.find(r => r.status === 'available')
    if (!freeUnit) return
    await Promise.all([
      supabase.from('incidents').update({ status: 'assigned' }).eq('id', id),
      supabase.from('responders').update({ status: 'busy' }).eq('id', freeUnit.id),
    ])
    load()
  }

  const handleResolve = async (id: string) => {
    await supabase.from('incidents').update({ status: 'resolved' }).eq('id', id)
    setSelected(null)
    load()
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-slate-200/60 flex items-center justify-between px-5 flex-shrink-0 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-4 w-4 text-slate-500" /></Link>
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <span className="text-sm font-bold">Police Command</span>
        </div>
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="font-medium">{active} active</span>
          <span className="text-emerald-600 font-medium">{available}/{responders.length} units ready</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-slate-200/60 flex flex-col flex-shrink-0 bg-white/50">
          <div className="grid grid-cols-2 gap-2 p-3 border-b border-slate-100">
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <p className="text-xl font-bold text-blue-600">{active}</p>
              <p className="text-[9px] text-blue-400 uppercase tracking-wider font-semibold">Active</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
              <p className="text-xl font-bold text-emerald-600">{available}</p>
              <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold">Ready</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-slate-400 animate-spin" /></div>
            ) : incidents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">No active incidents</p>
            ) : incidents.map(inc => (
              <button
                key={inc.id}
                onClick={() => setSelected(inc)}
                className={`w-full p-3 text-left border-b border-slate-100 transition-colors ${selected?.id === inc.id ? 'bg-blue-50/70 border-l-2 border-l-blue-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-3 w-3 ${inc.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'}`} />
                  <span className="text-xs font-semibold truncate flex-1 text-slate-800">{inc.summary || 'Incident'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${sevClass(inc.severity)}`}>{inc.severity}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{inc.type}</span>
                </div>
                {inc.location_address && (
                  <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 truncate"><MapPin className="h-2.5 w-2.5 flex-shrink-0 text-indigo-400" />{inc.location_address.split(',')[0]}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          <div className="h-56 border-b border-slate-200/60">
            <MapComponent markers={markers} zoom={12} light={true} />
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
            {selected ? (
              <div className="space-y-4 max-w-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{selected.summary || 'Incident'}</h2>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${sevClass(selected.severity)}`}>{selected.severity}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">{selected.status}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium border border-slate-200">{selected.type}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {selected.status === 'active' && (
                      <button onClick={() => handleAssign(selected.id)} className="text-[10px] px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold border border-blue-200 shadow-sm">
                        <UserCheck className="h-3 w-3 inline mr-1" />Assign
                      </button>
                    )}
                    <button onClick={() => handleResolve(selected.id)} className="text-[10px] px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-semibold border border-emerald-200 shadow-sm">
                      Resolve
                    </button>
                  </div>
                </div>

                {selected.description && <p className="text-xs text-slate-500 leading-relaxed">{selected.description}</p>}

                {selected.tactical_advice && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm">
                    <p className="text-[10px] text-amber-700 font-semibold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertTriangle className="h-3 w-3" /> Dispatch Notes
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-line">{selected.tactical_advice}</p>
                  </div>
                )}

                {selected.location_address && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-medium">{selected.location_address}</span>
                    <span className="ml-auto text-[9px] text-indigo-400 font-semibold">LIVE</span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                  </div>
                )}

                {selected.risks?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Risks</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.risks.map((r: string, i: number) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-200 font-medium">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.steps?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Response Protocol</p>
                    <ol className="space-y-1.5">
                      {selected.steps.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {selected.created_at && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-blue-100">
                    <Shield className="h-6 w-6 text-blue-300" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Select an incident</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PoliceDashboard() {
  return <AuthGuard><PoliceContent /></AuthGuard>
}
