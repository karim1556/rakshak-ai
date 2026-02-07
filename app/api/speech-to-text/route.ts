export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Check file size
    if (audioFile.size < 1000) {
      return Response.json({ 
        text: '',
        error: 'Recording too short' 
      }, { status: 400 })
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use Deepgram for transcription
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type || 'audio/webm',
      },
      body: buffer,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Deepgram error:', error)
      throw new Error('Transcription failed')
    }

    const data = await response.json()
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''

    return Response.json({
      text: transcript,
      confidence: data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
    })
  } catch (error: any) {
    console.error('Speech-to-text error:', error)
    return Response.json({ 
      text: '',
      error: 'Failed to transcribe audio' 
    }, { status: 500 })
  }
}
