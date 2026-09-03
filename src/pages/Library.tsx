import React from 'react';
import { Bookmark, FolderPlus, Clock } from 'lucide-react';

export default function Library() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-white">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Bookmark className="text-red-500" /> My Library
          </h1>
          <p className="text-neutral-400">Your saved playlists, favorite videos, and watch history.</p>
        </div>
        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition">
          <FolderPlus size={18} /> New Playlist
        </button>
      </header>
      
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
        <Clock size={48} className="text-neutral-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">No saved items yet</h2>
        <p className="text-neutral-400 max-w-sm mb-6">Start saving videos and playlists during watch parties to access them here quickly.</p>
        <button className="md:hidden flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-medium transition">
          <FolderPlus size={18} /> Create First Playlist
        </button>
      </div>
    </div>
  );
}
