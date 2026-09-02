export function generateRoomId(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function detectMediaType(url: string): 'video' | 'audio' | 'hls' | 'youtube' {
  if (!url) return 'video';
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('.m3u8')) return 'hls';
  if (lowerUrl.includes('.mp3') || lowerUrl.includes('.m4a') || lowerUrl.includes('.wav')) return 'audio';
  return 'video'; // Default fallback
}
