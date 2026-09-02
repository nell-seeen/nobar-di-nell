import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PlaybackStateDoc } from '../store/playbackStore';

export const sendPlaybackCommand = async (
  roomId: string, 
  command: PlaybackStateDoc['command'], 
  payload: Partial<PlaybackStateDoc>, 
  currentVersion: number,
  userId: string
) => {
  const playbackRef = doc(db, `rooms/${roomId}/playback`, 'state');
  
  await updateDoc(playbackRef, {
    ...payload,
    command,
    updatedAt: serverTimestamp(),
    playbackVersion: currentVersion + 1,
    commandId: crypto.randomUUID(),
    updatedBy: userId
  });
};
