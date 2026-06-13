import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { receiverId, title, body, url } = await req.json()

    // Get receiver's FCM token
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', receiverId)
      .single()

    if (!profile?.fcm_token) {
      return new Response(JSON.stringify({ skipped: 'No FCM token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send via FCM
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        notification: { title, body, icon: '/icon-192.png', click_action: url || '/' },
        data: { url: url || '/' },
      }),
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
