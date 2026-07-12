// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const ADMIN_EMAILS = Deno.env.get('ADMIN_EMAILS')
const WEBHOOK_SECRET = Deno.env.get('EDGE_FUNCTION_SECRET')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

serve(async (_req) => {
  // Handle CORS preflight
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (!WEBHOOK_SECRET || _req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Aggregate Data
    const [scripts, portfolios, films, collabs, producerBriefs, pendingCount, topAmplifierRes] = await Promise.all([
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('type', 'script').gte('created_at', since),
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('type', 'portfolio').gte('created_at', since),
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('type', 'film').gte('created_at', since),
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('type', 'collab').gte('created_at', since),
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('type', 'producer_brief').gte('created_at', since),
      supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabaseAdmin.from('profiles').select('full_name, share_streak').order('share_streak', { ascending: false }).limit(1).maybeSingle(),
    ])

    const topAmplifier = topAmplifierRes.data || { full_name: 'No activity', share_streak: 0 }
    const adminList = ADMIN_EMAILS?.split(',').map((e: string) => e.trim()) || []

    if (adminList.length === 0) {
      return new Response(JSON.stringify({ error: 'No admin emails configured' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0e0f13; color: #F0EBE0; padding: 40px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(188,168,142,0.2); padding: 40px; background-color: #0a0b0e; text-align: left;">
          <h1 style="color: #BCA88E; letter-spacing: 5px; font-size: 20px; margin-bottom: 30px; text-transform: uppercase; text-align: center;">WEEKLY PRODUCTION DIGEST</h1>
          <div style="height: 1px; background: rgba(188,168,142,0.2); margin-bottom: 30px;"></div>

          <h3 style="color: #BCA88E; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 15px;">NEW THIS WEEK</h3>
          <ul style="list-style: none; padding: 0; margin-bottom: 35px; color: rgba(240,235,224,0.8); font-size: 14px;">
            <li style="margin-bottom: 10px;">📽️ <b>${scripts.count || 0}</b> Script Submissions</li>
            <li style="margin-bottom: 10px;">🛠️ <b>${portfolios.count || 0}</b> Technician Portfolios</li>
            <li style="margin-bottom: 10px;">🎬 <b>${films.count || 0}</b> Film Presentations</li>
            <li style="margin-bottom: 10px;">✦ <b>${collabs.count || 0}</b> Collab Proposals</li>
            <li style="margin-bottom: 10px;">💼 <b>${producerBriefs.count || 0}</b> Producer Briefs</li>
          </ul>

          <h3 style="color: #BCA88E; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 15px;">NEEDS ATTENTION</h3>
          <p style="font-size: 14px; margin-bottom: 35px;">
            There are <b style="color: #F0EBE0;">${pendingCount.count || 0}</b> submissions waiting for initial review.
          </p>

          <h3 style="color: #BCA88E; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 15px;">TOP AMPLIFIER</h3>
          <p style="font-size: 14px; margin-bottom: 40px;">
            🏆 <b>${topAmplifier.full_name}</b> leads the charge with a <b>${topAmplifier.share_streak}</b> share streak!
          </p>

          <div style="text-align: center; margin-bottom: 40px;">
            <a href="https://supremetalkies.com/dashboard" style="background-color: #BCA88E; color: #0e0f13; padding: 14px 28px; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 3px; display: inline-block;">OPEN ADMIN PANEL →</a>
          </div>

          <div style="height: 1px; background: rgba(188,168,142,0.1); margin-bottom: 20px;"></div>
          <p style="font-size: 9px; letter-spacing: 2px; color: #BCA88E; opacity: 0.6; text-align: center;">SUPREME TALKIES — INTERNAL INTELLIGENCE</p>
        </div>
      </div>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Supreme Talkies Reports <reports@resend.dev>',
        to: adminList,
        subject: `Weekly Production Report — ${new Date().toLocaleDateString()}`,
        html,
      }),
    })

    const resendData = await resendRes.json()

    return new Response(JSON.stringify({ ok: true, resend: resendData }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
