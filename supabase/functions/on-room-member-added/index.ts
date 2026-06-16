import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record // project_room_members row

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Fetch Room Details
    const { data: room, error: roomError } = await supabaseAdmin
      .from('project_rooms')
      .select('title, script_title, brief')
      .eq('id', record.room_id)
      .single()

    if (roomError || !room) throw new Error('Room not found')

    // 2. Fetch Member Email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(record.user_id)
    if (userError || !user) throw new Error('User not found')

    const user_email = user.email
    const full_name = user.user_metadata?.full_name || 'Creative'

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0e0f13; color: #F0EBE0; padding: 40px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(188,168,142,0.2); padding: 40px; background-color: #0a0b0e; text-align: left;">
          <h1 style="color: #BCA88E; letter-spacing: 5px; font-size: 20px; margin-bottom: 30px; text-transform: uppercase; text-align: center;">PROJECT ASSIGNMENT</h1>
          <div style="height: 1px; background: rgba(188,168,142,0.2); margin-bottom: 30px;"></div>
          
          <h2 style="font-size: 18px; margin-bottom: 20px; color: #F0EBE0;">Hey ${full_name},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: rgba(240,235,224,0.8); margin-bottom: 25px;">
            You have been added to a new Supreme Talkies Project Room.
          </p>
          
          <div style="background: rgba(188,168,142,0.05); padding: 20px; border-left: 2px solid #BCA88E; margin-bottom: 30px;">
            <p style="margin: 0 0 10px; font-size: 16px; color: #BCA88E;"><b>${room.title}</b></p>
            <p style="margin: 0 0 15px; font-size: 12px; color: #F0EBE0; opacity: 0.6;">Role: ${record.role_in_project}</p>
            <p style="margin: 0 0 5px; font-size: 11px; letter-spacing: 1px; color: #BCA88E;">SCRIPT: ${room.script_title}</p>
            <p style="margin: 0; font-size: 13px; color: rgba(240,235,224,0.7); line-height: 1.5;">${room.brief}</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: rgba(240,235,224,0.8); margin-bottom: 40px;">
            Log in to your dashboard to view the full project room, collaborate with the team, and manage your assets.
          </p>

          <div style="text-align: center; margin-bottom: 40px;">
            <a href="https://supremetalkies.com/dashboard" style="background-color: #BCA88E; color: #0e0f13; padding: 14px 28px; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 3px; display: inline-block;">OPEN DASHBOARD →</a>
          </div>

          <div style="height: 1px; background: rgba(188,168,142,0.1); margin-bottom: 20px;"></div>
          <p style="font-size: 9px; letter-spacing: 2px; color: #BCA88E; opacity: 0.6; text-align: center;">SUPREME TALKIES — PRODUCTION OFFICE</p>
        </div>
      </div>
    `

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Supreme Talkies <production@resend.dev>',
        to: [user_email],
        subject: "You've been added to a Supreme Talkies Project Room 🎬",
        html,
      })
    })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
