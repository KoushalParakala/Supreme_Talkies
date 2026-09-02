export function normalizeHttpUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
}

function parseUrl(raw: string): URL | null {
  try {
    return new URL(normalizeHttpUrl(raw));
  } catch {
    return null;
  }
}

export function youtubeVideoId(raw: string): string | null {
  const url = parseUrl(raw);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') return url.pathname.replace(/^\//, '').split('/')[0] || null;
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com' || host.endsWith('.youtube.com')) {
    const v = url.searchParams.get('v');
    if (v) return v;
    const nested = url.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/);
    return nested?.[1] || null;
  }
  return null;
}

export function vimeoVideoId(raw: string): string | null {
  const url = parseUrl(raw);
  if (!url) return null;
  if (!url.hostname.includes('vimeo.com')) return null;
  const match = url.pathname.match(/\/(?:video\/)?(\d+)/);
  return match?.[1] || null;
}

export function reelPreviewFromUrl(raw: string): { url: string; title: string; image: string | null } {
  const url = normalizeHttpUrl(raw);
  if (!url || url.startsWith('/')) {
    return { url, title: url, image: null };
  }
  const yt = youtubeVideoId(url);
  if (yt) {
    return {
      url,
      title: 'YouTube',
      image: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    };
  }
  const vim = vimeoVideoId(url);
  if (vim) {
    return {
      url,
      title: 'Vimeo',
      image: `https://vumbnail.com/${vim}.jpg`,
    };
  }
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    /* keep raw */
  }
  return { url, title: host || url, image: null };
}

export function displayReelTitle(title: string | null | undefined, href: string | null | undefined): string {
  const text = (title || '').trim();
  if (text && !/^https?:\/\//i.test(text) && !/^www\./i.test(text)) return text;
  if (href || text) return reelPreviewFromUrl(href || text).title;
  return text;
}
