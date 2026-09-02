import React from 'react';
import { X, Heart, Instagram } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md transition-all">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
        <div className="h-32 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full transition backdrop-blur-sm"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="px-6 pb-8 text-center -mt-12">
          <div className="w-24 h-24 mx-auto bg-neutral-900 rounded-full p-1 border-4 border-neutral-900 mb-4">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=nell&backgroundColor=b6e3f4" 
              alt="nell" 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2 mb-1">
            nell <Heart size={16} className="text-pink-500 fill-pink-500" />
          </h2>
          <p className="text-sm text-neutral-400 mb-6">
            Creator of <span className="text-white font-medium">nobar di nell</span>
          </p>
          
          <p className="text-sm text-neutral-300 leading-relaxed mb-6">
            Welcome to my premium watch party app! I built this so we can watch videos together, perfectly synced, no matter where we are. Enjoy the show!
          </p>
          
          <a 
            href="https://www.instagram.com/tianshirrr_?igsi=MXF1NjVuOWswdm95Zg==" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium transition shadow-lg shadow-pink-500/20"
          >
            <Instagram size={18} />
            Follow @tianshirrr_
          </a>
        </div>
      </div>
    </div>
  );
}
