import React, { useEffect, useState } from 'react';
import { Film, Play, Plus, X, Sparkles, Check, ExternalLink, Server, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { saveToLibrary } from '../../services/libraryService';
import { fetchIndonesianMovies, getMovieEmbedStreamUrl, STREAM_SERVERS } from '../../services/tmdbService';

interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  overview: string;
}

export default function TmdbExploreSection() {
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [activeWatchMovie, setActiveWatchMovie] = useState<TmdbMovie | null>(null);
  const [selectedServer, setSelectedServer] = useState<string>(STREAM_SERVERS[0].id);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await fetchIndonesianMovies();
        if (data?.results) {
          setMovies(data.results.slice(0, 18));
        }
      } catch (err) {
        console.error("Failed to fetch TMDB movies", err);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, []);

  const handleAddToLibrary = async (movie: TmdbMovie, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    setSavingId(movie.id);
    try {
      const streamUrl = getMovieEmbedStreamUrl(movie.id, selectedServer);

      await saveToLibrary(user.uid, {
        url: streamUrl,
        title: movie.title,
        thumbnail: `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}`,
        type: 'embed'
      });
      setSavedIds(prev => [...prev, movie.id]);
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan ke library');
    } finally {
      setSavingId(null);
    }
  };

  const currentStreamUrl = activeWatchMovie 
    ? getMovieEmbedStreamUrl(activeWatchMovie.id, selectedServer)
    : '';

  if (loading) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-400">Memuat koleksi film dari Firebase & TMDB...</p>
      </div>
    );
  }

  if (movies.length === 0) return null;

  return (
    <div className="mt-16">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Film className="text-red-500" /> Film Indonesia Populer (Full Movie)
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center gap-1">
              <Sparkles size={10} /> Multi-Server Stream
            </span>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            Klik film untuk menonton langsung (*Full Movie stream*) atau simpan ke Library untuk nobar.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map((movie) => {
          const isSaved = savedIds.includes(movie.id);
          return (
            <div 
              key={movie.id} 
              onClick={() => setActiveWatchMovie(movie)}
              className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden group flex flex-col cursor-pointer hover:border-red-500/40 transition-all hover:scale-[1.02] duration-200"
            >
              <div className="aspect-[2/3] relative bg-neutral-800">
                {movie.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    alt={movie.title} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="text-neutral-600" size={32} />
                  </div>
                )}
                
                {/* Hover overlay with action buttons */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveWatchMovie(movie);
                    }}
                    className="w-full py-2 bg-white text-black text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition shadow-lg"
                  >
                    <Play size={14} fill="currentColor" /> Nonton Film
                  </button>
                  
                  <button 
                    onClick={(e) => handleAddToLibrary(movie, e)}
                    disabled={savingId === movie.id || isSaved}
                    className={`w-full py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition ${
                      isSaved 
                        ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10'
                    }`}
                  >
                    {savingId === movie.id ? (
                      'Menyimpan...'
                    ) : isSaved ? (
                      <><Check size={12} /> Di Library</>
                    ) : (
                      <><Plus size={12} /> Ke Library</>
                    )}
                  </button>
                </div>

                <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md text-[11px] font-bold px-1.5 py-0.5 rounded-md text-yellow-400 border border-white/10">
                  ★ {(movie.vote_average || 0).toFixed(1)}
                </div>
              </div>

              <div className="p-3 flex flex-col flex-1 justify-between">
                <h3 className="font-bold text-sm line-clamp-1 text-white group-hover:text-red-400 transition" title={movie.title}>
                  {movie.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-neutral-400 mt-1">
                  <span>{movie.release_date ? movie.release_date.substring(0, 4) : 'ID Movie'}</span>
                  <span className="text-[10px] text-red-400 font-medium">Stream Ready</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Movie Player Modal */}
      {activeWatchMovie && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full max-w-5xl bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex flex-wrap items-center justify-between bg-neutral-900/80 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Film className="text-red-500 flex-shrink-0" size={20} />
                <h3 className="font-bold text-sm sm:text-base text-white truncate">{activeWatchMovie.title}</h3>
                <span className="text-[10px] bg-red-600/30 text-red-400 px-2 py-0.5 rounded font-mono hidden sm:inline">
                  Full Movie
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Open in New Tab Button */}
                <a
                  href={currentStreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-white/15 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                  title="Buka di tab baru jika iframe preview memblokir sandbox"
                >
                  <ExternalLink size={13} /> Buka di Tab Baru
                </a>

                <button 
                  onClick={() => setActiveWatchMovie(null)} 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Server Selector Bar */}
            <div className="px-4 py-2 bg-neutral-900/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-400">
                <Server size={14} className="text-red-400" />
                <span className="font-medium text-white">Ganti Server:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STREAM_SERVERS.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => setSelectedServer(server.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                      selectedServer === server.id
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    {server.name.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Player Iframe */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              <iframe
                key={currentStreamUrl}
                src={currentStreamUrl}
                className="w-full h-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              />
            </div>

            {/* Sandbox Notice & Actions */}
            <div className="p-3 sm:p-4 bg-neutral-900/80 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-yellow-500 flex-shrink-0" />
                <span>
                  Jika muncul tulisan <em>"sandboxed frame"</em>, silakan ganti ke <strong>Server 1 / 2</strong> atau klik tombol <strong>"Buka di Tab Baru"</strong> di atas.
                </span>
              </div>
              <button 
                onClick={(e) => handleAddToLibrary(activeWatchMovie, e)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg flex items-center justify-center gap-1 transition self-end sm:self-auto flex-shrink-0"
              >
                <Plus size={14} /> Simpan ke Library
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
