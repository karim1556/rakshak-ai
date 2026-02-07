export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return Response.json({ error: 'No text provided' }, { status: 400 })
    }

    // ElevenLabs voice ID - Rachel (calm, professional female voice)
    const voiceId = '21m00Tcm4TlvDq8ikWAM'
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('ElevenLabs error:', error)
      throw new Error('TTS failed')
    }

    // Stream the audio back
    const audioBuffer = await response.arrayBuffer()
    
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return Response.json({ error: 'Failed to generate speech' }, { status: 500 })
  }
}
