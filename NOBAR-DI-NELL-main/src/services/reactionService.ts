import { ref, onValue, push, serverTimestamp, set } from 'firebase/database';
import { rtdb } from '../firebase/config';

export const sendReaction = async (roomId: string, emoji: string, uid: string) => {
  const reactionRef = push(ref(rtdb, `rooms/${roomId}/reactions`));
  await set(reactionRef, {
    emoji,
    uid,
    timestamp: serverTimestamp()
  });
};
