import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Settings, Shield, Award } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto text-white">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <User className="text-red-500" /> Profile
        </h1>
        <p className="text-neutral-400">Manage your account settings and preferences.</p>
      </header>
      
      {user && (
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-xl">
          <img src={user.photoURL} alt="Profile" className="w-32 h-32 rounded-full border-4 border-neutral-800" />
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold mb-1">{user.displayName}</h2>
            <p className="text-neutral-400 mb-4">UID: {user.uid}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium flex items-center gap-1">
                <Award size={14} /> Early Adopter
              </span>
              <span className="px-3 py-1 bg-white/10 text-neutral-300 rounded-full text-xs font-medium">
                Host Level 1
              </span>
            </div>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="px-6 py-3 bg-neutral-800 hover:bg-red-600 hover:text-white text-neutral-300 font-medium rounded-xl transition"
          >
            Sign Out
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={18} /> Preferences</h3>
          <div className="space-y-4 text-sm text-neutral-400">
            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <div className="w-10 h-5 bg-red-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Show Online Status</span>
              <div className="w-10 h-5 bg-red-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Shield size={18} /> Privacy</h3>
          <div className="space-y-4 text-sm text-neutral-400">
            <p>Your profile is currently public and can be seen in rooms you join.</p>
            <button className="text-red-400 hover:text-red-300 font-medium text-sm">Manage Privacy Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
