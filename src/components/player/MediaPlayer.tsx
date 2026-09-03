import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import ReactPlayer from 'react-player';
import { SyncEngine } from '../../sync/SyncEngine';
import { usePlaybackStore, PlaybackStateDoc } from '../../store/playbackStore';
import { useRoomStore } from '../../store/roomStore';
import { sendPlaybackCommand } from '../../services/playbackService';
import { useAuth } from '../../hooks/useAuth';
import { PlaylistItem } from '../../services/playlistService';
import PlayerControls from './PlayerControls';
import SyncIndicator from './SyncIndicator';
import { detectMediaType } from '../../utils/helpers';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MediaPlayerProps {
  roomId: string;
  isHost: boolean;
  playlist: PlaylistItem[];
  isTheater?: boolean;
}

export default function MediaPlayer({ roomId, isHost, playlist, isTheater = false }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reactPlayerRef = useRef<ReactPlayer>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const { user } = useAuth();
  const { playbackState } = usePlaybackStore();
  const { room } = useRoomStore();
  
  const hasControl = true;
  
  const [syncEngine, setSyncEngine] = useState<SyncEngine | null>(null);
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SYNCING' | 'OFFLINE' | 'BUFFERING' | 'AUTOPLAY_BLOCKED'>('OFFLINE');
  const [localPlaying, setLocalPlaying] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const mediaType = playbackState?.mediaType || detectMediaType(playbackState?.mediaUrl || '');
  const isVideo = mediaType !== 'audio' && mediaType !== 'youtube';
  const isYoutube = mediaType === 'youtube';

  const getMediaTime = () => {
    if (isYoutube && reactPlayerRef.current) {
      return (reactPlayerRef.current as any).getCurrentTime?.() || 0;
    }
    const mediaRef = mediaType === 'audio' ? audioRef : videoRef;
    return mediaRef.current?.currentTime || 0;
  };

  const playMedia = async () => {
    setLocalPlaying(true);
    setSyncStatus('SYNCED');
    if (!isYoutube) {
      const mediaRef = mediaType === 'audio' ? audioRef : videoRef;
      if (mediaRef.current) {
        try {
          await mediaRef.current.play();
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn("Autoplay blocked:", err);
            setSyncStatus('AUTOPLAY_BLOCKED');
            setLocalPlaying(false);
          }
        }
      }
    }
  };

  const pauseMedia = () => {
    setLocalPlaying(false);
    if (!isYoutube) {
      const mediaRef = mediaType === 'audio' ? audioRef : videoRef;
      if (mediaRef.current) mediaRef.current.pause();
    }
  };

  const seekMedia = (position: number) => {
    if (isYoutube && reactPlayerRef.current) {
      const currentTime = (reactPlayerRef.current as any).getCurrentTime?.() || 0;
      if (Math.abs(currentTime - position) > 0.5) {
        (reactPlayerRef.current as any).seekTo?.(position, 'seconds');
      }
    } else {
      const mediaRef = mediaType === 'audio' ? audioRef : videoRef;
      if (mediaRef.current && Math.abs(mediaRef.current.currentTime - position) > 0.5) {
        let target = position;
        const seekable = mediaRef.current.seekable;
        if (seekable && seekable.length > 0) {
          const start = seekable.start(0);
          const end = seekable.end(seekable.length - 1);
          if (target < start) target = start;
          if (target > end) target = end;
        }
        mediaRef.current.currentTime = target;
      }
    }
  };

  // Initialize SyncEngine
  useEffect(() => {
    if (!playbackState) return;

    const engine = new SyncEngine({
      isHost,
      getActualPosition: getMediaTime,
      onPlay: playMedia,
      onPause: pauseMedia,
      onSeek: seekMedia,
      onChangeMedia: (url, type, index) => {
        // Will be handled by React dependency changes based on playbackState
      }
    });

    setSyncEngine(engine);
    if (!isHost) {
      engine.startPeriodicSync();
    }
    
    return () => {
      engine.stopPeriodicSync();
    };
  }, [isHost, mediaType]); // Depend on mediaType to rebind methods if switching players

  // Feed Firebase state to SyncEngine
  useEffect(() => {
    if (syncEngine && playbackState) {
      syncEngine.processState(playbackState);
    }
  }, [playbackState, syncEngine]);

  // Load Media for HTML5 (HLS/Native)
  useEffect(() => {
    if (!playbackState?.mediaUrl || isYoutube) return;
    
    const mediaUrl = playbackState.mediaUrl;
    const mediaRef = mediaType === 'audio' ? audioRef : videoRef;
    
    if (!mediaRef.current) return;

    if (mediaType === 'hls') {
      const media = mediaRef.current as HTMLVideoElement;
      
      if (media.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (e.g. Safari)
        media.src = mediaUrl;
        media.load();
        if (playbackState.isPlaying) {
          media.play().catch(() => setSyncStatus('AUTOPLAY_BLOCKED'));
        }
      } else if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("fatal network error encountered, try to recover");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("fatal media error encountered, try to recover");
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setSyncStatus('OFFLINE');
                break;
            }
          }
        });

        hls.loadSource(mediaUrl);
        hls.attachMedia(media);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (playbackState.isPlaying) {
            media.play().catch(() => setSyncStatus('AUTOPLAY_BLOCKED'));
          }
        });
        hlsRef.current = hls;
      } else {
        setSyncStatus('OFFLINE'); // Unsupported
      }
    } else {
      mediaRef.current.src = mediaUrl;
      mediaRef.current.load();
      if (playbackState.isPlaying) {
        mediaRef.current.play().catch(() => setSyncStatus('AUTOPLAY_BLOCKED'));
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackState?.mediaUrl, mediaType, isYoutube]);

  // Handle Host Controls
  const handleHostPlay = useCallback(() => {
    if (!hasControl || !user || !playbackState) return;
    sendPlaybackCommand(roomId, 'PLAY', { isPlaying: true, position: getMediaTime() }, playbackState.playbackVersion, user.uid);
  }, [hasControl, user, playbackState, roomId, getMediaTime]);

  const handleHostPause = useCallback(() => {
    if (!hasControl || !user || !playbackState) return;
    sendPlaybackCommand(roomId, 'PAUSE', { isPlaying: false, position: getMediaTime() }, playbackState.playbackVersion, user.uid);
  }, [hasControl, user, playbackState, roomId, getMediaTime]);

  const handleHostSeek = useCallback((time: number) => {
    if (!hasControl || !user || !playbackState) return;
    sendPlaybackCommand(roomId, 'SEEK', { position: time }, playbackState.playbackVersion, user.uid);
  }, [hasControl, user, playbackState, roomId]);

  const handleNext = useCallback(() => {
    if (!hasControl || !user || !playbackState || !playlist.length) return;
    let nextIndex = playbackState.currentIndex + 1;
    if (nextIndex >= playlist.length) {
      nextIndex = 0; // loop or stop
    }
    const nextItem = playlist[nextIndex];
    sendPlaybackCommand(roomId, 'NEXT', {
      mediaUrl: nextItem.url,
      mediaType: nextItem.mediaType,
      currentIndex: nextIndex,
      position: 0,
      isPlaying: true
    }, playbackState.playbackVersion, user.uid);
  }, [hasControl, user, playbackState, playlist, roomId]);

  const handlePrev = useCallback(() => {
    if (!hasControl || !user || !playbackState || !playlist.length) return;
    const currentTime = getMediaTime();
    if (currentTime > 5) {
      handleHostSeek(0);
      return;
    }
    let prevIndex = playbackState.currentIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    const prevItem = playlist[prevIndex];
    sendPlaybackCommand(roomId, 'PREVIOUS', {
      mediaUrl: prevItem.url,
      mediaType: prevItem.mediaType,
      currentIndex: prevIndex,
      position: 0,
      isPlaying: true
    }, playbackState.playbackVersion, user.uid);
  }, [hasControl, user, playbackState, playlist, roomId, getMediaTime, handleHostSeek]);

  // Periodic Host Sync heartbeat
  useEffect(() => {
    if (!hasControl || !localPlaying || !playbackState || !user) return;
    
    // Broadcast exact media time every 5 seconds so viewers can correct any drift
    const interval = setInterval(() => {
      const currentTime = getMediaTime();
      if (currentTime > 0) {
        sendPlaybackCommand(
          roomId, 
          'SYNC_TIME', 
          { isPlaying: true, position: currentTime }, 
          playbackState.playbackVersion, 
          user.uid
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [hasControl, localPlaying, playbackState, roomId, user, getMediaTime]);

  // Media Session API Setup
  useEffect(() => {
    if ('mediaSession' in navigator && playbackState) {
      const currentItem = playlist[playbackState.currentIndex];
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentItem?.title || 'Unknown Media',
        artist: 'nobar di nell',
        album: `Watch Party: ${room?.name || roomId}`,
        artwork: currentItem?.thumbnail ? [
          { src: currentItem.thumbnail, sizes: '512x512', type: 'image/jpeg' }
        ] : []
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (hasControl) handleHostPlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (hasControl) handleHostPause();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (hasControl && details.seekTime) handleHostSeek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (hasControl) handlePrev();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (hasControl) handleNext();
      });
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, [playbackState, playlist, hasControl, handleHostPlay, handleHostPause, handleHostSeek, handlePrev, handleNext, room, roomId]);

  // Time update for local UI progress bar
  const onTimeUpdate = () => {
    setLocalTime(getMediaTime());
  };

  const onEnded = () => {
    if (isHost) {
      handleNext();
    }
  };

  const manualSync = () => {
    setSyncStatus('SYNCING');
    if (syncEngine) {
      const target = syncEngine.calculateTargetPosition();
      seekMedia(target);
      if (playbackState?.isPlaying) {
        playMedia();
      }
    }
  };

  return (
    <div className={twMerge(clsx("relative w-full bg-black overflow-hidden flex flex-col items-center justify-center min-h-[300px] group", isTheater ? "h-full w-full" : "aspect-video rounded-lg"))}>
      {!playbackState?.mediaUrl ? (
        <div className="text-gray-400 flex flex-col items-center">
          <span className="text-4xl mb-2">🎬</span>
          <p>No media selected</p>
        </div>
      ) : (
        <>
          {isYoutube ? (
            <div className="relative w-full h-full">
              <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={() => {
                  if (hasControl) {
                    localPlaying ? handleHostPause() : handleHostPlay();
                  }
                }}
              />
              <ReactPlayer
                ref={reactPlayerRef}
                url={playbackState.mediaUrl}
                playing={localPlaying}
                width="100%"
                height="100%"
                onProgress={(p) => setLocalTime(p.playedSeconds)}
                onDuration={setDuration}
                onEnded={onEnded}
                onBuffer={() => setSyncStatus('BUFFERING')}
                onPlay={() => setSyncStatus('SYNCED')}
                config={{
                  youtube: {
                    playerVars: { 
                      controls: 0,
                      disablekb: 1,
                      modestbranding: 1,
                      rel: 0
                    }
                  }
                }}
              />
            </div>
          ) : isVideo ? (
            <video
              ref={videoRef}
              crossOrigin="anonymous"
              className="w-full h-full object-contain bg-black"
              onTimeUpdate={onTimeUpdate}
              onDurationChange={(e) => setDuration(e.currentTarget.duration)}
              onEnded={onEnded}
              onWaiting={() => setSyncStatus('BUFFERING')}
              onPlaying={() => setSyncStatus('SYNCED')}
              onClick={() => {
                if (hasControl) {
                  localPlaying ? handleHostPause() : handleHostPlay();
                }
              }}
              playsInline
            />
          ) : (
            <audio
              ref={audioRef}
              onTimeUpdate={onTimeUpdate}
              onDurationChange={(e) => setDuration(e.currentTarget.duration)}
              onEnded={onEnded}
              onWaiting={() => setSyncStatus('BUFFERING')}
              onPlaying={() => setSyncStatus('SYNCED')}
            />
          )}

          {/* Autoplay Blocked Overlay */}
          {syncStatus === 'AUTOPLAY_BLOCKED' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 flex-col">
              <p className="text-white mb-4">Playback paused by browser</p>
              <button 
                onClick={manualSync}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition"
              >
                ▶ TAP TO SYNC
              </button>
            </div>
          )}

          <SyncIndicator status={syncStatus} isHost={isHost} onSyncClick={manualSync} />

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
             <PlayerControls 
               isHost={hasControl}
               isPlaying={localPlaying}
               currentTime={localTime}
               duration={duration}
               onPlay={handleHostPlay}
               onPause={handleHostPause}
               onSeek={handleHostSeek}
               onNext={handleNext}
               onPrev={handlePrev}
               mediaRef={(isYoutube ? { current: { requestPictureInPicture: () => {} } } : (mediaType === 'audio' ? audioRef : videoRef)) as any}
             />
          </div>
        </>
      )}
    </div>
  );
}
