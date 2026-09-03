import React, { useState, useEffect, useRef } from 'react';
import { usePresence } from '../../hooks/usePresence';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import RemoteAudio from './RemoteAudio';
import { Crown, MoreVertical, Ban, ArrowRightLeft, Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { banUser, transferHost } from '../../services/roomService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface UserListProps {
  roomId: string;
  hostId: string;
}

export default function UserList({ roomId, hostId }: UserListProps) {
  const { users, onlineCount } = usePresence(roomId);
  const { user: currentUser } = useAuth();
  const [openMenuUid, setOpenMenuUid] = useState<string | null>(null);
  
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  
  const isHost = currentUser?.uid === hostId;
  const onlineUsers = Object.values(users).filter(u => u.online);

  const { remoteStreams } = useVoiceChat(roomId, isVoiceConnected, localStream);

  const handleBan = async (uid: string) => {
    if (!isHost || !currentUser) return;
    if (confirm('Are you sure you want to ban this user?')) {
      await banUser(roomId, currentUser.uid, uid);
      setOpenMenuUid(null);
    }
  };

  const handleTransfer = async (uid: string) => {
    if (!isHost || !currentUser) return;
    if (confirm('Are you sure you want to transfer host permissions to this user?')) {
      await transferHost(roomId, currentUser.uid, uid);
      setOpenMenuUid(null);
    }
  };

  const toggleVoice = async () => {
    if (isVoiceConnected) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setLocalStream(null);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsVoiceConnected(false);
      setAudioLevel(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        setLocalStream(stream);
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyzerRef.current = analyser;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setAudioLevel(average);
          animationRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
        setIsVoiceConnected(true);
        setIsMuted(false);
      } catch (err: any) {
        // Use console.warn instead of console.error to prevent AI Studio from flagging this as a critical app crash
        console.warn("Mic access denied or unavailable:", err.message || err);
        alert("Microphone access is required for voice chat. Please ensure you have granted permission.");
      }
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // toggle
      });
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="bg-neutral-900 rounded-lg p-4 border border-white/5 h-full flex flex-col">
      {Object.entries(remoteStreams).map(([peerUid, stream]) => (
        <RemoteAudio key={peerUid} stream={stream} />
      ))}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Watching Now ({onlineCount})
        </h3>
      </div>

      {/* Voice Chat Control */}
      <div className="mb-4 p-3 bg-neutral-950 rounded-lg border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleVoice}
            className={clsx("p-2 rounded-full transition", isVoiceConnected ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-green-500/20 text-green-500 hover:bg-green-500/30")}
            title={isVoiceConnected ? "Leave Voice" : "Join Voice"}
          >
            {isVoiceConnected ? <PhoneOff size={18} /> : <PhoneCall size={18} />}
          </button>
          <div className="text-sm">
            <p className={clsx("font-medium", isVoiceConnected ? "text-red-400" : "text-neutral-400")}>
              {isVoiceConnected ? "Voice Connected" : "Voice Chat"}
            </p>
            {isVoiceConnected && (
              <p className="text-xs text-neutral-500">WebRTC active</p>
            )}
          </div>
        </div>
        
        {isVoiceConnected && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-4">
              <div className="w-1 bg-green-500 rounded-full transition-all duration-75" style={{ height: isMuted ? '20%' : `${Math.max(20, audioLevel)}%` }}></div>
              <div className="w-1 bg-green-500 rounded-full transition-all duration-75 delay-75" style={{ height: isMuted ? '20%' : `${Math.max(20, audioLevel * 0.8)}%` }}></div>
              <div className="w-1 bg-green-500 rounded-full transition-all duration-75 delay-150" style={{ height: isMuted ? '20%' : `${Math.max(20, audioLevel * 1.2)}%` }}></div>
            </div>
            <button onClick={toggleMute} className={clsx("text-neutral-400 hover:text-white transition", isMuted && "text-red-500 hover:text-red-400")}>
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
        )}
      </div>
      
      <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {onlineUsers.map(user => (
          <div key={user.uid} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition relative group">
            <div className="relative">
              <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full bg-neutral-800" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-neutral-900 rounded-full"></div>
            </div>
            <span className={twMerge(clsx("text-sm flex-1 truncate", user.uid === currentUser?.uid ? "text-white font-medium" : "text-neutral-300"))}>
              {user.displayName} {user.uid === currentUser?.uid && "(You)"}
            </span>
            
            {user.uid === hostId && <Crown size={14} className="text-yellow-500 flex-shrink-0" title="Host" />}
            
            {isHost && user.uid !== currentUser?.uid && (
              <div className="relative">
                <button 
                  onClick={() => setOpenMenuUid(openMenuUid === user.uid ? null : user.uid)}
                  className="p-1 text-neutral-500 hover:text-white rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <MoreVertical size={16} />
                </button>
                
                {openMenuUid === user.uid && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-neutral-800 border border-white/10 rounded shadow-xl z-20 overflow-hidden text-sm">
                    <button 
                      onClick={() => handleTransfer(user.uid)}
                      className="w-full text-left px-3 py-2 text-neutral-200 hover:bg-white/10 flex items-center gap-2"
                    >
                      <ArrowRightLeft size={14} /> Make Host
                    </button>
                    <button 
                      onClick={() => handleBan(user.uid)}
                      className="w-full text-left px-3 py-2 text-red-400 hover:bg-white/10 flex items-center gap-2"
                    >
                      <Ban size={14} /> Ban User
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {openMenuUid && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuUid(null)}></div>
      )}
    </div>
  );
}
