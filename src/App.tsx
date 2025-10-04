import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import LibraryPage from '@/pages/LibraryPage';
import PlaylistDetailPage from '@/pages/PlaylistDetailPage';
import SearchPage from '@/pages/SearchPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OnboardingPage from '@/pages/OnboardingPage';
import CreatePlaylistPage from '@/pages/CreatePlaylistPage';
import ArtistPage from '@/pages/ArtistPage';
import SettingsPage from '@/pages/SettingsPage';
import PremiumPage from '@/pages/PremiumPage';
import LikedSongsPage from '@/pages/LikedSongsPage';
import AboutPage from '@/pages/AboutPage';
import { PlayerProvider } from '@/contexts/PlayerContext';
import '@/styles/globals.css';

// Placeholder components
const ProfilePage = () => <div className="p-6"><h1 className="text-2xl font-bold">Profile Page</h1></div>;

function App() {
  return (
    <PlayerProvider>
      <Router>
      <Routes>
        {/* Auth Routes (without Layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Main Routes (with Layout) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="liked" element={<LikedSongsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="playlist/:id" element={<PlaylistDetailPage />} />
          <Route path="playlist/create" element={<CreatePlaylistPage />} />
          <Route path="artist/:id" element={<ArtistPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="premium" element={<PremiumPage />} />
          <Route path="about" element={<AboutPage />} />
          {/* Adicionar mais rotas conforme necessário */}
        </Route>
      </Routes>
    </Router>
    </PlayerProvider>
  );
}

export default App;
