import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const DEFAULT_TMDB_API_KEY = "9752227dbc864a158b73bfbf29d830a5";

// Cache for API Key in memory
let cachedApiKey: string | null = null;

/**
 * Get TMDB API Key stored in Firebase Firestore
 * Document: app_settings/tmdb -> { apiKey: "..." }
 */
export async function getTmdbApiKeyFromFirebase(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  try {
    const settingsRef = doc(db, 'app_settings', 'tmdb');
    const snap = await getDoc(settingsRef);

    if (snap.exists() && snap.data()?.apiKey) {
      cachedApiKey = snap.data().apiKey;
      return cachedApiKey!;
    } else {
      // Initialize in Firebase if not present
      await setDoc(settingsRef, {
        apiKey: DEFAULT_TMDB_API_KEY,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      cachedApiKey = DEFAULT_TMDB_API_KEY;
      return cachedApiKey;
    }
  } catch (err) {
    console.warn("Could not read TMDB key from Firebase Firestore, using default:", err);
    return DEFAULT_TMDB_API_KEY;
  }
}

/**
 * Save / update TMDB API key to Firebase Firestore
 */
export async function saveTmdbApiKeyToFirebase(newKey: string): Promise<void> {
  const settingsRef = doc(db, 'app_settings', 'tmdb');
  await setDoc(settingsRef, {
    apiKey: newKey.trim(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
  cachedApiKey = newKey.trim();
}

/**
 * Fetch Popular Indonesian Movies from TMDB using Firebase API Key
 */
export async function fetchIndonesianMovies(page = 1) {
  const apiKey = await getTmdbApiKeyFromFirebase();
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=id&sort_by=popularity.desc&page=${page}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return await res.json();
  } catch (err) {
    // Fallback to proxy route
    const fallbackRes = await fetch('/api/catalog/explore');
    return await fallbackRes.json();
  }
}

/**
 * Search Movies using Firebase API Key
 */
export async function searchTmdbMovies(query: string) {
  const apiKey = await getTmdbApiKeyFromFirebase();
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=id-ID`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return await res.json();
  } catch (err) {
    const fallbackRes = await fetch(`/api/catalog/search?query=${encodeURIComponent(query)}`);
    return await fallbackRes.json();
  }
}

/**
 * Fetch Movie Videos / Trailers from TMDB
 */
export async function fetchMovieVideos(movieId: number | string) {
  const apiKey = await getTmdbApiKeyFromFirebase();
  const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return await res.json();
  } catch (err) {
    const fallbackRes = await fetch(`/api/catalog/${movieId}/videos`);
    return await fallbackRes.json();
  }
}

export interface StreamServer {
  id: string;
  name: string;
  getUrl: (id: number | string) => string;
}

export const STREAM_SERVERS: StreamServer[] = [
  {
    id: 'vidsrc-cc',
    name: 'Server 1 (VidSrc CC - Recomended)',
    getUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
  },
  {
    id: 'vidsrc-xyz',
    name: 'Server 2 (VidSrc XYZ)',
    getUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
  },
  {
    id: 'autoembed',
    name: 'Server 3 (AutoEmbed)',
    getUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
  },
  {
    id: 'multiembed',
    name: 'Server 4 (MultiEmbed)',
    getUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    id: 'vidsrc-me',
    name: 'Server 5 (VidSrc ME - Original)',
    getUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
  },
  {
    id: '2embed',
    name: 'Server 6 (2Embed)',
    getUrl: (id) => `https://www.2embed.cc/embed/${id}`,
  },
];

/**
 * Generate embed streaming URL for Full Movie
 */
export function getMovieEmbedStreamUrl(movieId: number | string, serverId = 'vidsrc-cc'): string {
  const server = STREAM_SERVERS.find(s => s.id === serverId) || STREAM_SERVERS[0];
  return server.getUrl(movieId);
}
