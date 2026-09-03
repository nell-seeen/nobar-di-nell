import React, { useEffect, useState } from 'react';
import { Compass, Users, Sparkles, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getPublicRooms } from '../services/roomService';
import { RoomDocument } from '../store/roomStore';
import TmdbExploreSection from '../components/tmdb/TmdbExploreSection';

export default function Explore() {
  const [rooms, setRooms] = useState<RoomDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getPublicRooms();
        setRooms(data);
      } catch (err: any) {
        console.error('Failed to fetch rooms', err);
        if (err.message?.includes('unavailable') || err.message?.includes('network')) {
          setRooms([]);
          // We could set an error state here, but logging is fine for now
          alert("Could not connect to database. Please check your internet connection and disable any Adblockers or Brave Shields that might block Firestore.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-white">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Compass className="text-red-500" /> Explore Public Rooms
        </h1>
        <p className="text-neutral-400">Discover active watch parties and join the community.</p>
      </header>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <Sparkles className="mx-auto mb-4 opacity-50" size={48} />
          <h2 className="text-xl font-bold">No public rooms active</h2>
          <p>Create a room from the Home page to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div 
              key={room.id} 
              onClick={() => navigate(`/watch/${room.id}`)}
              className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-red-500/50 transition cursor-pointer group"
            >
              <div className="aspect-video bg-neutral-800 relative">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/10 to-black/40">
                  <Sparkles className="text-white/20 group-hover:text-red-500/50 transition duration-500 group-hover:scale-110" size={48} />
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <span className="bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> LIVE
                  </span>
                  <span className="bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1">
                    <Users size={12} /> Public
                  </span>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg mb-1 truncate">{room.name}</h3>
                  <p className="text-sm text-neutral-400 truncate">ID: {room.id}</p>
                </div>
                <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition shrink-0 group-hover:bg-red-500 group-hover:text-white">
                  <LogIn size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <TmdbExploreSection />
    </div>
  );
}
