import React, { useEffect, useState } from 'react';
import { Film, Play, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { saveToLibrary } from '../../services/libraryService';

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
  const { user } = useAuth();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch('/api/movies/explore');
        const data = await res.json();
        if (data.results) {
          setMovies(data.results.slice(0, 12));
        }
      } catch (err) {
        console.error("Failed to fetch TMDB movies", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const handleAddToLibrary = async (movie: TmdbMovie) => {
    if (!user) return;
    setSavingId(movie.id);
    try {
      // We need to fetch videos to get the trailer link for this movie
      const res = await fetch(`/api/movies/${movie.id}/videos`);
      const data = await res.json();
      
      let videoUrl = '';
      if (data.results && data.results.length > 0) {
        const trailer = data.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || data.results[0];
        if (trailer && trailer.site === 'YouTube') {
          videoUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
      }

      if (!videoUrl) {
        // Fallback or placeholder, maybe a generic trailer search link
        alert(`No trailer found for ${movie.title}. Adding as metadata only.`);
        videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`;
      }

      await saveToLibrary(user.uid, {
        url: videoUrl,
        title: movie.title,
        thumbnail: `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}`,
        type: 'youtube'
      });
      alert('Added to Library!');
    } catch (err) {
      console.error(err);
      alert('Failed to add to library');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-16 flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (movies.length === 0) return null;

  return (
    <div className="mt-16">
      <header className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Film className="text-red-500" /> Film Indonesia Populer
        </h2>
        <p className="text-neutral-400 text-sm mt-1">Tambahkan film ke Library Anda untuk ditonton bersama.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <div key={movie.id} className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden group flex flex-col">
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
                  onClick={() => handleAddToLibrary(movie)}
                  disabled={savingId === movie.id}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-50 transition"
                >
                  {savingId === movie.id ? 'Menyimpan...' : (
                    <>
                      <Plus size={14} /> Ke Library
                    </>
                  )}
                </button>
              </div>
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-xs font-bold px-1.5 py-0.5 rounded text-yellow-400">
                ★ {movie.vote_average.toFixed(1)}
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm line-clamp-1" title={movie.title}>{movie.title}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{movie.release_date?.substring(0, 4)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
