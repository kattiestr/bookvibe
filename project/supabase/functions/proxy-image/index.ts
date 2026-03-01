import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      }
    })
  }

  const { url } = await req.json()
  if (!url) {
    return new Response(JSON.stringify({ error: 'No URL' }), { status: 400 })
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const arrayBuffer = await response.arrayBuffer()

  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
      'Access-Control-Allow-Origin': '*',
    }
  })
})
