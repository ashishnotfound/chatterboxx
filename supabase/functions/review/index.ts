import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface Request {
  method: string;
  url: string;
  json(): Promise<any>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  console.log('[Review] Request received:', { method: req.method, url: req.url })
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[Review] CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[Review] Parsing request body...')
    const { username, rating, review } = await req.json()
    console.log('[Review] Parsed data:', { username, rating, reviewLength: review?.length })

    // Log environment variable presence (not the value for security)
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')
    console.log('[Review] Webhook URL present:', !!webhookUrl)
    console.log('[Review] Webhook URL length:', webhookUrl?.length || 0)

    // 1. Validation
    if (!username || !rating || !review) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (review.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Review must be at least 10 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL not set')
      return new Response(
        JSON.stringify({ error: 'Server configuration error - missing webhook URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For now, just return success without calling Discord to test
    console.log('[Review] Test mode: returning success without Discord call')
    return new Response(
      JSON.stringify({ success: true, test: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in review function:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
