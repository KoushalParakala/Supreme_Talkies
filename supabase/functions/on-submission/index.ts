import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const TYPE_LABELS: Record<string, string> = {
  script: 'Script Submission',
  portfolio: 'Portfolio / Crew Card',
  film: 'Film Presentation',
  collab: 'Collab Proposal',
  producer_brief: 'Producer Brief',
  producer_interest: 'Producer Interest',
}

const SUBJECT_MAP: Record<string, string> = {
  script: 'We received your script 🎬',
  portfolio: 'Your crew card is in the pool 🎞️',
  film: 'Your film submission is with us 📽️',
  collab: 'Collab proposal received ✦',
  producer_brief: 'Your brief is with our team 🎬',
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record // new submission row
    
    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    
    // Fetch submitter email from auth.users
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(record.user_id)
    
    if (userError || !user) {
      console.error('Error fetching user:', userError)
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    const user_email = user.email
    const full_name = record.data?.full_name || user.user_metadata?.full_name || 'Creative'
    const label = TYPE_LABELS[record.type] || 'Submission'
    const subject = SUBJECT_MAP[record.type] || 'Submission received — Supreme Talkies'
    const title = record.data?.title || record.data?.genre || record.data?.platform || ''

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0e0f13; color: #F0EBE0; padding: 40px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(188,168,142,0.2); padding: 40px; background-color: #0a0b0e;">
          <h1 style="color: #BCA88E; letter-spacing: 5px; font-size: 24px; margin-bottom: 30px; text-transform: uppercase;">SUPREME TALKIES</h1>
          <div style="height: 1px; background: rgba(188,168,142,0.2); margin-bottom: 30px;"></div>
          <h2 style="font-size: 18px; margin-bottom: 20px;">We've got it.</h2>
          <p style="font-size: 14px; line-height: 1.6; color: rgba(240,235,224,0.8); margin-bottom: 25px;">
            Hey ${full_name},
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: rgba(240,235,224,0.8); margin-bottom: 25px;">
            Your ${label}${title ? ` — "${title}"` : ''} is now with the Supreme Talkies team.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: rgba(240,235,224,0.8); margin-bottom: 40px;">
            We typically review within 7 days. We'll reach out personally if it moves forward.
          </p>
          <div style="height: 1px; background: rgba(188,168,142,0.1); margin-bottom: 20px;"></div>
          <p style="font-size: 10px; letter-spacing: 2px; color: #BCA88E; opacity: 0.6;">SUPREME TALKIES — VIJAYAWADA</p>
        </div>
      </div>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${RESEND_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        from: 'Supreme Talkies <onboarding@resend.dev>', // Use verified domain later, onboarding works for testing
        to: [user_email],
        subject,
        html,
      })
    })

    const resendData = await resendRes.json()

    return new Response(JSON.stringify({ ok: true, resend: resendData }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
