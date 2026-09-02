import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const getYoutubeApiKey = async (): Promise<string | null> => {
  try {
    const docRef = doc(db, 'config', 'youtube');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().apiKey;
    }
    return null;
  } catch (error) {
    console.error("Error fetching YouTube API key from Firebase:", error);
    return null;
  }
};

export const setYoutubeApiKey = async (apiKey: string): Promise<void> => {
  const docRef = doc(db, 'config', 'youtube');
  await setDoc(docRef, { apiKey });
};

export interface YoutubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export const searchYoutube = async (query: string, apiKey: string): Promise<YoutubeSearchResult[]> => {
  if (!apiKey) throw new Error("YouTube API key is missing");
  
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch from YouTube API");
  }
  const data = await response.json();
  
  return data.items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium.url,
    channelTitle: item.snippet.channelTitle
  }));
};
