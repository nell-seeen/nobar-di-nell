import React from 'react';
import { Outlet, NavLink } from 'react-router';
import { Home, Compass, Bookmark, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AppLayout() {
  const { user } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Explore', path: '/explore', icon: <Compass size={20} /> },
    { name: 'Library', path: '/library', icon: <Bookmark size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-neutral-950 border-t border-white/10 z-50 flex items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-red-500' : 'text-neutral-500 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-white/10 bg-neutral-950 p-4 shrink-0">
        <div className="flex items-center gap-3 px-4 py-6 mb-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <span className="text-white font-bold text-xl ml-0.5">N</span>
          </div>
          <span className="text-xl font-bold tracking-tight">nobar di nell</span>
        </div>
        
        <div className="space-y-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-red-500/10 text-red-500' 
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </div>

        {user && (
          <div className="mt-auto pt-6 border-t border-white/10 flex items-center gap-3 px-4">
            <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full bg-neutral-800" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate">{user.displayName}</span>
              <span className="text-xs text-neutral-500">Online</span>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-black to-black pointer-events-none" />
        <div className="relative h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
