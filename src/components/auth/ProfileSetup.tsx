import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { PlaySquare } from 'lucide-react';

const AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophie',
];

export default function ProfileSetup() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const { setUser } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Generate a random ID for this local session
    const randomUid = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    setUser({
      uid: randomUid,
      displayName: name.trim(),
      photoURL: selectedAvatar,
      createdAt: Date.now()
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/20">
            <PlaySquare size={32} className="text-white ml-1" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to Nobar</h1>
          <p className="text-neutral-400">Set your username and avatar before joining.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-3">
              Choose Avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                    selectedAvatar === url 
                      ? 'border-red-500 scale-105 shadow-lg shadow-red-500/20' 
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Avatar option" className="w-full h-full bg-neutral-800 object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-neutral-400 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="e.g. MovieBuff99"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
              maxLength={20}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition disabled:opacity-50"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
