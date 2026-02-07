import { generateText, Output } from 'ai'
import { z } from 'zod'

const analysisSchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  incidentType: z.string(),
  description: z.string(),
  respondersNeeded: z.array(z.string()),
  recommendedResponse: z.string(),
  estimatedResponseTime: z.string(),
  keyFacts: z.array(z.string()),
})

export async function POST(request: Request) {
  try {
    const { emergencyType, description, location } = await request.json()

    const prompt = `You are an expert emergency dispatch AI. Analyze this emergency report and provide critical response information.

Emergency Type: ${emergencyType}
Location: ${location}
Description: ${description}

Analyze this emergency and provide:
1. Severity level (CRITICAL, HIGH, MEDIUM, LOW)
2. Specific incident type
3. List of responders needed (e.g., "Paramedics", "Police Officers", "Fire Department")
4. Recommended immediate response action
5. Estimated response time based on typical emergency response protocols
6. Key facts to communicate to responders

Be precise and focused on actionable information for emergency responders.`

    const result = await generateText({
      model: 'openai/gpt-4-turbo',
      system: `You are an emergency dispatch AI system. Your role is to quickly analyze emergency reports and provide critical information for responders. 
      
      Always respond with a valid JSON object matching this structure:
      {
        "severity": "CRITICAL|HIGH|MEDIUM|LOW",
        "incidentType": "string",
        "respondersNeeded": ["string"],
        "recommendedResponse": "string",
        "estimatedResponseTime": "string",
        "keyFacts": ["string"]
      }
      
      Be concise, clear, and focus on actionable information.`,
      prompt,
      output: Output.object({
        schema: analysisSchema,
      }),
    })

    return Response.json({
      severity: result.object.severity,
      incidentType: result.object.incidentType,
      respondersNeeded: result.object.respondersNeeded,
      recommendedResponse: result.object.recommendedResponse,
      estimatedResponseTime: result.object.estimatedResponseTime,
      keyFacts: result.object.keyFacts,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return Response.json(
      { error: 'Failed to analyze emergency' },
      { status: 500 }
    )
  }
}
