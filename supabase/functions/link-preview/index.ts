// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

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

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0' || h === '::1') return true
  const parts = h.split('.').map((n) => Number(n))
  if (parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [a, b] = parts
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
  }
  return false
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function metaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const a = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    )
    if (a?.[1]) return decodeEntities(a[1].trim())
    const b = html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
    )
    if (b?.[1]) return decodeEntities(b[1].trim())
  }
  return null
}

function absoluteUrl(maybe: string | null, base: string) {
  if (!maybe) return null
  try {
    return new URL(maybe, base).toString()
  } catch {
    return null
  }
}

function youtubeId(url: URL) {
  if (url.hostname.includes('youtu.be')) return url.pathname.replace(/^\//, '').split('/')[0] || null
  if (url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com')) {
    const v = url.searchParams.get('v')
    if (v) return v
    const nested = url.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)
    return nested?.[1] || null
  }
  return null
}

function vimeoId(url: URL) {
  if (!url.hostname.includes('vimeo.com')) return null
  const match = url.pathname.match(/\/(\d+)/)
  return match?.[1] || null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: 'Server misconfigured' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !caller) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const raw = typeof body?.url === 'string' ? body.url.trim() : ''
    if (!raw) return json({ error: 'Body must include url: string' }, 400)

    let target: URL
    try {
      target = new URL(raw)
    } catch {
      return json({ error: 'Invalid URL' }, 400)
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return json({ error: 'Only http and https links are allowed' }, 400)
    }
    if (isPrivateHost(target.hostname)) {
      return json({ error: 'That host cannot be fetched' }, 400)
    }

    const ytEarly = youtubeId(target)
    if (ytEarly) {
      return json({
        url: target.toString(),
        title: 'YouTube',
        image: `https://img.youtube.com/vi/${ytEarly}/hqdefault.jpg`,
      })
    }
    const vimEarly = vimeoId(target)
    if (vimEarly) {
      return json({
        url: target.toString(),
        title: 'Vimeo',
        image: `https://vumbnail.com/${vimEarly}.jpg`,
      })
    }

    const fallback = () => json({
      url: target.toString(),
      title: target.hostname.replace(/^www\./, ''),
      image: null,
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    let html = ''
    try {
      const res = await fetch(target.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SupremeTalkies/1.0; +https://supremetalkies.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
      })
      const type = res.headers.get('content-type') || ''
      if (!res.ok) return fallback()
      if (!type.includes('text/html') && !type.includes('application/xhtml')) {
        return fallback()
      }
      const buf = await res.arrayBuffer()
      if (buf.byteLength > 512_000) {
        html = new TextDecoder().decode(buf.slice(0, 512_000))
      } else {
        html = new TextDecoder().decode(buf)
      }
    } catch {
      return fallback()
    } finally {
      clearTimeout(timer)
    }

    const title =
      metaContent(html, ['og:title', 'twitter:title']) ||
      decodeEntities((html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim()) ||
      target.hostname

    const image =
      absoluteUrl(metaContent(html, ['og:image', 'og:image:url', 'twitter:image']), target.toString())

    return json({
      url: target.toString(),
      title: title.slice(0, 180),
      image,
    })
  } catch (err) {
    console.error('link-preview error:', err)
    return json({ error: err?.message || 'Could not preview that link' }, 200)
  }
})
