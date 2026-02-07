import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Calculate distance between two coordinates (Haversine formula) in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Map emergency type to responder role
function getRequiredRoles(type: string): string[] {
  switch (type) {
    case 'medical': return ['medical', 'rescue']
    case 'fire': return ['fire', 'rescue']
    case 'safety': return ['police']
    case 'accident': return ['medical', 'police']
    default: return ['medical', 'police']
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  try {
    const { sessionId, type, severity, lat, lng } = await req.json()

    if (!sessionId || !lat || !lng) {
      return NextResponse.json({ error: 'sessionId, lat, lng required' }, { status: 400 })
    }

    const roles = getRequiredRoles(type || 'other')

    // Get available responders matching the needed roles
    const { data: responders } = await supabase
      .from('responders')
      .select('*')
      .in('role', roles)
      .eq('status', 'available')

    if (!responders || responders.length === 0) {
      return NextResponse.json({ error: 'No responders available', dispatched: [] })
    }

    // Sort by distance from incident
    const sorted = responders
      .filter(r => r.location_lat && r.location_lng)
      .map(r => ({
        ...r,
        distance: haversine(lat, lng, Number(r.location_lat), Number(r.location_lng)),
        eta: Math.round(haversine(lat, lng, Number(r.location_lat), Number(r.location_lng)) * 3) // ~3min per km
      }))
      .sort((a, b) => a.distance - b.distance)

    // Pick the nearest responder per role
    const dispatched: any[] = []
    const usedRoles = new Set<string>()

    for (const r of sorted) {
      if (!usedRoles.has(r.role) && dispatched.length < 2) {
        usedRoles.add(r.role)

        // Mark responder as busy
        await supabase
          .from('responders')
          .update({ status: 'busy', current_incident_id: null })
          .eq('id', r.id)

        dispatched.push({
          id: r.id,
          name: r.name,
          role: r.role,
          unit: r.unit_id,
          distance: Math.round(r.distance * 10) / 10,
          eta: Math.max(r.eta, 2),
        })
      }
    }

    // Update the escalated session with the first dispatched responder
    if (dispatched.length > 0) {
      await supabase
        .from('escalated_sessions')
        .update({
          status: 'assigned',
          assigned_responder: {
            id: dispatched[0].id,
            name: dispatched[0].name,
            role: dispatched[0].role,
            unit: dispatched[0].unit,
          },
        })
        .eq('id', sessionId)
    }

    return NextResponse.json({
      success: true,
      dispatched,
      message: `${dispatched.length} responder(s) dispatched`,
    })
  } catch (error) {
    console.error('Auto-dispatch error:', error)
    return NextResponse.json({ error: 'Auto-dispatch failed' }, { status: 500 })
  }
}
