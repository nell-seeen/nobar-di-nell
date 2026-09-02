/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router';
import Home from './pages/Home';
import WatchRoom from './pages/WatchRoom';
import { useAuth } from './hooks/useAuth';
import ProfileSetup from './components/auth/ProfileSetup';

export default function App() {
  const { user, loading } = useAuth(); // Initialize auth listener

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Initializing Auth...</div>;
  }

  if (!user || !user.displayName) {
    return <ProfileSetup />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/watch/:roomId" element={<WatchRoom />} />
      </Routes>
    </BrowserRouter>
  );
}
