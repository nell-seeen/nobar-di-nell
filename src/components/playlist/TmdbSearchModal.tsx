import React, { useState } from 'react';
import { X, Search, Film, Play, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface TmdbSearchModalProps {
  onClose: () => void;
  onSelect: (url: string, title: string, thumbnail: string) => void;
}

export default function TmdbSearchModal({ onClose, onSelect }: TmdbSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/catalog/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      alert('Gagal mencari film');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (movie: any) => {
    setAddingId(movie.id);
    try {
      const res = await fetch(`/api/catalog/${movie.id}/videos`);
      const data = await res.json();
      
      let videoUrl = '';
      if (data.results && data.results.length > 0) {
        const trailer = data.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || data.results[0];
        if (trailer && trailer.site === 'YouTube') {
          videoUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
      }

      if (!videoUrl) {
        alert(`Trailer tidak ditemukan untuk ${movie.title}. Hanya menambahkan metadata.`);
        videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`;
      }

      onSelect(
        videoUrl,
        movie.title,
        movie.backdrop_path || movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}` : ''
      );
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil trailer film');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="text-red-500" /> Cari Film Indonesia (TMDB)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="p-4 border-b border-white/10 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-neutral-500" />
            </div>
            <input
              type="text"
              placeholder="Cari judul film..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:border-red-500 transition"
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading || !query.trim()} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium disabled:opacity-50 transition">
            Cari
          </button>
        </form>
        
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              <Film className="mx-auto mb-4 opacity-50" size={48} />
              <p>Cari film untuk ditambahkan ke playlist.</p>
              <p className="text-sm mt-1">Hasil pencarian otomatis difilter untuk film berbahasa Indonesia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {results.map(movie => (
                <div 
                  key={movie.id} 
                  className="bg-black border border-white/5 rounded-xl overflow-hidden group flex flex-col"
                >
                  <div className="aspect-[2/3] relative bg-neutral-800">
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                        alt={movie.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="text-neutral-600" size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <button 
                        onClick={() => handleSelect(movie)}
                        disabled={addingId === movie.id}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50 transition"
                      >
                        {addingId === movie.id ? 'Loading...' : (
                          <>
                            <Plus size={14} /> Ke Playlist
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h4 className="font-bold text-sm line-clamp-2 text-white">{movie.title}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{movie.release_date?.substring(0, 4)}</p>
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
