'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, AlertTriangle, Users, CheckCircle, Activity,
  Phone, Navigation, Heart, Stethoscope, Ambulance, TrendingUp,
  Bell, MoreVertical, MapPin, Timer
} from 'lucide-react'
import { useIncidentStore, Incident } from '@/lib/store'

export default function MedicalDashboard() {
  const { incidents, assignResponder, resolveIncident } = useIncidentStore()
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'assigned'>('all')

  // Filter incidents for medical relevance
  const medicalIncidents = incidents.filter(inc => 
    inc.type === 'medical' || inc.type === 'accident' || inc.type === 'other'
  )

  const filteredIncidents = filter === 'all' 
    ? medicalIncidents 
    : medicalIncidents.filter(inc => inc.status === filter)

  const activeCount = medicalIncidents.filter(i => i.status === 'active').length
  const assignedCount = medicalIncidents.filter(i => i.status === 'assigned').length
  const resolvedCount = medicalIncidents.filter(i => i.status === 'resolved').length
  const criticalCount = medicalIncidents.filter(i => i.severity === 'CRITICAL').length

  useEffect(() => {
    if (filteredIncidents.length > 0 && !selectedIncident) {
      setSelectedIncident(filteredIncidents[0])
    }
  }, [filteredIncidents, selectedIncident])

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return { bg: 'bg-red-500', bgLight: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
      case 'HIGH': return { bg: 'bg-orange-500', bgLight: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
      case 'MEDIUM': return { bg: 'bg-yellow-500', bgLight: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
      default: return { bg: 'bg-green-500', bgLight: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
    }
  }

  const handleAssign = (incidentId: string) => {
    assignResponder(incidentId, 'MEDICAL-UNIT-1')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900">Medical Command</h1>
                  <p className="text-xs text-slate-500">Emergency Medical Services</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="h-5 w-5 text-slate-600" />
                {criticalCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-200">
                <Ambulance className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Unit 1 Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Live</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{activeCount}</p>
            <p className="text-sm text-slate-500">Active Emergencies</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{assignedCount}</p>
            <p className="text-sm text-slate-500">In Progress</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{resolvedCount}</p>
            <p className="text-sm text-slate-500">Resolved Today</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Timer className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">4.2<span className="text-lg text-slate-400">min</span></p>
            <p className="text-sm text-slate-500">Avg Response Time</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Incidents List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Section Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-900">Incoming Calls</h2>
                  <span className="text-xs text-slate-500">{filteredIncidents.length} total</span>
                </div>
                {/* Filters */}
                <div className="flex gap-2">
                  {['all', 'active', 'assigned'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filter === f 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Incident List */}
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredIncidents.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Stethoscope className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No incidents found</p>
                    <p className="text-sm text-slate-400 mt-1">You&apos;re all caught up!</p>
                  </div>
                ) : (
                  filteredIncidents.map((incident) => {
                    const severity = getSeverityConfig(incident.severity)
                    return (
                      <button
                        key={incident.id}
                        onClick={() => setSelectedIncident(incident)}
                        className={`w-full p-4 text-left transition-all hover:bg-slate-50 ${
                          selectedIncident?.id === incident.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full ${severity.bg} mt-1.5 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-900 text-sm truncate">{incident.summary}</span>
                              <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{formatTime(incident.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Users className="h-3 w-3" />
                                {incident.victims}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                incident.status === 'active' ? 'bg-red-100 text-red-700' :
                                incident.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {incident.status}
                              </span>
                            </div>
                          </div>
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
                <div className={`rounded-2xl border overflow-hidden ${getSeverityConfig(selectedIncident.severity).bgLight} ${getSeverityConfig(selectedIncident.severity).border}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${getSeverityConfig(selectedIncident.severity).bg}`}>
                            {selectedIncident.severity}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{selectedIncident.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedIncident.summary}</h2>
                      </div>
                      <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                        <MoreVertical className="h-5 w-5 text-slate-400" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4" />
                        {formatTime(selectedIncident.timestamp)}
                      </span>
                      <span className="flex items-center gap-2 text-slate-600">
                        <Users className="h-4 w-4" />
                        {selectedIncident.victims} victim{selectedIncident.victims !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4" />
                        Location accessed
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 py-4 bg-white/50 flex gap-3">
                    {selectedIncident.status === 'active' && (
                      <button
                        onClick={() => handleAssign(selectedIncident.id)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                      >
                        <Ambulance className="h-5 w-5" />
                        Dispatch Unit
                      </button>
                    )}
                    {selectedIncident.status === 'assigned' && (
                      <button
                        onClick={() => handleResolve(selectedIncident.id)}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Mark Resolved
                      </button>
                    )}
                    <button className="py-3 px-6 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200 flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Navigate
                    </button>
                    <a href="tel:112" className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Situation Report</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedIncident.description}</p>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Identified Hazards</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.risks.length > 0 ? selectedIncident.risks.map((risk, i) => (
                        <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium">
                          {risk}
                        </span>
                      )) : (
                        <span className="text-slate-400 text-sm">No specific hazards identified</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tactical Advice */}
                {selectedIncident.tacticalAdvice && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Medical Protocol</h3>
                        <p className="text-blue-800 leading-relaxed">{selectedIncident.tacticalAdvice}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps */}
                {selectedIncident.steps.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Guided Response Steps</h3>
                    <div className="space-y-3">
                      {selectedIncident.steps.slice(0, 5).map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-white font-semibold">{i + 1}</span>
                          </div>
                          <p className="text-sm text-slate-700">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Heart className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Incident Selected</h3>
                <p className="text-slate-500">Select an incident from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
