import React, { useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useRoomStore } from '../../store/roomStore';
import { useAuth } from '../../hooks/useAuth';
import { formatTime } from '../../utils/helpers';
import { sendReaction } from '../../services/reactionService';
import { Send, Lock, Smile } from 'lucide-react';

interface ChatPanelProps {
  roomId: string;
}

const REACTIONS = ['😂', '❤️', '🔥', '👍', '😮', '👏'];

export default function ChatPanel({ roomId }: ChatPanelProps) {
  const { messages, sendMessage } = useChat(roomId);
  const { room } = useRoomStore();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = React.useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const chatEnabled = room?.settings.chatEnabled ?? true;
  const reactionsEnabled = room?.settings.reactionEnabled ?? true;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatEnabled) return;
    sendMessage(input);
    setInput('');
  };

  const handleReaction = (emoji: string) => {
    if (!user || !reactionsEnabled) return;
    sendReaction(roomId, emoji, user.uid);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-white/10 w-full md:w-80 flex-shrink-0">
      <div className="p-4 border-b border-white/10 font-medium text-white flex items-center justify-between">
        Live Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg) => {
          const isServerTimestamp = msg.createdAt?.toDate;
          const timeString = isServerTimestamp 
            ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div key={msg.id} className="flex gap-3">
              <img src={msg.photoURL} alt={msg.displayName} className="w-8 h-8 rounded-full flex-shrink-0 bg-neutral-800" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-neutral-200 truncate">{msg.displayName}</span>
                  <span className="text-xs text-neutral-500">{timeString}</span>
                </div>
                <p className="text-sm text-neutral-300 break-words leading-relaxed">{msg.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {reactionsEnabled && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-neutral-900/50">
          {REACTIONS.map(emoji => (
            <button 
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="text-xl hover:scale-125 transition-transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-neutral-900 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={chatEnabled ? "Say something..." : "Chat is disabled"} 
          className="flex-1 bg-neutral-800 text-white text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          maxLength={200}
          disabled={!chatEnabled}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || !chatEnabled}
          className="p-2 rounded-full bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
        >
          {chatEnabled ? <Send size={18} /> : <Lock size={18} />}
        </button>
      </form>
    </div>
  );
}
