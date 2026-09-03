import React, { useEffect, useState } from 'react';
import { X, Play, Music, Video, Link as LinkIcon, Bookmark } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LibraryItem, getUserLibrary } from '../../services/libraryService';

interface LibraryModalProps {
  onClose: () => void;
  onSelect: (url: string, title?: string, thumbnail?: string) => void;
}

export default function LibraryModal({ onClose, onSelect }: LibraryModalProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserLibrary(user.uid)
      .then(setItems)
      .catch((err: any) => {
        console.error(err);
        if (err.message?.includes('unavailable') || err.message?.includes('network')) {
          alert("Could not connect to database. Please check your internet connection and disable any Adblockers or Brave Shields.");
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bookmark className="text-red-500" /> Choose from Library
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              <Bookmark className="mx-auto mb-4 opacity-50" size={48} />
              <p>Your library is empty.</p>
              <p className="text-sm">Save items from the Library page to access them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => onSelect(item.url, item.title, item.thumbnail)}
                  className="bg-black border border-white/5 rounded-xl p-3 flex gap-3 cursor-pointer hover:border-red-500/50 hover:bg-neutral-800 transition group"
                >
                  <div className="w-24 h-16 bg-neutral-800 rounded shrink-0 overflow-hidden relative">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LinkIcon size={20} className="text-neutral-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Play className="text-white" size={16} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h4 className="font-medium text-sm line-clamp-2 text-white group-hover:text-red-400 transition">{item.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1 uppercase">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
