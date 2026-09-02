import React from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SyncIndicatorProps {
  status: 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'BUFFERING' | 'AUTOPLAY_BLOCKED';
  isHost: boolean;
  onSyncClick?: () => void;
}

export default function SyncIndicator({ status, isHost, onSyncClick }: SyncIndicatorProps) {
  if (isHost) return null; // Host doesn't need to see sync status generally, they dictate it
  
  const getStatusDisplay = () => {
    switch (status) {
      case 'SYNCED':
        return { color: 'text-green-400', bg: 'bg-green-400/20', text: 'LIVE SYNC', icon: <Wifi size={12} /> };
      case 'SYNCING':
        return { color: 'text-yellow-400', bg: 'bg-yellow-400/20', text: 'SYNCING...', icon: <RefreshCw size={12} className="animate-spin" /> };
      case 'BUFFERING':
        return { color: 'text-blue-400', bg: 'bg-blue-400/20', text: 'BUFFERING', icon: <RefreshCw size={12} className="animate-spin" /> };
      case 'OFFLINE':
      case 'AUTOPLAY_BLOCKED':
        return { color: 'text-red-400', bg: 'bg-red-400/20', text: 'OFFLINE', icon: <WifiOff size={12} /> };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-400/20', text: 'UNKNOWN', icon: null };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
      {(status === 'OFFLINE' || status === 'AUTOPLAY_BLOCKED') && (
        <button 
          onClick={onSyncClick}
          className="bg-black/60 hover:bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded backdrop-blur border border-white/10 transition flex items-center gap-2"
        >
          <RefreshCw size={12} />
          SYNC NOW
        </button>
      )}
      <div className={twMerge(clsx("flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur border border-white/10 text-xs font-bold tracking-wider", display.color))}>
        {display.icon}
        {display.text}
      </div>
    </div>
  );
}
