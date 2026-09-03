import React, { useEffect, useState } from 'react';
import { Bookmark, Clock, Play, Trash2, Plus, Music, Video, Link as LinkIcon, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LibraryItem, getUserLibrary, removeFromLibrary, saveToLibrary } from '../services/libraryService';
import { detectMediaType } from '../utils/helpers';
import YoutubeSearchModal from '../components/playlist/YoutubeSearchModal';

export default function Library() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadLibrary();
  }, [user]);

  const loadLibrary = async () => {
    if (!user) return;
    try {
      const data = await getUserLibrary(user.uid);
      setItems(data);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('unavailable') || err.message?.includes('network')) {
        alert("Could not connect to database. Please check your internet connection and disable any Adblockers or Brave Shields.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!user) return;
    try {
      await removeFromLibrary(user.uid, itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !user) return;
    
    if (!newUrl.startsWith('http')) {
      alert("Must be a valid URL starting with http:// or https://");
      return;
    }

    try {
      const mediaType = detectMediaType(newUrl);
      let title = newUrl;
      let thumbnail = '';

      if (mediaType === 'youtube') {
        const videoIdMatch = newUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (videoId) {
          title = `YouTube Video (${videoId})`;
          thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
      }

      await saveToLibrary(user.uid, {
        url: newUrl,
        title,
        thumbnail,
        type: mediaType
      });
      
      setNewUrl('');
      setIsAdding(false);
      loadLibrary();
    } catch (err) {
      console.error(err);
    }
  };

  const handleYoutubeSelect = async (video: any) => {
    if (!user) return;
    try {
      await saveToLibrary(user.uid, {
        url: video.url,
        title: video.title,
        thumbnail: video.thumbnail,
        type: 'youtube'
      });
      setIsSearchingYoutube(false);
      loadLibrary();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-white pb-24">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Bookmark className="text-red-500" /> My Library
          </h1>
          <p className="text-neutral-400">Your saved videos and audio for quick access.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSearchingYoutube(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition"
          >
            <Search size={18} /> Search YT
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition"
          >
            <Plus size={18} /> Add URL
          </button>
        </div>
      </header>

      {isAdding && (
        <form onSubmit={handleAddUrl} className="mb-8 p-4 bg-neutral-900 border border-white/10 rounded-xl flex gap-2">
          <input
            type="text"
            placeholder="Paste media URL here..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500"
            autoFocus
          />
          <button type="submit" className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium">Save</button>
        </form>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
          <Clock size={48} className="text-neutral-600 mb-4" />
          <h2 className="text-xl font-bold mb-2">No saved items yet</h2>
          <p className="text-neutral-400 max-w-sm mb-6">Start saving videos and playlists during watch parties to access them here quickly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden group flex flex-col">
              {item.thumbnail ? (
                <div className="aspect-video relative">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <div className="bg-red-600 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition">
                      <Play className="text-white ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-neutral-800 flex items-center justify-center relative">
                  {item.type === 'audio' ? <Music size={40} className="text-neutral-600" /> : 
                   item.type === 'video' ? <Video size={40} className="text-neutral-600" /> : 
                   <LinkIcon size={40} className="text-neutral-600" />}
                </div>
              )}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="font-semibold line-clamp-2 mb-1" title={item.title}>{item.title}</h3>
                  <p className="text-xs text-neutral-500 truncate">{item.url}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs font-medium px-2 py-1 bg-white/10 rounded text-neutral-300 uppercase tracking-wider">{item.type}</span>
                  <button onClick={() => handleRemove(item.id)} className="text-neutral-500 hover:text-red-500 transition p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isSearchingYoutube && (
        <YoutubeSearchModal
          onClose={() => setIsSearchingYoutube(false)}
          onSelect={handleYoutubeSelect}
        />
      )}
    </div>
  );
}
