// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const WEBHOOK_SECRET = Deno.env.get('EDGE_FUNCTION_SECRET')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (!WEBHOOK_SECRET || req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json()
    const { old_record, record } = payload // project_rooms row

    // Only fire if status changed to 'completed'
    if (old_record?.status === 'completed' || record?.status !== 'completed') {
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Fetch all members of this room
    const { data: members, error: membersError } = await supabaseAdmin
      .from('project_room_members')
      .select('user_id')
      .eq('room_id', record.id)

    if (membersError || !members) throw new Error('Could not fetch members')

    const results: string[] = []

    for (const member of members) {
      try {
        // 2. Mark profile as ST Verified
        await supabaseAdmin.from('profiles').update({ st_verified: true }).eq('id', member.user_id)

        // 3. Fetch User and Send Email
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
        if (!user) continue

        const html = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0e0f13; color: #F0EBE0; padding: 40px; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(188,168,142,0.2); padding: 40px; background-color: #0a0b0e; text-align: left;">
              <h1 style="color: #BCA88E; letter-spacing: 5px; font-size: 20px; margin-bottom: 30px; text-transform: uppercase; text-align: center;">PRODUCTION COMPLETED</h1>
              <div style="height: 1px; background: rgba(188,168,142,0.2); margin-bottom: 30px;"></div>

              <h2 style="font-size: 24px; margin-bottom: 20px; color: #BCA88E; text-align: center;">✦ YOU'RE VERIFIED</h2>

              <p style="font-size: 14px; line-height: 1.6; color: rgba(240,235,224,0.8); margin-bottom: 25px; text-align: center;">
                Congratulations on completing <b style="color: #F0EBE0;">${record.title}</b> with Supreme Talkies.
              </p>

              <div style="background: rgba(188,168,142,0.05); padding: 30px; border: 1px solid rgba(188,168,142,0.1); margin-bottom: 35px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #F0EBE0; line-height: 1.6;">
                  Your profile now carries the <b>ST Verified</b> badge — a mark of craft, commitment, and successful collaboration within our community.
                </p>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: rgba(240,235,224,0.8); margin-bottom: 40px; text-align: center;">
                This project has been added to your public portfolio. Keep creating.
              </p>

              <div style="text-align: center; margin-bottom: 40px;">
                <a href="https://supremetalkies.com/crew" style="background-color: #BCA88E; color: #0e0f13; padding: 14px 28px; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 3px; display: inline-block;">VIEW YOUR PROFILE →</a>
              </div>

              <div style="height: 1px; background: rgba(188,168,142,0.1); margin-bottom: 20px;"></div>
              <p style="font-size: 9px; letter-spacing: 2px; color: #BCA88E; opacity: 0.6; text-align: center;">SUPREME TALKIES — VIJAYAWADA</p>
            </div>
          </div>
        `

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Supreme Talkies <recognition@resend.dev>',
            to: [user.email],
            subject: "You're now ST Verified ✦",
            html,
          }),
        })
        results.push(user.email!)
      } catch (e) {
        console.error(`Failed for member ${member.user_id}:`, e)
      }
    }

    return new Response(JSON.stringify({ ok: true, notified: results }), {
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
