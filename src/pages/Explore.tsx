import React from 'react';
import { Compass, Users, Sparkles } from 'lucide-react';

export default function Explore() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-white">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Compass className="text-red-500" /> Explore Public Rooms
        </h1>
        <p className="text-neutral-400">Discover active watch parties and join the community.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards */}
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-red-500/50 transition cursor-pointer group">
            <div className="aspect-video bg-neutral-800 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-neutral-600 group-hover:text-red-500/50 transition" size={32} />
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <span className="bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white">LIVE</span>
                <span className="bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1">
                  <Users size={12} /> {Math.floor(Math.random() * 50) + 5}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 truncate">Chill Lo-Fi Beats {i}</h3>
              <p className="text-sm text-neutral-400 truncate">Hosted by User {i}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
