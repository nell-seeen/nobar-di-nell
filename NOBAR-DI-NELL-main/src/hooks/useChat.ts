import { useEffect, useState } from 'react';
import { listenToChat, ChatMessage, sendMessage } from '../services/chatService';
import { useAuth } from './useAuth';

export function useChat(roomId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = listenToChat(roomId, setMessages);
    return () => unsubscribe();
  }, [roomId]);

  const send = async (text: string) => {
    if (!roomId || !user || !text.trim()) return;
    await sendMessage(roomId, user, text);
  };

  return { messages, sendMessage: send };
}
