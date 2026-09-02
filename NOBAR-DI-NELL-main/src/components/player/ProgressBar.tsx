import React, { useRef, useState, useEffect } from 'react';
import { formatTime } from '../../utils/helpers';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  disabled: boolean;
}

export default function ProgressBar({ currentTime, duration, onSeek, disabled }: ProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const progress = isDragging 
    ? dragProgress 
    : (duration > 0 ? (currentTime / duration) : 0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || duration === 0) return;
    setIsDragging(true);
    updateProgressFromEvent(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    updateProgressFromEvent(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    // Perform seek
    const newTime = dragProgress * duration;
    onSeek(newTime);
  };

  const updateProgressFromEvent = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setDragProgress(pos / rect.width);
  };

  return (
    <div className="relative w-full h-4 flex items-center group cursor-pointer"
         ref={containerRef}
         onPointerDown={handlePointerDown}
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
         onPointerCancel={handlePointerUp}>
      {/* Background track */}
      <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden transition-all group-hover:h-2">
        {/* Fill */}
        <div 
          className="h-full bg-red-600 transition-all duration-75 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      
      {/* Thumb indicator */}
      <div 
        className={`absolute h-3.5 w-3.5 bg-red-600 rounded-full transition-transform duration-75 shadow-lg shadow-black/50 ${isDragging ? 'scale-125' : 'scale-0 group-hover:scale-100'}`}
        style={{ left: `calc(${progress * 100}% - 7px)` }}
      />
    </div>
  );
}
