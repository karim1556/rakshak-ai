'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Clock, AlertTriangle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const mockIncidents = [
  {
    id: '1',
    type: 'Violence Reported',
    severity: 'CRITICAL',
    location: '1234 Main St, Downtown',
    description: 'Assault in progress at convenience store',
    distance: '0.5 km',
    eta: '3 min',
    status: 'Assigned',
    time: 'Now',
    suspect: 'Male, approx 6ft, dark hoodie',
    witnesses: '2',
    notes: 'Armed with knife, still on premises',
  },
  {
    id: '2',
    type: 'Traffic Accident',
    severity: 'HIGH',
    location: 'Intersection of 5th & Main',
    description: 'Multi-vehicle collision',
    distance: '1.8 km',
    eta: '5 min',
    status: 'Assigned',
    time: '2 min ago',
    suspect: 'Hit and run suspected',
    witnesses: '5',
    notes: 'Traffic backed up, hazmat not needed',
  },
  {
    id: '3',
    type: 'Robbery',
    severity: 'HIGH',
    location: '567 Oak Ave, Bank District',
    description: 'Bank robbery in progress',
    distance: '2.3 km',
    eta: '6 min',
    status: 'Pending',
    time: '5 min ago',
    suspect: 'Unknown, possibly 2 individuals',
    witnesses: '20+',
    notes: 'Suspects may be armed',
  },
]

export default function PoliceResponderPage() {
  const [activeIncident, setActiveIncident] = useState(mockIncidents[0])
  const [status, setStatus] = useState('en-route')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-600 text-white'
      case 'HIGH':
        return 'bg-orange-600 text-white'
      case 'MEDIUM':
        return 'bg-yellow-600 text-white'
      default:
        return 'bg-green-600 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned':
        return 'bg-blue-600/20 text-blue-400'
      case 'Pending':
        return 'bg-yellow-600/20 text-yellow-400'
      case 'On Scene':
        return 'bg-green-600/20 text-green-400'
      default:
        return 'bg-slate-600/20 text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-purple-900 bg-purple-950/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-purple-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Police Responder Dashboard</h1>
              <p className="text-purple-400 text-sm">Unit 7 - Active Dispatch</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className={`${getSeverityColor(activeIncident.severity)} text-lg px-4 py-2`}>
              {activeIncident.severity}
            </Badge>
            <Button className="bg-red-600 hover:bg-red-700">End Shift</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Incident Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Incident Card */}
            <Card className="border-purple-900 bg-purple-900/30 backdrop-blur">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-orange-500" />
                      {activeIncident.type}
                    </CardTitle>
                    <CardDescription className="text-purple-300">{activeIncident.description}</CardDescription>
                  </div>
                  <Badge className={getSeverityColor(activeIncident.severity)}>
                    {activeIncident.severity}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Location & Suspect Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex gap-3 items-start">
                    <MapPin className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-purple-300">Location</p>
                      <p className="text-white font-semibold">{activeIncident.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Shield className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-purple-300">Suspect Description</p>
                      <p className="text-white font-semibold text-sm">{activeIncident.suspect}</p>
                    </div>
                  </div>
                </div>

                {/* Distance & ETA */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-1">Distance</p>
                    <p className="text-2xl font-bold text-purple-400">{activeIncident.distance}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-1">ETA</p>
                    <p className="text-2xl font-bold text-green-400">{activeIncident.eta}</p>
                  </div>
                </div>

                {/* Witnesses & Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-1">Witnesses</p>
                    <p className="text-2xl font-bold text-white">{activeIncident.witnesses}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-1">Time of Report</p>
                    <p className="text-xl font-bold text-white">{activeIncident.time}</p>
                  </div>
                </div>

                {/* Critical Notes */}
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-400 mb-2">⚠️ Critical Safety Notes</p>
                  <p className="text-white">{activeIncident.notes}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base">
                    <Phone className="mr-2 h-5 w-5" />
                    Call Dispatch
                  </Button>
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 text-base">
                    <MapPin className="mr-2 h-5 w-5" />
                    Navigate
                  </Button>
                  <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800 bg-transparent">
                    Report Arrived
                  </Button>
                </div>

                {/* Status Selector */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-300">Current Status</p>
                  <div className="flex gap-2">
                    {['en-route', 'on-scene', 'securing-scene'].map((s) => (
                      <Button
                        key={s}
                        onClick={() => setStatus(s)}
                        variant={status === s ? 'default' : 'outline'}
                        className={status === s ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-600 text-white hover:bg-slate-800'}
                      >
                        {s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incident List */}
            <Card className="border-purple-900 bg-purple-900/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">All Active Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      onClick={() => setActiveIncident(incident)}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        activeIncident.id === incident.id
                          ? 'bg-purple-700 border-2 border-purple-500'
                          : 'bg-slate-800 border-2 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white">{incident.type}</h3>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{incident.location}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>{incident.distance} away</span>
                        <span>{incident.eta} ETA</span>
                        <span>{incident.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-purple-900 bg-purple-900/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Shift Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-purple-800">
                  <span className="text-slate-400">Active Incidents</span>
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-800">
                  <span className="text-slate-400">Calls Today</span>
                  <span className="text-2xl font-bold text-white">18</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Avg Response</span>
                  <span className="text-2xl font-bold text-white">5m 15s</span>
                </div>
              </CardContent>
            </Card>

            {/* Team Communication */}
            <Card className="border-purple-900 bg-purple-900/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Team Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Phone className="mr-2 h-4 w-4" />
                  Open Voice Channel
                </Button>
                <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-800 bg-transparent">
                  View Team Status
                </Button>
                <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-800 bg-transparent">
                  Message Dispatch
                </Button>
              </CardContent>
            </Card>

            {/* Resource Management */}
            <Card className="border-purple-900 bg-purple-900/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Resources Nearby</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-purple-800">
                  <span className="text-slate-400">Units Available</span>
                  <span className="text-white font-semibold">2</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-800">
                  <span className="text-slate-400">Medical Units</span>
                  <span className="text-white font-semibold">1</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Fire Department</span>
                  <span className="text-white font-semibold">1</span>
                </div>
              </CardContent>
            </Card>

            {/* Safety Protocols */}
            <Card className="border-purple-900 bg-purple-900/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Protocols</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-purple-400 hover:text-purple-300 text-sm">
                  Arrest & Custody
                </Button>
                <Button variant="ghost" className="w-full justify-start text-purple-400 hover:text-purple-300 text-sm">
                  Traffic Stop
                </Button>
                <Button variant="ghost" className="w-full justify-start text-purple-400 hover:text-purple-300 text-sm">
                  De-escalation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
