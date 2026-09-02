import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Youtube, Key, Plus } from 'lucide-react';
import { getYoutubeApiKey, setYoutubeApiKey, searchYoutube, YoutubeSearchResult } from '../../services/youtubeService';
import { useAuth } from '../../hooks/useAuth';

interface YoutubeSearchModalProps {
  onClose: () => void;
  onAdd: (url: string) => void;
  isHost: boolean;
}

export default function YoutubeSearchModal({ onClose, onAdd, isHost }: YoutubeSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YoutubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  
  useEffect(() => {
    const checkKey = async () => {
      const key = await getYoutubeApiKey();
      if (key) {
        setApiKey(key);
        setIsApiKeySet(true);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    try {
      await setYoutubeApiKey(apiKey.trim());
      setIsApiKeySet(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save API key to Firebase");
    }
  };

  useEffect(() => {
    if (!query.trim() || !apiKey) {
      if (!query.trim()) setResults([]); // clear if empty
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await searchYoutube(query, apiKey);
        setResults(data);
      } catch (err: any) {
        setError(err.message || 'Failed to search YouTube. Check your API key limit.');
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [query, apiKey]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // handled by debounce
  };

  if (checkingKey) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
        <Loader2 size={32} className="animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Youtube size={20} className="text-red-500" /> YouTube Search
          </h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded transition">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {!isApiKeySet ? (
            <div className="bg-neutral-950 p-6 rounded-lg border border-red-500/20 text-center">
              <Key size={32} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-white font-medium mb-2">API Key Required</h3>
              <p className="text-sm text-neutral-400 mb-6">
                To use YouTube search, please provide a YouTube Data API v3 key. It will be securely stored in Firebase under the config collection.
              </p>
              
              {isHost ? (
                <form onSubmit={handleSaveKey} className="max-w-xs mx-auto space-y-3">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 transition text-center"
                    required
                  />
                  <button type="submit" className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">
                    Save Key to Firebase
                  </button>
                </form>
              ) : (
                <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded">
                  Only the Host can set up the YouTube API key initially.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search YouTube videos..."
                  className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-red-500 transition"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center justify-center transition disabled:opacity-50"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
              </form>
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                {results.map((video, index) => (
                  <button 
                    key={`${video.id}-${index}`} 
                    onClick={() => {
                      onAdd(`https://www.youtube.com/watch?v=${video.id}`);
                      onClose();
                    }}
                    className="w-full text-left flex items-center gap-4 p-3 bg-neutral-950 rounded-lg hover:bg-neutral-800 transition group border border-white/5"
                  >
                    <img src={video.thumbnail} alt={video.title} className="w-32 h-18 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate" dangerouslySetInnerHTML={{ __html: video.title }} />
                      <p className="text-xs text-neutral-400 mt-1">{video.channelTitle}</p>
                    </div>
                    <div
                      className="p-2 bg-red-600/10 text-red-500 rounded-full transition group-hover:bg-red-600 group-hover:text-white shrink-0"
                      title="Add to Playlist"
                    >
                      <Plus size={20} />
                    </div>
                  </button>
                ))}
                
                {results.length === 0 && !loading && query && !error && (
                  <div className="text-center text-neutral-500 py-8">
                    No results found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
