import React, { useState } from 'react';
import { formatTime } from '../../utils/helpers';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize, PictureInPicture, Captions } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface PlayerControlsProps {
  isHost: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  mediaRef: React.RefObject<HTMLMediaElement>;
}

export default function PlayerControls({
  isHost,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  onNext,
  onPrev,
  mediaRef
}: PlayerControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);

  const togglePlay = () => {
    if (!isHost) return;
    isPlaying ? onPause() : onPlay();
  };

  const handleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.volume = val;
      setVolume(val);
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    const container = mediaRef.current?.parentElement;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePip = async () => {
    if (!mediaRef.current || !(mediaRef.current instanceof HTMLVideoElement)) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await mediaRef.current.requestPictureInPicture();
        setIsPip(true);
      }
    } catch (err) {
      console.error('PiP failed', err);
    }
  };

  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mediaRef.current) return;
    
    // Create a local object URL for the uploaded subtitle
    const url = URL.createObjectURL(file);
    
    // Clear existing tracks
    const media = mediaRef.current;
    Array.from(media.getElementsByTagName('track')).forEach(track => {
      media.removeChild(track);
    });
    
    // Add new track
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = file.name;
    track.srclang = 'en';
    track.src = url;
    track.default = true;
    media.appendChild(track);
    
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      <ProgressBar 
        currentTime={currentTime} 
        duration={duration} 
        onSeek={onSeek} 
        disabled={!isHost} 
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onPrev}
            disabled={!isHost}
            className={`text-white hover:text-gray-300 transition ${!isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isHost ? "Previous" : "Host only"}
          >
            <SkipBack size={24} />
          </button>
          
          <button 
            onClick={togglePlay}
            disabled={!isHost}
            className={`text-white hover:text-gray-300 transition ${!isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isHost ? (isPlaying ? "Pause" : "Play") : "Host only"}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
          
          <button 
            onClick={onNext}
            disabled={!isHost}
            className={`text-white hover:text-gray-300 transition ${!isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isHost ? "Next" : "Host only"}
          >
            <SkipForward size={24} />
          </button>
          
          <div className="text-white text-sm font-medium tracking-wider">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group/volume relative">
            <button onClick={handleMute} className="text-white hover:text-gray-300 transition">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-red-600 opacity-0 group-hover/volume:opacity-100 transition-opacity"
            />
          </div>
          
          <label className="text-white hover:text-gray-300 transition cursor-pointer" title="Load Subtitles (.vtt)">
            <Captions size={20} />
            <input type="file" accept=".vtt,.srt" className="hidden" onChange={handleSubtitleUpload} />
          </label>

          <button onClick={togglePip} className="text-white hover:text-gray-300 transition" title="Picture in Picture">
            <PictureInPicture size={20} />
          </button>
          
          <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
