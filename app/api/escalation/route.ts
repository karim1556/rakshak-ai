import { NextRequest, NextResponse } from 'next/server'

// In-memory store for demo (use Redis/database in production)
const escalatedSessions: Map<string, any> = new Map()

export async function GET() {
  // Return all escalated sessions
  const sessions = Array.from(escalatedSessions.values())
    .sort((a, b) => b.escalatedAt - a.escalatedAt)
  
  return NextResponse.json({ sessions })
}

export async function POST(req: NextRequest) {
  try {
    const session = await req.json()
    
    if (!session.id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    // Store the escalated session
    escalatedSessions.set(session.id, {
      ...session,
      escalatedAt: Date.now(),
      status: 'escalated',
    })
    
    // In production, this would:
    // 1. Store in database
    // 2. Send push notification to dispatchers
    // 3. Trigger WebSocket event
    // 4. Store conversation in mem0 for context
    
    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      message: 'Session escalated to dispatch'
    })
    
  } catch (error) {
    console.error('Escalation error:', error)
    return NextResponse.json({ error: 'Failed to escalate' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { sessionId, status, assignedResponder, message } = await req.json()
    
    const session = escalatedSessions.get(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    // Update session
    const updated = {
      ...session,
      status: status || session.status,
      assignedResponder: assignedResponder || session.assignedResponder,
    }
    
    // Add message if provided
    if (message) {
      updated.messages = [
        ...(updated.messages || []),
        {
          id: `msg-${Date.now()}`,
          role: 'dispatch',
          content: message,
          timestamp: Date.now(),
        }
      ]
    }
    
    escalatedSessions.set(sessionId, updated)
    
    return NextResponse.json({ success: true, session: updated })
    
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  
  if (sessionId) {
    escalatedSessions.delete(sessionId)
  }
  
  return NextResponse.json({ success: true })
}
