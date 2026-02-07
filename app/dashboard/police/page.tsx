'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, AlertTriangle, Users, Shield, CheckCircle } from 'lucide-react'
import { useIncidentStore, Incident } from '@/lib/store'

export default function PoliceDashboard() {
  const { incidents, assignResponder, resolveIncident } = useIncidentStore()
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'assigned'>('all')

  // Filter incidents for police relevance
  const policeIncidents = incidents.filter(inc => 
    inc.type === 'safety' || inc.type === 'accident' || inc.type === 'fire' || inc.type === 'other'
  )

  const filteredIncidents = filter === 'all' 
    ? policeIncidents 
    : policeIncidents.filter(inc => inc.status === filter)

  useEffect(() => {
    if (filteredIncidents.length > 0 && !selectedIncident) {
      setSelectedIncident(filteredIncidents[0])
    }
  }, [filteredIncidents, selectedIncident])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safety': return '🚨'
      case 'fire': return '🔥'
      case 'accident': return '🚗'
      default: return '⚠️'
    }
  }

  const handleAssign = (incidentId: string) => {
    assignResponder(incidentId, 'POLICE-UNIT-7')
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
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="font-semibold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                Police Dashboard
              </h1>
              <p className="text-sm text-slate-400">{filteredIncidents.length} active incidents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400">Unit 7 Online</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Incidents List */}
          <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {/* Filters */}
            <div className="p-3 border-b border-slate-700 flex gap-2">
              {['all', 'active', 'assigned'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Incident List */}
            <div className="divide-y divide-slate-700 max-h-[calc(100vh-220px)] overflow-y-auto">
              {filteredIncidents.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No incidents</p>
                </div>
              ) : (
                filteredIncidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`w-full p-4 text-left transition-colors hover:bg-slate-700/50 ${
                      selectedIncident?.id === incident.id ? 'bg-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(incident.type)}</span>
                        <span className="font-medium text-white text-sm">{incident.summary}</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatTime(incident.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className={`px-2 py-0.5 rounded-full text-white ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        incident.status === 'active' ? 'bg-red-500/20 text-red-400' :
                        incident.status === 'assigned' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {incident.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Incident Details */}
          <div className="lg:col-span-2">
            {selectedIncident ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getSeverityColor(selectedIncident.severity)}`}>
                        {selectedIncident.severity}
                      </span>
                      <span className="text-sm text-slate-500">{selectedIncident.id}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <span>{getTypeIcon(selectedIncident.type)}</span>
                      {selectedIncident.summary}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    {selectedIncident.status === 'active' && (
                      <button
                        onClick={() => handleAssign(selectedIncident.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Respond
                      </button>
                    )}
                    {selectedIncident.status === 'assigned' && (
                      <button
                        onClick={() => handleResolve(selectedIncident.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Clear Scene
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Situation Report</h3>
                    <p className="text-slate-200">{selectedIncident.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Persons Involved</h3>
                    <p className="text-2xl font-semibold text-white">{selectedIncident.victims}</p>
                  </div>
                </div>

                {/* Hazards */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Hazards & Risks</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.risks.map((risk, i) => (
                      <span key={i} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tactical Advice */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                  <h3 className="text-sm font-medium text-amber-400 mb-1">Tactical Advice</h3>
                  <p className="text-amber-200">{selectedIncident.tacticalAdvice}</p>
                </div>

                {/* Action Steps */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Recommended Actions</h3>
                  <ol className="space-y-2">
                    {selectedIncident.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-sm flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-slate-300 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-500">Select an incident to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
