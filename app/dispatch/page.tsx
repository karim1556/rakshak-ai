'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, AlertCircle, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const incidentData = [
  {
    id: '1',
    type: 'Medical Emergency',
    severity: 'CRITICAL',
    location: '1234 Main St, Downtown',
    time: '2 min ago',
    status: 'Assigned',
    responders: 2,
  },
  {
    id: '2',
    type: 'Violence Reported',
    severity: 'CRITICAL',
    location: '567 Oak Ave',
    time: 'Now',
    status: 'Assigned',
    responders: 3,
  },
  {
    id: '3',
    type: 'Traffic Accident',
    severity: 'HIGH',
    location: 'Intersection of 5th & Main',
    time: '3 min ago',
    status: 'Assigned',
    responders: 2,
  },
  {
    id: '4',
    type: 'Cardiac Emergency',
    severity: 'HIGH',
    location: '567 Oak Ave, Hospital District',
    time: '5 min ago',
    status: 'On Scene',
    responders: 2,
  },
  {
    id: '5',
    type: 'Robbery',
    severity: 'HIGH',
    location: 'Bank District',
    time: '8 min ago',
    status: 'Pending',
    responders: 1,
  },
]

const responseTimeData = [
  { name: 'Critical', count: 12, avgTime: 3.2 },
  { name: 'High', count: 28, avgTime: 5.1 },
  { name: 'Medium', count: 15, avgTime: 8.3 },
  { name: 'Low', count: 8, avgTime: 12.5 },
]

const incidentTypes = [
  { name: 'Medical', value: 35 },
  { name: 'Crime', value: 28 },
  { name: 'Traffic', value: 20 },
  { name: 'Fire', value: 12 },
  { name: 'Other', value: 5 },
]

const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

export default function DispatchPage() {
  const [filter, setFilter] = useState('all')

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

  const filteredIncidents = filter === 'all' ? incidentData : incidentData.filter(i => i.severity === filter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Dispatch Center</h1>
              <p className="text-slate-400 text-sm">Real-time Emergency Management</p>
            </div>
          </div>
          <Button className="bg-red-600 hover:bg-red-700">New Manual Dispatch</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Active Incidents</p>
                  <p className="text-3xl font-bold text-white">5</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Avg Response Time</p>
                  <p className="text-3xl font-bold text-white">4m 23s</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Units Deployed</p>
                  <p className="text-3xl font-bold text-white">10</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Today's Calls</p>
                  <p className="text-3xl font-bold text-white">47</p>
                </div>
                <MapPin className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Incident List */}
          <div className="lg:col-span-2">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Active Incidents</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={filter === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilter('all')}
                      className="text-xs"
                    >
                      All ({incidentData.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={filter === 'CRITICAL' ? 'default' : 'outline'}
                      onClick={() => setFilter('CRITICAL')}
                      className="text-xs"
                    >
                      Critical ({incidentData.filter(i => i.severity === 'CRITICAL').length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{incident.type}</h3>
                            <Badge className={getSeverityColor(incident.severity)}>
                              {incident.severity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-300 mb-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {incident.location}
                            </span>
                            <span>{incident.time}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>{incident.responders} responders assigned</span>
                        <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-600 text-xs bg-transparent">
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Incident Type Distribution */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Incident Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={incidentTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incidentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Response Time Analytics */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Response Time by Severity</CardTitle>
            <CardDescription className="text-slate-400">Average response times and incident counts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Incident Count" />
                <Bar dataKey="avgTime" fill="#10b981" name="Avg Time (min)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Responder Status */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Medical Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Available</span>
                  <span className="text-white font-semibold">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">En Route</span>
                  <span className="text-white font-semibold">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">On Scene</span>
                  <span className="text-white font-semibold">2</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Police Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Available</span>
                  <span className="text-white font-semibold">4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">En Route</span>
                  <span className="text-white font-semibold">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">On Scene</span>
                  <span className="text-white font-semibold">3</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
