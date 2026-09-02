import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createRoom } from '../services/roomService';
import { useAuth } from '../hooks/useAuth';
import { PlaySquare, LogIn, Plus } from 'lucide-react';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateRoom = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const newRoomId = await createRoom(user.uid);
      navigate(`/watch/${newRoomId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create room');
      setLoading(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    navigate(`/watch/${roomId.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/20">
            <PlaySquare size={32} className="text-white ml-1" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">nobar di nell</h1>
          <p className="text-neutral-400">Premium Realtime Watch Party. Synchronized Playback.</p>
        </div>

        <div className="flex justify-center mb-4">
          <a href="https://www.instagram.com/tianshirrr_?igsi=MXF1NjVuOWswdm95Zg==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:opacity-90 transition-opacity text-white text-sm font-medium shadow-lg shadow-pink-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            @tianshirrr_
          </a>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition disabled:opacity-50"
            >
              <Plus size={20} />
              {loading ? 'Creating...' : 'Create New Room'}
            </button>
            <p className="text-xs text-center text-neutral-500 mt-3">
              You will be the host and control playback.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-neutral-900 text-neutral-500">or</span>
            </div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-neutral-400 mb-1.5">
                Have a room code?
              </label>
              <div className="flex gap-2">
                <input
                  id="roomCode"
                  type="text"
                  placeholder="e.g. AB7K92"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white uppercase tracking-wider outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                  maxLength={10}
                  required
                />
                <button
                  type="submit"
                  disabled={!roomId.trim()}
                  className="px-6 py-3 bg-neutral-800 text-white font-medium rounded-xl hover:bg-neutral-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  Join
                  <LogIn size={18} />
                </button>
              </div>
            </div>
          </form>
        </div>
        
        {user && (
          <div className="text-center text-sm text-neutral-500 flex items-center justify-center gap-2">
            <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full bg-neutral-800" />
            Playing as <span className="text-neutral-300 font-medium">{user.displayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
