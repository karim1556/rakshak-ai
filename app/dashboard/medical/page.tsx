'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, AlertTriangle, Users, Phone, CheckCircle } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">Medical Dashboard</h1>
              <p className="text-sm text-gray-500">{filteredIncidents.length} active incidents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">Unit Online</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Incidents List */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="p-3 border-b border-gray-100 flex gap-2">
              {['all', 'active', 'assigned'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Incident List */}
            <div className="divide-y divide-gray-100 max-h-[calc(100vh-220px)] overflow-y-auto">
              {filteredIncidents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No incidents</p>
                </div>
              ) : (
                filteredIncidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                      selectedIncident?.id === incident.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getSeverityColor(incident.severity)}`} />
                        <span className="font-medium text-gray-900 text-sm">{incident.summary}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatTime(incident.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {incident.victims} victim{incident.victims !== 1 ? 's' : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        incident.status === 'active' ? 'bg-red-100 text-red-700' :
                        incident.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getSeverityColor(selectedIncident.severity)}`}>
                        {selectedIncident.severity}
                      </span>
                      <span className="text-sm text-gray-500">{selectedIncident.id}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedIncident.summary}</h2>
                  </div>
                  <div className="flex gap-2">
                    {selectedIncident.status === 'active' && (
                      <button
                        onClick={() => handleAssign(selectedIncident.id)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Accept
                      </button>
                    )}
                    {selectedIncident.status === 'assigned' && (
                      <button
                        onClick={() => handleResolve(selectedIncident.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                    <p className="text-gray-900">{selectedIncident.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Victims</h3>
                    <p className="text-2xl font-semibold text-gray-900">{selectedIncident.victims}</p>
                  </div>
                </div>

                {/* Risks */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Identified Risks</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.risks.map((risk, i) => (
                      <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm">
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tactical Advice */}
                <div className="p-4 bg-blue-50 rounded-xl mb-6">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Tactical Advice</h3>
                  <p className="text-blue-900">{selectedIncident.tacticalAdvice}</p>
                </div>

                {/* Steps */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Response Steps</h3>
                  <ol className="space-y-2">
                    {selectedIncident.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Select an incident to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
