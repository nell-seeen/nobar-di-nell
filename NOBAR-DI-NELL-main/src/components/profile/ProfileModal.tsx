import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { X, User, Image as ImageIcon, Save, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ProfileModalProps {
  onClose: () => void;
}

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max'
];

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { user } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL.trim() || user.photoURL
        });
      }
      onClose();
      // Force a tiny reload to reflect across auth instances if needed
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <User size={18} /> Edit Profile
          </h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <img 
              src={photoURL || 'https://via.placeholder.com/150'} 
              alt="Avatar preview" 
              className="w-24 h-24 rounded-full bg-neutral-800 border-4 border-neutral-800 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback';
              }}
            />
            
            <div className="w-full">
              <label className="block text-sm font-medium text-neutral-400 mb-2 text-center">
                Choose an Avatar
              </label>
              <div className="flex justify-center gap-2 flex-wrap">
                {DEFAULT_AVATARS.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setPhotoURL(avatar)}
                    className={clsx(
                      "w-10 h-10 rounded-full overflow-hidden border-2 transition-all",
                      photoURL === avatar ? "border-red-500 scale-110" : "border-transparent hover:border-white/50 opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={avatar} alt="avatar option" className="w-full h-full bg-neutral-800" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">
              Custom Image URL
            </label>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400">
                <ImageIcon size={16} />
              </div>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1.5">
              Nickname
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 transition"
              maxLength={30}
              required
            />
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
              disabled={loading || !displayName.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
