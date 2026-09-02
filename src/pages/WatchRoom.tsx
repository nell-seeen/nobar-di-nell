import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useRoom } from '../hooks/useRoom';
import { usePlayback } from '../hooks/usePlayback';
import { usePresence } from '../hooks/usePresence';
import { useAuth } from '../hooks/useAuth';
import MediaPlayer from '../components/player/MediaPlayer';
import ChatPanel from '../components/chat/ChatPanel';
import UserList from '../components/users/UserList';
import PlaylistPanel from '../components/playlist/PlaylistPanel';
import RoomSettingsModal from '../components/room/RoomSettingsModal';
import ReactionLayer from '../components/chat/ReactionLayer';
import ProfileModal from '../components/profile/ProfileModal';
import AboutModal from '../components/profile/AboutModal';
import { usePlaylist } from '../hooks/usePlaylist';
import { Copy, Users, Settings, Share, MonitorPlay, Maximize2, UserCircle } from 'lucide-react';
import clsx from 'clsx';

export default function WatchRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const { room, loading: roomLoading, error: roomError, isHost } = useRoom(roomId);
  const { playbackState } = usePlayback(roomId);
  const { onlineCount, users: presenceUsers } = usePresence(roomId);
  const { items: playlist } = usePlaylist(roomId);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);

  useEffect(() => {
    // Enforcement logic
    if (room && user) {
      if (room.bannedUsers?.includes(user.uid)) {
        alert('You have been banned from this room.');
        navigate('/');
      } else if (room.locked && !isHost && !presenceUsers[user.uid]) {
        alert('This room is currently locked by the host.');
        navigate('/');
      }
    }
  }, [room, user, navigate, isHost, presenceUsers]);

  useEffect(() => {
    // Auto-host election logic
    if (room && user && presenceUsers) {
      const onlineUids = Object.values(presenceUsers)
        .filter(u => u.online)
        .map(u => u.uid)
        .sort();
      
      const hostIsOnline = onlineUids.includes(room.hostId);
      
      if (!hostIsOnline && onlineUids.length > 0) {
        const newHostUid = onlineUids[0];
        if (user.uid === newHostUid) {
          import('../services/roomService').then(({ transferHost }) => {
            transferHost(room.id, room.hostId, newHostUid).catch(console.error);
          });
        }
      }
    }
  }, [room?.hostId, presenceUsers, user]);

  if (authLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Sign in required</h1>
        <p className="text-neutral-400 mb-8 text-center max-w-sm">You must be signed in to join a watch party room.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-white text-black font-medium rounded hover:bg-neutral-200">
          Go to Home to Sign In
        </button>
      </div>
    );
  }

  if (roomLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Room...</div>;
  }

  if (roomError || !room) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
        <p className="text-neutral-400 mb-8">{roomError || "This room doesn't exist or you don't have access."}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-white text-black font-medium rounded hover:bg-neutral-200">
          Go Home
        </button>
      </div>
    );
  }

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `nobar di nell - ${room?.name || roomId}`,
          text: 'Join my nobar di nell watch party!',
          url: url,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError' && !err.message?.toLowerCase().includes('canceled')) {
          console.error('Share failed', err);
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className={clsx("min-h-screen text-white flex flex-col relative overflow-hidden transition-colors duration-500", theaterMode ? "bg-black" : "bg-neutral-950")}>
      <ReactionLayer roomId={roomId!} />
      
      {/* Navbar */}
      <header className={clsx("h-14 border-b border-white/10 flex items-center justify-between px-4 lg:px-6 shrink-0 transition-colors duration-500", theaterMode ? "bg-black border-transparent" : "bg-black")}>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowAbout(true)} className="text-lg font-bold tracking-tight text-white hover:text-pink-400 transition-colors">nobar di nell</button>
          {!theaterMode && (
            <>
              <div className="h-4 w-px bg-white/20"></div>
              <span className="font-medium text-neutral-200">{room.name}</span>
              <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded font-mono border border-white/5">
                {roomId}
              </span>
              <a href="https://www.instagram.com/tianshirrr_?igsi=MXF1NjVuOWswdm95Zg==" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:opacity-90 transition-opacity text-white text-[10px] font-medium shadow-lg shadow-pink-500/20 ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                IG
              </a>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={() => setTheaterMode(!theaterMode)}
            className={clsx("flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full transition", theaterMode ? "bg-white/20 text-white" : "bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white")}
            title="Theater Mode"
          >
            {theaterMode ? <MonitorPlay size={14} className="text-red-500" /> : <Maximize2 size={14} />}
            <span className="hidden sm:inline">{theaterMode ? 'Lights On' : 'Theater Mode'}</span>
          </button>
          <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <Users size={14} />
            {onlineCount} watching
          </div>
          <button onClick={handleShare} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Share Link">
            {navigator.share ? <Share size={16} /> : <Copy size={16} />}
          </button>
          
          <button onClick={() => setShowProfile(true)} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Profile">
            {user.photoURL ? (
              <img src={user.photoURL} alt="profile" className="w-5 h-5 rounded-full" />
            ) : (
              <UserCircle size={16} />
            )}
          </button>

          {isHost && (
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition" 
              title="Settings"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left/Center Column */}
        <div className={clsx("flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar transition-all duration-500", theaterMode ? "p-0 z-10" : "p-4 lg:p-6 gap-6")}>
          {/* Video Player */}
          <section className={clsx("w-full mx-auto shadow-black/50 overflow-hidden transition-all duration-500", theaterMode ? "max-w-full h-full shadow-none rounded-none border-none ring-0 flex flex-col" : "max-w-[1200px] shadow-2xl rounded-lg border border-white/5 ring-1 ring-white/10")}>
            <MediaPlayer roomId={roomId!} isHost={isHost} playlist={playlist} isTheater={theaterMode} />
          </section>

          {/* Under Player Content */}
          <div className={clsx("w-full max-w-[1200px] mx-auto grid-cols-1 lg:grid-cols-3 gap-6 pb-12", theaterMode ? "hidden" : "grid")}>
            <div className="lg:col-span-2">
              <PlaylistPanel roomId={roomId!} isHost={isHost} />
            </div>
            <div className="lg:col-span-1">
              <UserList roomId={roomId!} hostId={room.hostId} />
            </div>
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className={clsx("transition-all duration-500 z-20 shrink-0", theaterMode ? "absolute right-0 top-0 bottom-0 transform translate-x-full opacity-0 pointer-events-none" : "relative transform translate-x-0 opacity-100 w-full md:w-80 h-full")}>
          <ChatPanel roomId={roomId!} />
        </div>
      </div>

      {showSettings && room && (
        <RoomSettingsModal room={room} onClose={() => setShowSettings(false)} />
      )}
      
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}

      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
}
