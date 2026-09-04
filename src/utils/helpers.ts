export function generateRoomId(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function isHlsUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);
    const pathname = url.pathname.toLowerCase();
    return pathname.endsWith('.m3u8') || pathname.includes('.m3u8/');
  } catch {
    // Fallback for invalid URLs that might just be paths
    const lower = rawUrl.toLowerCase();
    const withoutQuery = lower.split('?')[0];
    return withoutQuery.endsWith('.m3u8') || withoutQuery.includes('.m3u8/');
  }
}

export function detectMediaType(url: string): 'video' | 'audio' | 'hls' | 'youtube' | 'embed' {
  if (!url) return 'video';
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('vidsrc') || lowerUrl.includes('embed') || lowerUrl.includes('2embed') || lowerUrl.includes('autoembed')) return 'embed';
  if (isHlsUrl(url)) return 'hls';
  
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    if (pathname.endsWith('.mp3') || pathname.endsWith('.m4a') || pathname.endsWith('.wav')) return 'audio';
  } catch {
    if (lowerUrl.includes('.mp3') || lowerUrl.includes('.m4a') || lowerUrl.includes('.wav')) return 'audio';
  }
  
  return 'video'; // Default fallback
}
