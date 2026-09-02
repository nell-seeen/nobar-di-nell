import React, { useState } from 'react';
import { updateRoomSettings, updateRoomLock } from '../../services/roomService';
import { RoomDocument } from '../../store/roomStore';
import { X, Lock, Unlock, MessageSquare, Plus, Save } from 'lucide-react';

interface RoomSettingsModalProps {
  room: RoomDocument;
  onClose: () => void;
}

export default function RoomSettingsModal({ room, onClose }: RoomSettingsModalProps) {
  const [name, setName] = useState(room.name);
  const [locked, setLocked] = useState(room.locked);
  const [chatEnabled, setChatEnabled] = useState(room.settings.chatEnabled);
  const [reactionEnabled, setReactionEnabled] = useState(room.settings.reactionEnabled);
  const [viewerControl, setViewerControl] = useState(room.settings.viewerControl);
  
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (room.locked !== locked) {
        await updateRoomLock(room.id, locked);
      }
      
      await updateRoomSettings(room.id, {
        chatEnabled,
        reactionEnabled,
        viewerControl
      }, name);
      
      onClose();
    } catch (error) {
      console.error('Failed to update room settings', error);
      alert('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <SettingsIcon /> Room Settings
          </h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 transition"
              maxLength={30}
              required
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-400">Permissions</h3>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${locked ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                  {locked ? <Lock size={16} /> : <Unlock size={16} />}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">Lock Room</div>
                  <div className="text-neutral-500 text-xs">Prevent new users from joining</div>
                </div>
              </div>
              <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} className="hidden" />
              <div className={`w-10 h-5 rounded-full transition-colors relative ${locked ? 'bg-red-500' : 'bg-neutral-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${locked ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </div>
            </label>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">Enable Chat</div>
                  <div className="text-neutral-500 text-xs">Allow viewers to send messages</div>
                </div>
              </div>
              <input type="checkbox" checked={chatEnabled} onChange={(e) => setChatEnabled(e.target.checked)} className="hidden" />
              <div className={`w-10 h-5 rounded-full transition-colors relative ${chatEnabled ? 'bg-red-500' : 'bg-neutral-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${chatEnabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </div>
            </label>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                  <Plus size={16} />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">Viewer Control</div>
                  <div className="text-neutral-500 text-xs">Allow anyone to play, pause, or seek</div>
                </div>
              </div>
              <input type="checkbox" checked={viewerControl} onChange={(e) => setViewerControl(e.target.checked)} className="hidden" />
              <div className={`w-10 h-5 rounded-full transition-colors relative ${viewerControl ? 'bg-red-500' : 'bg-neutral-700'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${viewerControl ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </div>
            </label>
          </div>
          
          <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
