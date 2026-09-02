import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile } from '../store/authStore';

export interface ChatMessage {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  message: string;
  createdAt: any;
}

export const sendMessage = async (roomId: string, user: UserProfile, messageText: string) => {
  const messagesRef = collection(db, `rooms/${roomId}/messages`);
  await addDoc(messagesRef, {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    message: messageText.trim(),
    createdAt: serverTimestamp(),
  });
};

export const listenToChat = (roomId: string, callback: (messages: ChatMessage[]) => void) => {
  const messagesRef = collection(db, `rooms/${roomId}/messages`);
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
    // Reverse so the newest is at the bottom
    callback(messages.reverse());
  });
};
