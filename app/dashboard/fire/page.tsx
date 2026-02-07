'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Flame, AlertTriangle, MapPin, Loader2, UserCheck, Clock } from 'lucide-react'
import { AuthGuard } from '@/components/auth-guard'
import { supabase } from '@/lib/supabase'

const MapComponent = dynamic(() => import('@/components/map').then(m => ({ default: m.Map })), { ssr: false })

function FireContent() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [responders, setResponders] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [{ data: inc }, { data: resp }] = await Promise.all([
      supabase.from('incidents').select('*').in('type', ['fire', 'accident']).neq('status', 'resolved').order('created_at', { ascending: false }),
      supabase.from('responders').select('*').in('role', ['fire', 'rescue']),
    ])
    setIncidents(inc || [])
    setResponders(resp || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('fire-dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const available = responders.filter(r => r.status === 'available').length
  const active = incidents.filter(i => i.status === 'active').length

  const sevClass = (s: string) =>
    s === 'CRITICAL' ? 'text-red-400 bg-red-500/10' :
    s === 'HIGH' ? 'text-orange-400 bg-orange-500/10' :
    'text-yellow-400 bg-yellow-500/10'

  const markers = [
    ...incidents.filter(i => i.location_lat && i.location_lng).map(i => ({
      position: [Number(i.location_lat), Number(i.location_lng)] as [number, number],
      popup: `<b>${i.summary || 'Fire Incident'}</b>`,
      type: 'incident' as const
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
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      <header className="h-12 border-b border-zinc-800/50 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 hover:bg-zinc-800 rounded"><ArrowLeft className="h-4 w-4 text-zinc-500" /></Link>
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium">Fire Command</span>
        </div>
        <div className="flex gap-4 text-[11px] text-zinc-500">
          <span>{active} active</span>
          <span className="text-green-400">{available}/{responders.length} units ready</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-zinc-800/50 flex flex-col flex-shrink-0">
          <div className="grid grid-cols-2 gap-2 p-3 border-b border-zinc-800/30">
            <div className="bg-zinc-900 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-orange-400">{active}</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Active</p>
            </div>
            <div className="bg-zinc-900 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-green-400">{available}</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider">Ready</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-zinc-600 animate-spin" /></div>
            ) : incidents.length === 0 ? (
              <p className="text-[11px] text-zinc-600 text-center py-12">No active incidents</p>
            ) : incidents.map(inc => (
              <button
                key={inc.id}
                onClick={() => setSelected(inc)}
                className={`w-full p-3 text-left border-b border-zinc-800/20 transition-colors ${selected?.id === inc.id ? 'bg-zinc-800/50' : 'hover:bg-zinc-900/50'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`h-3 w-3 ${inc.severity === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'}`} />
                  <span className="text-xs font-medium truncate flex-1">{inc.summary || 'Fire Incident'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1 py-0.5 rounded ${sevClass(inc.severity)}`}>{inc.severity}</span>
                  <span className="text-[9px] text-zinc-600">{inc.type}</span>
                </div>
                {inc.location_address && (
                  <p className="text-[9px] text-zinc-600 mt-1 flex items-center gap-1 truncate"><MapPin className="h-2.5 w-2.5 flex-shrink-0" />{inc.location_address.split(',')[0]}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-52 border-b border-zinc-800/50">
            <MapComponent markers={markers} zoom={12} />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <div className="space-y-3 max-w-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">{selected.summary || 'Fire Incident'}</h2>
                    <div className="flex gap-1 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${sevClass(selected.severity)}`}>{selected.severity}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{selected.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {selected.status === 'active' && (
                      <button onClick={() => handleAssign(selected.id)} className="text-[10px] px-2 py-1 bg-orange-500/10 text-orange-400 rounded hover:bg-orange-500/20 transition-colors">
                        <UserCheck className="h-3 w-3 inline mr-1" />Assign
                      </button>
                    )}
                    <button onClick={() => handleResolve(selected.id)} className="text-[10px] px-2 py-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors">
                      Resolve
                    </button>
                  </div>
                </div>

                {selected.description && <p className="text-xs text-zinc-400">{selected.description}</p>}

                {/* Dispatch Notes */}
                {selected.tactical_advice && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-amber-400 font-medium mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertTriangle className="h-3 w-3" /> Dispatch Notes
                    </p>
                    <p className="text-xs text-amber-200/80 leading-relaxed whitespace-pre-line">{selected.tactical_advice}</p>
                  </div>
                )}

                {selected.location_address && (
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" />{selected.location_address}</p>
                )}

                {selected.risks?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Hazards</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.risks.map((r: string, i: number) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.steps?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Response Protocol</p>
                    <ol className="space-y-1">
                      {selected.steps.map((s: string, i: number) => (
                        <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {selected.created_at && (
                  <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(selected.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[11px] text-zinc-600">Select an incident</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FireDashboard() {
  return <AuthGuard><FireContent /></AuthGuard>
}
