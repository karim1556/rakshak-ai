// Mock database - in production, use a real database
const incidents: any[] = [
  {
    id: '1',
    type: 'Medical Emergency',
    severity: 'CRITICAL',
    status: 'Active',
    location: '1234 Main St, Downtown',
    description: 'Person collapsed, unconscious, not breathing',
    reportedAt: new Date(),
    respondersAssigned: ['Unit12', 'Unit7'],
    notes: [],
  },
  {
    id: '2',
    type: 'Violence Reported',
    severity: 'CRITICAL',
    status: 'Active',
    location: '567 Oak Ave',
    description: 'Assault in progress',
    reportedAt: new Date(),
    respondersAssigned: ['Unit8', 'Unit15'],
    notes: [],
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter')

    let filteredIncidents = incidents

    if (filter && filter !== 'all') {
      filteredIncidents = incidents.filter((inc) => inc.status === filter || inc.severity === filter)
    }

    return Response.json({
      incidents: filteredIncidents,
      total: filteredIncidents.length,
    })
  } catch (error) {
    console.error('Fetch incidents error:', error)
    return Response.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, severity, location, description, reportedBy, coordinates } = body

    const newIncident = {
      id: String(incidents.length + 1),
      type,
      severity,
      status: 'Active',
      location,
      description,
      reportedAt: new Date(),
      reportedBy,
      coordinates,
      respondersAssigned: [],
      notes: [],
      timeline: [
        {
          time: new Date().toISOString(),
          event: 'Incident reported',
          type: 'report',
        },
      ],
    }

    incidents.push(newIncident)

    return Response.json(
      {
        success: true,
        incident: newIncident,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create incident error:', error)
    return Response.json({ error: 'Failed to create incident' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    const incident = incidents.find((inc) => inc.id === id)
    if (!incident) {
      return Response.json({ error: 'Incident not found' }, { status: 404 })
    }

    // Update incident
    Object.assign(incident, body)

    // Add timeline entry
    if (body.status && incident.timeline) {
      incident.timeline.push({
        time: new Date().toISOString(),
        event: `Status updated to ${body.status}`,
        type: 'update',
      })
    }

    return Response.json({
      success: true,
      incident,
    })
  } catch (error) {
    console.error('Update incident error:', error)
    return Response.json({ error: 'Failed to update incident' }, { status: 500 })
  }
}
