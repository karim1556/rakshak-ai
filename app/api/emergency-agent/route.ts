import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AIResponse {
  response: string
  sessionInfo?: {
    type?: 'medical' | 'fire' | 'safety' | 'accident' | 'other'
    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    summary?: string
  }
  steps?: Array<{
    text: string
    imageUrl?: string
  }>
  shouldEscalate: boolean
  needsMoreInfo: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, conversationHistory = [], currentSteps = [] } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .filter((m: any) => m.role === 'user' || m.role === 'ai')
      .map((m: any) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n')

    const existingSteps = currentSteps
      .map((s: any, i: number) => `${i + 1}. ${s.text} ${s.completed ? '(DONE)' : ''}`)
      .join('\n')

    const systemPrompt = `You are an AI emergency response assistant for Rakshak AI, similar to Prepared 911. You help people during emergencies.

GUIDELINES:
- Be calm, reassuring, but direct
- Ask focused questions (location, people affected, dangers)
- Give ONE clear instruction at a time
- For medical: Check breathing, consciousness, bleeding
- For fires: Prioritize evacuation, never re-enter
- For accidents: Check injuries, ensure scene safety
- For crimes: User safety first

ESCALATE (shouldEscalate = true) when:
- Unconscious/not breathing
- Active fire/severe smoke  
- Being attacked/immediate danger
- Serious injuries (heavy bleeding, visible bones, severe burns)
- Any life-threatening situation

RESPOND IN THIS EXACT JSON FORMAT:
{
  "response": "Your spoken response to the user",
  "sessionInfo": {
    "type": "medical|fire|safety|accident|other",
    "severity": "CRITICAL|HIGH|MEDIUM|LOW",
    "summary": "Brief one-line summary"
  },
  "steps": [
    {"text": "Clear instruction", "imageUrl": "optional image URL"}
  ],
  "shouldEscalate": false,
  "needsMoreInfo": true
}

Only include NEW steps not already given. Use these image URLs when relevant:
- CPR: https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400
- First aid: https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400
- Fire evacuation: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400`

    const userMessage = `Session: ${sessionId}
${conversationContext ? `\nConversation:\n${conversationContext}` : ''}
${existingSteps ? `\nExisting steps:\n${existingSteps}` : ''}

User says: "${message}"

Respond with valid JSON only.`

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const parsed: AIResponse = JSON.parse(content)
    
    return NextResponse.json({
      response: parsed.response || "I'm here to help. Can you tell me more about what's happening?",
      sessionInfo: parsed.sessionInfo,
      steps: parsed.steps || [],
      shouldEscalate: parsed.shouldEscalate || false,
      needsMoreInfo: parsed.needsMoreInfo !== false,
    })

  } catch (error) {
    console.error('Emergency agent error:', error)
    return NextResponse.json(
      { 
        response: "I'm having some technical difficulties, but your safety is my priority. If this is a life-threatening emergency, please call 112 immediately.",
        shouldEscalate: false,
        needsMoreInfo: true,
        steps: []
      },
      { status: 200 }
    )
  }
}
