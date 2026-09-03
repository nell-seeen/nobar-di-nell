/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router';
import Home from './pages/Home';
import WatchRoom from './pages/WatchRoom';
import Explore from './pages/Explore';
import Library from './pages/Library';
import Profile from './pages/Profile';
import AppLayout from './components/layout/AppLayout';
import { useAuth } from './hooks/useAuth';
import ProfileSetup from './components/auth/ProfileSetup';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Initializing Auth...</div>;
  }

  if (!user || !user.displayName) {
    return <ProfileSetup />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        {/* WatchRoom sits outside AppLayout so it remains full screen theater mode */}
        <Route path="/watch/:roomId" element={<WatchRoom />} />
      </Routes>
    </BrowserRouter>
  );
}
