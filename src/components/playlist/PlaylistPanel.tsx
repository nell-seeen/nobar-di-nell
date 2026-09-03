import React, { useState } from 'react';
import { usePlaylist } from '../../hooks/usePlaylist';
import { usePlaybackStore } from '../../store/playbackStore';
import { sendPlaybackCommand } from '../../services/playbackService';
import { updatePlaylistOrder, votePlaylistItem } from '../../services/playlistService';
import { useRoomStore } from '../../store/roomStore';
import { useAuth } from '../../hooks/useAuth';
import { detectMediaType } from '../../utils/helpers';
import { Play, Trash2, Plus, Music, Video, Link as LinkIcon, GripVertical, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import YoutubeSearchModal from './YoutubeSearchModal';

interface PlaylistPanelProps {
  roomId: string;
  isHost: boolean;
}

interface SortablePlaylistItemProps {
  key?: any;
  item: any;
  index: number;
  isPlaying: boolean;
  hasControl: boolean;
  hasPlaybackControl: boolean;
  onPlay: (index: number) => void;
  onRemove: (id: string) => void;
  onVote: (itemId: string, voteValue: 1 | -1 | 0) => void;
  userVote: number;
}

function SortablePlaylistItem({ item, index, isPlaying, hasControl, hasPlaybackControl, onPlay, onRemove, onVote, userVote }: SortablePlaylistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={twMerge(
        clsx("p-3 flex items-center gap-3 group transition-colors relative bg-neutral-900 border-b border-white/5", 
          isPlaying ? "bg-red-500/10" : "hover:bg-neutral-800/50",
          isDragging && "opacity-50"
        )
      )}
    >
      {hasControl && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-300">
          <GripVertical size={16} />
        </div>
      )}
      
      <button 
        onClick={() => onPlay(index)}
        disabled={!hasPlaybackControl}
        className={clsx(
          "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 transition",
          isPlaying ? "text-red-500" : "text-neutral-500 group-hover:text-white group-hover:bg-white/10",
          !hasPlaybackControl && !isPlaying && "cursor-default group-hover:bg-transparent group-hover:text-neutral-500"
        )}
      >
        {isPlaying ? <Play size={16} fill="currentColor" /> : (item.mediaType === 'audio' ? <Music size={16} /> : <Video size={16} />)}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={clsx("text-sm truncate font-medium", isPlaying ? "text-red-400" : "text-neutral-200")}>
          {item.title}
        </p>
        <p className="text-xs text-neutral-500 truncate">{item.url}</p>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center mr-2">
          <button onClick={() => onVote(item.id, userVote === 1 ? 0 : 1)} className={clsx("p-1 transition-colors rounded", userVote === 1 ? "text-green-500" : "text-neutral-500 hover:text-green-400")}>
            <ChevronUp size={14} />
          </button>
          <span className="text-xs font-mono font-medium text-neutral-400">{item.voteScore || 0}</span>
          <button onClick={() => onVote(item.id, userVote === -1 ? 0 : -1)} className={clsx("p-1 transition-colors rounded", userVote === -1 ? "text-red-500" : "text-neutral-500 hover:text-red-400")}>
            <ChevronDown size={14} />
          </button>
        </div>

        {hasControl && (
          <button 
            onClick={() => onRemove(item.id)}
            className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-2"
            title="Remove"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlaylistPanel({ roomId, isHost }: PlaylistPanelProps) {
  const { items, addToPlaylist, removeFromPlaylist } = usePlaylist(roomId);
  const { playbackState } = usePlaybackStore();
  const { room } = useRoomStore();
  const { user } = useAuth();
  
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  
  const hasControl = true; // Overridden to allow all users to add videos
  const hasPlaybackControl = true; // Overridden to allow all users to control playback

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !user || !hasControl) return;
    
    // Basic validation
    if (!newUrl.startsWith('http')) {
      alert("Must be a valid URL starting with http:// or https://");
      return;
    }

    const type = detectMediaType(newUrl);
    
    await addToPlaylist(roomId, {
      title: newTitle.trim() || 'Untitled Media',
      url: newUrl.trim(),
      mediaType: type,
      duration: 0,
      thumbnail: '',
      addedBy: user.uid,
      order: items.length
    });
    
    setNewUrl('');
    setNewTitle('');
    setIsAdding(false);
  };

  const handlePlayItem = (index: number) => {
    if (!hasPlaybackControl || !user || !playbackState) return;
    const item = items[index];
    sendPlaybackCommand(roomId, 'CHANGE_MEDIA', {
      mediaUrl: item.url,
      mediaType: item.mediaType,
      currentIndex: index,
      position: 0,
      isPlaying: true
    }, playbackState.playbackVersion, user.uid);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newOrder = arrayMove(items, oldIndex, newIndex) as any[];
      
      // Update in firestore
      const updates = newOrder.map((item, idx) => ({ id: item.id, order: idx }));
      await updatePlaylistOrder(roomId, updates);
    }
  };

  const handleVote = async (itemId: string, voteValue: 1 | -1 | 0) => {
    if (!user) return;
    await votePlaylistItem(roomId, itemId, user.uid, voteValue);
  };

  // Sort items combining manual order and vote score if needed. By default we keep it purely manual for drag and drop predictability.
  // Actually, if we use drag and drop, sorting by voteScore will conflict with manual sorting. 
  // We'll let the user decide manually via drag and drop, votes are just an indicator.
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-neutral-900 rounded-lg border border-white/5 overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-medium">Playlist</h3>
        {hasControl && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSearchingYoutube(true)}
              className="text-neutral-400 hover:text-red-500 transition p-1"
              title="Search YouTube"
            >
              <Search size={18} />
            </button>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="text-neutral-400 hover:text-white transition p-1"
              title="Add Direct URL"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-neutral-800/50 border-b border-white/5 space-y-3">
          <input 
            type="text" 
            placeholder="Title (optional)" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-neutral-950 text-white text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-red-500"
          />
          <input 
            type="url" 
            required
            placeholder="Direct Media URL (.mp4, .m3u8, etc)" 
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full bg-neutral-950 text-white text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition">Cancel</button>
            <button type="submit" className="px-3 py-1.5 text-xs bg-white text-black font-medium rounded hover:bg-neutral-200 transition">Add Media</button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {sortedItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-6 text-center space-y-2">
            <LinkIcon size={32} className="opacity-50" />
            <p className="text-sm">Playlist is empty</p>
            {hasControl && <p className="text-xs">Click + to add direct media URLs</p>}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col">
                {sortedItems.map((item, idx) => (
                  <SortablePlaylistItem 
                    key={item.id}
                    item={item}
                    index={idx}
                    isPlaying={playbackState?.currentIndex === idx}
                    hasControl={hasControl}
                    hasPlaybackControl={hasPlaybackControl}
                    onPlay={handlePlayItem}
                    onRemove={(id) => removeFromPlaylist(roomId, id)}
                    onVote={handleVote}
                    userVote={user ? (item.votes?.[user.uid] || 0) : 0}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {isSearchingYoutube && (
        <YoutubeSearchModal 
          isHost={isHost}
          onClose={() => setIsSearchingYoutube(false)} 
          onAdd={async (url) => {
            if (!user) return;
            await addToPlaylist(roomId, {
              title: 'YouTube Video',
              url: url,
              mediaType: 'youtube',
              duration: 0,
              thumbnail: '',
              addedBy: user.uid,
              order: items.length
            });
          }} 
        />
      )}
    </div>
  );
}
