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

const STATUS_MESSAGES: Record<string, { subject: string, body: string }> = {
  under_review: {
    subject: "Your submission is being reviewed 🎯",
    body: "We're actively reading/watching your submission. We'll be in touch soon."
  },
  accepted: {
    subject: "You've been shortlisted ✦",
    body: "Your submission has been shortlisted by the Supreme Talkies team. Expect a personal call from us within 3 days."
  },
  archived: {
    subject: "An update on your submission",
    body: "Thank you for sharing your work with us. This one isn't the right fit for our current slate, but we hope to connect again."
  }
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const { old_record, record } = payload
    
    // Only fire if status actually changed
    if (old_record?.status === record?.status) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Status unchanged' }), { status: 200 })
    }

    const msg = STATUS_MESSAGES[record.status]
    if (!msg) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No message for this status' }), { status: 200 })
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    
    // Fetch submitter email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(record.user_id)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    const user_email = user.email
    const full_name = record.data?.full_name || user.user_metadata?.full_name || 'Creative'
    const label = TYPE_LABELS[record.type] || 'Submission'
    const title = record.data?.title || record.data?.genre || record.data?.platform || ''

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0e0f13; color: #F0EBE0; padding: 40px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid rgba(188,168,142,0.2); padding: 40px; background-color: #0a0b0e;">
          <h1 style="color: #BCA88E; letter-spacing: 5px; font-size: 24px; margin-bottom: 30px; text-transform: uppercase;">SUPREME TALKIES</h1>
          <div style="height: 1px; background: rgba(188,168,142,0.2); margin-bottom: 30px;"></div>
          <h2 style="font-size: 18px; margin-bottom: 20px; color: #F0EBE0;">Hello ${full_name},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: rgba(240,235,224,0.8); margin-bottom: 25px;">
            Regarding your ${label}${title ? ` — "${title}"` : ''}:
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #BCA88E; margin-bottom: 40px; font-style: italic;">
            "${msg.body}"
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
        from: 'Supreme Talkies <onboarding@resend.dev>',
        to: [user_email],
        subject: msg.subject,
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
