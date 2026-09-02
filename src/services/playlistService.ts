import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  mediaType: 'video' | 'audio' | 'hls' | 'youtube';
  duration: number;
  thumbnail: string;
  addedBy: string;
  createdAt: any;
  order: number;
  votes: Record<string, number>; // uid -> 1 (upvote) or -1 (downvote)
  voteScore: number;
}

export const addToPlaylist = async (roomId: string, item: Omit<PlaylistItem, 'id' | 'createdAt' | 'votes' | 'voteScore'>) => {
  const playlistRef = collection(db, `rooms/${roomId}/playlist`);
  await addDoc(playlistRef, {
    ...item,
    votes: {},
    voteScore: 0,
    createdAt: serverTimestamp()
  });
};

export const removeFromPlaylist = async (roomId: string, itemId: string) => {
  const itemRef = doc(db, `rooms/${roomId}/playlist`, itemId);
  await deleteDoc(itemRef);
};

export const updatePlaylistOrder = async (roomId: string, items: { id: string, order: number }[]) => {
  // Simple bulk update approach for reordering
  const promises = items.map(item => {
    const itemRef = doc(db, `rooms/${roomId}/playlist`, item.id);
    return updateDoc(itemRef, { order: item.order });
  });
  await Promise.all(promises);
};

export const votePlaylistItem = async (roomId: string, itemId: string, uid: string, vote: 1 | -1 | 0) => {
  const itemRef = doc(db, `rooms/${roomId}/playlist`, itemId);
  
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(itemRef);
    if (!docSnap.exists()) return;
    
    const data = docSnap.data();
    const votes = data.votes || {};
    
    if (vote === 0) {
      delete votes[uid];
    } else {
      votes[uid] = vote;
    }
    
    // Recalculate score
    const voteScore = Object.values(votes).reduce((acc: number, curr: any) => acc + curr, 0);
    
    transaction.update(itemRef, {
      votes,
      voteScore
    });
  });
};

export const listenToPlaylist = (roomId: string, callback: (items: PlaylistItem[]) => void) => {
  const playlistRef = collection(db, `rooms/${roomId}/playlist`);
  // When voting is enabled, order is overridden by score if needed by the frontend, but we keep DB ordering here as a base
  const q = query(playlistRef, orderBy('order', 'asc'), orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PlaylistItem[];
    callback(items);
  });
};
