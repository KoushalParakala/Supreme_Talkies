// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

const ADMIN_EMAILS = ['admin@supremetalkies.com', 'koushal.sub@gmail.com']

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return json({ error: 'Server misconfigured' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing authorization' }, 401)
    }

    // Verify caller JWT with anon client (user-scoped)
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !caller) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const { data: callerProfile } = await supabaseUser
      .from('profiles')
      .select('role, roles')
      .eq('id', caller.id)
      .maybeSingle()

    const roles = Array.isArray(callerProfile?.roles) ? callerProfile.roles : []
    const isAdmin =
      ADMIN_EMAILS.includes((caller.email || '').toLowerCase()) ||
      callerProfile?.role?.toLowerCase() === 'admin' ||
      roles.some((r: string) => typeof r === 'string' && r.toLowerCase() === 'admin')

    if (!isAdmin) {
      return json({ error: 'Forbidden — admin only' }, 403)
    }

    const body = await req.json()
    const user_id = body?.user_id
    if (!user_id || typeof user_id !== 'string') {
      return json({ error: 'Body must include user_id: string' }, 400)
    }

    if (user_id === caller.id) {
      return json({ error: 'Cannot ban yourself' }, 400)
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Hard ban: delete auth user, then remove profile row
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (deleteAuthError) {
      console.error('deleteUser failed:', deleteAuthError)
      return json({ error: deleteAuthError.message || 'Failed to delete auth user' }, 500)
    }

    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user_id)

    if (deleteProfileError) {
      // Auth user already gone; profile may cascade — log but don't hard-fail
      console.error('profiles delete after ban:', deleteProfileError)
    }

    return json({ success: true, user_id })
  } catch (err) {
    console.error('ban-user error:', err)
    return json({ error: err?.message || 'Internal error' }, 500)
  }
})
