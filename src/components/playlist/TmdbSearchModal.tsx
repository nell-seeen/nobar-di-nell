import React, { useState } from 'react';
import { X, Search, Film, Play, Plus, Video } from 'lucide-react';
import { searchTmdbMovies, getMovieEmbedStreamUrl, fetchMovieVideos } from '../../services/tmdbService';

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
      const data = await searchTmdbMovies(query);
      setResults(data?.results || []);
    } catch (err) {
      console.error(err);
      alert('Gagal mencari film');
    } finally {
      setLoading(false);
    }
  };

  // Add Full Movie Embed to room playlist (Stream like Tianetflix)
  const handleSelectFullMovie = (movie: any) => {
    const streamUrl = getMovieEmbedStreamUrl(movie.id);
    const thumb = movie.backdrop_path || movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}` 
      : '';
    
    onSelect(streamUrl, `${movie.title} (Full Movie)`, thumb);
  };

  // Add Trailer to room playlist
  const handleSelectTrailer = async (movie: any) => {
    setAddingId(movie.id);
    try {
      const data = await fetchMovieVideos(movie.id);
      
      let videoUrl = '';
      if (data?.results && data.results.length > 0) {
        const trailer = data.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || data.results[0];
        if (trailer && trailer.site === 'YouTube') {
          videoUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
      }

      if (!videoUrl) {
        videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`;
      }

      const thumb = movie.backdrop_path || movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}` 
        : '';

      onSelect(videoUrl, `${movie.title} (Trailer)`, thumb);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil trailer');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="text-red-500" size={22} />
            <h2 className="text-lg font-bold text-white">Cari Film TMDB (Full Movie / Trailer)</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-neutral-400 hover:text-white">
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
              placeholder="Cari judul film Indonesia atau internasional..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-black/70 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white text-sm outline-none focus:border-red-500 transition"
              autoFocus
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !query.trim()} 
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition shadow-md"
          >
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>
        
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-neutral-400">Mencari di katalog TMDB...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              <Film className="mx-auto mb-4 opacity-40 text-neutral-400" size={48} />
              <p className="font-medium text-neutral-300">Cari film untuk diputar di watch room bersama.</p>
              <p className="text-xs text-neutral-500 mt-1">Anda dapat memutar Full Movie (Stream Embed) atau Trailer langsung di room!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {results.map(movie => (
                <div 
                  key={movie.id} 
                  className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden group flex flex-col hover:border-red-500/30 transition"
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
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 gap-1.5">
                      <button 
                        onClick={() => handleSelectFullMovie(movie)}
                        className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition shadow"
                      >
                        <Play size={12} fill="currentColor" /> Full Movie (Nobar)
                      </button>

                      <button 
                        onClick={() => handleSelectTrailer(movie)}
                        disabled={addingId === movie.id}
                        className="w-full py-1.5 bg-white/15 hover:bg-white/25 text-white text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Video size={12} /> {addingId === movie.id ? 'Memuat...' : 'Trailer'}
                      </button>
                    </div>

                    <div className="absolute top-2 right-2 bg-black/75 backdrop-blur text-[10px] font-bold px-1.5 py-0.5 rounded text-yellow-400 border border-white/10">
                      ★ {(movie.vote_average || 0).toFixed(1)}
                    </div>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-xs line-clamp-1 text-white" title={movie.title}>{movie.title}</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{movie.release_date?.substring(0, 4) || 'Unknown'}</p>
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
