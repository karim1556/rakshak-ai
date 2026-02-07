'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, AlertTriangle, Users, CheckCircle, Radio,
  Phone, Navigation, Flame, TrendingUp, Bell, MoreVertical,
  MapPin, Timer, Droplets, Wind, ChevronRight, Zap
} from 'lucide-react'
import { useIncidentStore, Incident } from '@/lib/store'

export default function FireDashboard() {
  const { incidents, assignResponder, resolveIncident } = useIncidentStore()
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'assigned'>('all')

  // Filter incidents for fire relevance
  const fireIncidents = incidents.filter(inc => 
    inc.type === 'fire' || inc.type === 'accident' || inc.type === 'other'
  )

  const filteredIncidents = filter === 'all' 
    ? fireIncidents 
    : fireIncidents.filter(inc => inc.status === filter)

  const activeCount = fireIncidents.filter(i => i.status === 'active').length
  const assignedCount = fireIncidents.filter(i => i.status === 'assigned').length
  const resolvedCount = fireIncidents.filter(i => i.status === 'resolved').length
  const criticalCount = fireIncidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length

  useEffect(() => {
    if (filteredIncidents.length > 0 && !selectedIncident) {
      setSelectedIncident(filteredIncidents[0])
    }
  }, [filteredIncidents, selectedIncident])

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return { bg: 'bg-red-500', bgGlow: 'shadow-red-500/30', bgLight: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/40' }
      case 'HIGH': return { bg: 'bg-orange-500', bgGlow: 'shadow-orange-500/30', bgLight: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/40' }
      case 'MEDIUM': return { bg: 'bg-yellow-500', bgGlow: 'shadow-yellow-500/30', bgLight: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/40' }
      default: return { bg: 'bg-green-500', bgGlow: 'shadow-green-500/30', bgLight: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/40' }
    }
  }

  const handleAssign = (incidentId: string) => {
    assignResponder(incidentId, 'FIRE-UNIT-3')
  }

  const handleResolve = (incidentId: string) => {
    resolveIncident(incidentId)
    setSelectedIncident(null)
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-slate-950">
      {/* Background Effect */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-orange-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Link href="/" className="p-2 -ml-2 hover:bg-orange-950 rounded-xl transition-colors">
                  <ArrowLeft className="h-5 w-5 text-orange-400" />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-white">Fire Command Center</h1>
                    <p className="text-xs text-orange-400/60">Delhi Fire Service</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="relative p-2 hover:bg-orange-950 rounded-xl transition-colors">
                  <Bell className="h-5 w-5 text-orange-400" />
                  {criticalCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <Radio className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Engine 3 Ready</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Flame className="h-5 w-5 text-red-400" />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-red-400 animate-pulse">
                  <Zap className="h-3 w-3" /> ACTIVE
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{activeCount}</p>
              <p className="text-sm text-orange-300/50">Active Fires</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-orange-400" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-white">{assignedCount}</p>
              <p className="text-sm text-orange-300/50">Units Deployed</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{resolvedCount}</p>
              <p className="text-sm text-orange-300/50">Contained Today</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Timer className="h-5 w-5 text-amber-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">5.1<span className="text-lg text-orange-300/40">min</span></p>
              <p className="text-sm text-orange-300/50">Avg Response</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Incidents List */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 overflow-hidden">
                {/* Section Header */}
                <div className="p-4 border-b border-orange-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-400" />
                      Emergency Queue
                    </h2>
                    <span className="text-xs text-orange-300/50">{filteredIncidents.length} calls</span>
                  </div>
                  {/* Filters */}
                  <div className="flex gap-2">
                    {['all', 'active', 'assigned'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filter === f 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' 
                            : 'text-orange-300/60 hover:bg-orange-950/50'
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Incident List */}
                <div className="divide-y divide-orange-900/20 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {filteredIncidents.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-orange-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Flame className="h-8 w-8 text-orange-900" />
                      </div>
                      <p className="text-orange-300/60 font-medium">No active fires</p>
                      <p className="text-sm text-orange-300/40 mt-1">All clear</p>
                    </div>
                  ) : (
                    filteredIncidents.map((incident) => {
                      const severity = getSeverityConfig(incident.severity)
                      return (
                        <button
                          key={incident.id}
                          onClick={() => setSelectedIncident(incident)}
                          className={`w-full p-4 text-left transition-all hover:bg-orange-950/30 ${
                            selectedIncident?.id === incident.id ? 'bg-orange-500/10 border-l-2 border-orange-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Flame className={`h-5 w-5 ${severity.text} mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-white text-sm truncate">{incident.summary}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded ${severity.bgLight} ${severity.text}`}>
                                  {incident.severity}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  incident.status === 'active' ? 'bg-red-500/10 text-red-400' :
                                  incident.status === 'assigned' ? 'bg-orange-500/10 text-orange-400' :
                                  'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  {incident.status}
                                </span>
                                <span className="text-xs text-orange-300/40">{formatTime(incident.timestamp)}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-orange-900" />
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Incident Details */}
            <div className="lg:col-span-2">
              {selectedIncident ? (
                <div className="space-y-6">
                  {/* Incident Header Card */}
                  <div className={`rounded-2xl border overflow-hidden bg-slate-900/60 backdrop-blur ${getSeverityConfig(selectedIncident.severity).border}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Flame className={`h-6 w-6 ${getSeverityConfig(selectedIncident.severity).text}`} />
                            <span className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${getSeverityConfig(selectedIncident.severity).bg} shadow-lg ${getSeverityConfig(selectedIncident.severity).bgGlow}`}>
                              {selectedIncident.severity}
                            </span>
                            <span className="text-xs text-orange-300/40 font-mono bg-orange-950/50 px-2 py-1 rounded">{selectedIncident.id}</span>
                          </div>
                          <h2 className="text-2xl font-bold text-white">{selectedIncident.summary}</h2>
                        </div>
                        <button className="p-2 hover:bg-orange-950 rounded-lg transition-colors">
                          <MoreVertical className="h-5 w-5 text-orange-300/40" />
                        </button>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-2 text-orange-300/60">
                          <Clock className="h-4 w-4" />
                          {formatTime(selectedIncident.timestamp)}
                        </span>
                        <span className="flex items-center gap-2 text-orange-300/60">
                          <Users className="h-4 w-4" />
                          {selectedIncident.victims} at risk
                        </span>
                        <span className="flex items-center gap-2 text-orange-300/60">
                          <MapPin className="h-4 w-4" />
                          Location tracked
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 py-4 bg-orange-950/30 flex gap-3 border-t border-orange-900/20">
                      {selectedIncident.status === 'active' && (
                        <button
                          onClick={() => handleAssign(selectedIncident.id)}
                          className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                        >
                          <Flame className="h-5 w-5" />
                          Deploy Engine
                        </button>
                      )}
                      {selectedIncident.status === 'assigned' && (
                        <button
                          onClick={() => handleResolve(selectedIncident.id)}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-5 w-5" />
                          Fire Contained
                        </button>
                      )}
                      <button className="py-3 px-6 bg-orange-900/50 hover:bg-orange-900 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                        <Navigation className="h-4 w-4" />
                        Navigate
                      </button>
                      <a href="tel:101" className="py-3 px-6 bg-red-950 hover:bg-red-900 text-white rounded-xl font-medium transition-colors flex items-center gap-2 border border-red-900/50">
                        <Phone className="h-4 w-4" />
                        Call 101
                      </a>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 p-6">
                      <h3 className="text-xs font-semibold text-orange-300/40 uppercase tracking-wide mb-3">Situation Report</h3>
                      <p className="text-orange-100/80 leading-relaxed">{selectedIncident.description}</p>
                    </div>
                    
                    <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 p-6">
                      <h3 className="text-xs font-semibold text-orange-300/40 uppercase tracking-wide mb-3">Fire Hazards</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedIncident.risks.length > 0 ? selectedIncident.risks.map((risk, i) => (
                          <span key={i} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            {risk}
                          </span>
                        )) : (
                          <span className="text-orange-300/40 text-sm">No specific hazards flagged</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fire Safety Info */}
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/25">
                        <Wind className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-300 mb-2">Fire Suppression Protocol</h3>
                        <p className="text-orange-200/70 leading-relaxed">
                          {selectedIncident.tacticalAdvice || 
                            "Establish water supply from nearest hydrant. Ensure personnel use full PPE. Evacuate visible occupants first. Check for fire spread to adjacent structures."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Steps */}
                  {selectedIncident.steps.length > 0 && (
                    <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 p-6">
                      <h3 className="text-xs font-semibold text-orange-300/40 uppercase tracking-wide mb-4">Response Checklist</h3>
                      <div className="space-y-3">
                        {selectedIncident.steps.slice(0, 5).map((step, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-orange-950/30 rounded-xl border border-orange-900/20">
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-white font-semibold">{i + 1}</span>
                            </div>
                            <p className="text-sm text-orange-100/80">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/60 backdrop-blur rounded-2xl border border-orange-900/30 p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-orange-950/50 rounded-2xl flex items-center justify-center mb-4">
                    <Flame className="h-10 w-10 text-orange-900" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Incident Selected</h3>
                  <p className="text-orange-300/50">Select an incident from the queue</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
