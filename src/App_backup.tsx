import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import { PWAInstructionsProvider } from '@/contexts/PWAInstructionsContext';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/ErrorBoundary';
import ScrollToTop from '@/components/ScrollToTop';
import PWABanner from '@/components/PWA/PWABanner';
import PWAInstructionsModal from '@/components/PWA/PWAInstructionsModal';
import { useServiceWorker } from '@/hooks/usePWA';
import { usePWAInstructionsContext } from '@/contexts/PWAInstructionsContext';
import HomePage from '@/pages/HomePage';
import DownloadsPage from '@/pages/DownloadsPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OnboardingPage from '@/pages/OnboardingPage';

// User Pages
import ProfilePage from '@/pages/ProfilePage';
import EditProfilePage from '@/pages/EditProfilePage';
import SearchPage from '@/pages/SearchPage';
import LibraryPage from '@/pages/LibraryPage';
import CategoriesPage from '@/pages/CategoriesPage';
import LikedSongsPage from '@/pages/LikedSongsPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import SettingsPageNew from '@/pages/SettingsPageNew';
import PremiumPage from '@/pages/PremiumPage';
import ArtistPage from '@/pages/ArtistPage';
import PlaylistDetailPage from '@/pages/PlaylistDetailPage';
import CreatePlaylistPage from '@/pages/CreatePlaylistPage';
import TrendsPage from '@/pages/TrendsPage';
import AlbumDetailPage from '@/pages/AlbumDetailPage';
import AlbumsPage from '@/pages/AlbumsPage';
import CompositoresPage from '@/pages/CompositoresPage';
import ComposerPublicProfilePage from '@/pages/ComposerPublicProfilePage';
import CategoryPage from '@/pages/CategoryPage';

// Composer Pages
import ComposerDashboard from '@/pages/composer/ComposerDashboard';
import ComposerOnboarding from '@/pages/composer/ComposerOnboarding';
import ComposerSongs from '@/pages/composer/ComposerSongs';
import ComposerCreateSong from '@/pages/composer/ComposerCreateSong';
import ComposerEditSong from '@/pages/composer/ComposerEditSong';
import ComposerUploadSong from '@/pages/composer/ComposerUploadSong';
import ComposerAlbums from '@/pages/composer/ComposerAlbums';
import ComposerCreateAlbum from '@/pages/composer/ComposerCreateAlbum';
import ComposerProfile from '@/pages/composer/ComposerProfile';
import ComposerCopyrightClaims from '@/pages/composer/ComposerCopyrightClaims';
import ComposerAnalytics from '@/pages/composer/ComposerAnalytics';
import ComposerFollowers from '@/pages/composer/ComposerFollowers';
import ComposerNotifications from '@/pages/composer/ComposerNotifications';

// Admin Pages - Lazy Loaded
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminSongs = React.lazy(() => import('@/pages/admin/AdminSongs'));
const AdminSongForm = React.lazy(() => import('@/pages/admin/AdminSongForm'));
const AdminSongsPending = React.lazy(() => import('@/pages/admin/AdminSongsPending'));
const AdminHymns = React.lazy(() => import('@/pages/admin/AdminHymns'));
const AdminComposers = React.lazy(() => import('@/pages/admin/AdminComposers'));
const AdminComposerForm = React.lazy(() => import('@/pages/admin/AdminComposerForm'));
const AdminGenres = React.lazy(() => import('@/pages/admin/AdminGenres'));
const AdminAlbums = React.lazy(() => import('@/pages/admin/AdminAlbums'));
const AdminUsers = React.lazy(() => import('@/pages/admin/AdminUsers'));
const AdminUserEdit = React.lazy(() => import('@/pages/admin/AdminUserEdit'));
const AdminReports = React.lazy(() => import('@/pages/admin/AdminReports'));
const AdminAnalytics = React.lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminCollections = React.lazy(() => import('@/pages/admin/AdminCollections'));
const AdminCategories = React.lazy(() => import('@/pages/admin/AdminCategories'));
const AdminTags = React.lazy(() => import('@/pages/admin/AdminTags'));
const AdminComposersPending = React.lazy(() => import('@/pages/admin/AdminComposersPending'));
const AdminSettings = React.lazy(() => import('@/pages/admin/AdminSettings'));
import AdminPlaylists from '@/pages/admin/playlists/AdminPlaylists';
import AdminRoyalties from '@/pages/admin/AdminRoyalties';
import AdminApprovals from '@/pages/admin/approvals/AdminApprovals';
import AdminComposersVerified from '@/pages/admin/AdminComposersVerified';
import AdminComments from '@/pages/admin/AdminComments';
import AdminBanners from '@/pages/admin/AdminBanners';
import AdminUsersPremium from '@/pages/admin/AdminUsersPremium';
import AdminLogos from '@/pages/admin/AdminLogos';
import AdminTheme from '@/pages/admin/AdminTheme';
import AdminMenus from '@/pages/admin/AdminMenus';
import AdminSEO from '@/pages/admin/AdminSEO';
import AdminCustomReports from '@/pages/admin/AdminCustomReports';
import AdminLogs from '@/pages/admin/AdminLogs';
import AdminSettingsGeneral from '@/pages/admin/AdminSettingsGeneral';
import AdminSettingsUsers from '@/pages/admin/AdminSettingsUsers';
import AdminSettingsComposers from '@/pages/admin/AdminSettingsComposers';
import AdminSettingsPremium from '@/pages/admin/AdminSettingsPremium';
import AdminSettingsEmail from '@/pages/admin/AdminSettingsEmail';
import AdminSettingsSecurity from '@/pages/admin/AdminSettingsSecurity';
import AdminSettingsIntegrations from '@/pages/admin/AdminSettingsIntegrations';
import AdminFeatured from '@/pages/admin/AdminFeatured';
import AdminPlaylistsEditorial from '@/pages/admin/AdminPlaylistsEditorial';
import AdminPromotions from '@/pages/admin/AdminPromotions';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminCampaigns from '@/pages/admin/AdminCampaigns';
import AdminImport from '@/pages/admin/AdminImport';
import AdminExport from '@/pages/admin/AdminExport';
import AdminBackup from '@/pages/admin/AdminBackup';
import AdminAPI from '@/pages/admin/AdminAPI';
import AdminBibleNarrated from '@/pages/admin/AdminBibleNarrated';
import AdminCopyrightClaims from '@/pages/admin/AdminCopyrightClaims';

import '@/styles/globals.css';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePreloadData } from '@/hooks/usePreloadData';

const AppContent: React.FC = () => {
  const { isOpen, hideInstructions } = usePWAInstructionsContext();
  
  // Preload dados críticos
  usePreloadData();
  
  // Registrar Service Worker
  useServiceWorker();
  
  return (
    <>
      <PWABanner />
      <PWAInstructionsModal isOpen={isOpen} onClose={hideInstructions} />
      <Router>
        <ScrollToTop />
        <Routes>
        {/* Auth Routes (without Layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/compositor/cadastro" element={<RegisterPage />} />
        
        {/* Main Routes (with Layout) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="liked" element={<LikedSongsPage />} />
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="premium" element={<PremiumPage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="artist/:id" element={<ArtistPage />} />
          <Route path="albuns" element={<AlbumsPage />} />
          <Route path="album/:id" element={<AlbumDetailPage />} />
          <Route path="compositores" element={<CompositoresPage />} />
          <Route path="compositor/:id" element={<ComposerPublicProfilePage />} />
          <Route path="categoria/:slug" element={<CategoryPage />} />
          <Route path="playlist/:id" element={<PlaylistDetailPage />} />
          <Route path="playlist/create" element={<CreatePlaylistPage />} />
        </Route>

        {/* User Profile Routes */}
        <Route path="/profile" element={<Layout />}>
          <Route index element={<ProfilePage />} />
        </Route>
        <Route path="/edit-profile" element={<Layout />}>
          <Route index element={<EditProfilePage />} />
        </Route>
        <Route path="/settings" element={<Layout />}>
          <Route index element={<SettingsPageNew />} />
        </Route>
        <Route path="/subscription" element={<Layout />}>
          <Route index element={<SubscriptionPage />} />
        </Route>

        {/* Composer Routes */}
        <Route path="/composer" element={<Layout />}>
          <Route index element={<ComposerDashboard />} />
          <Route path="songs" element={<ComposerSongs />} />
          <Route path="songs/create" element={<ComposerCreateSong />} />
          <Route path="songs/edit/:id" element={<ComposerEditSong />} />
          <Route path="songs/upload" element={<ComposerUploadSong />} />
          <Route path="albums" element={<ComposerAlbums />} />
          <Route path="albums/create" element={<ComposerCreateAlbum />} />
          <Route path="profile" element={<ComposerProfile />} />
          <Route path="copyright-claims" element={<ComposerCopyrightClaims />} />
          <Route path="analytics" element={<ComposerAnalytics />} />
          <Route path="followers" element={<ComposerFollowers />} />
          <Route path="notifications" element={<ComposerNotifications />} />
        </Route>
        <Route path="/composer/onboarding" element={<ComposerOnboarding />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="composers" element={<AdminComposers />} />
          <Route path="songs" element={<AdminSongs />} />
          <Route path="albums" element={<AdminAlbums />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="playlists" element={<AdminPlaylists />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="bible-narrated" element={<AdminBibleNarrated />} />
          <Route path="copyright-claims" element={<AdminCopyrightClaims />} />
          <Route path="logos" element={<AdminLogos />} />
          <Route path="theme" element={<AdminTheme />} />
          <Route path="menus" element={<AdminMenus />} />
          <Route path="seo" element={<AdminSEO />} />
          <Route path="custom-reports" element={<AdminCustomReports />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="settings/general" element={<AdminSettingsGeneral />} />
          <Route path="settings/users" element={<AdminSettingsUsers />} />
          <Route path="settings/composers" element={<AdminSettingsComposers />} />
          <Route path="settings/premium" element={<AdminSettingsPremium />} />
          <Route path="settings/email" element={<AdminSettingsEmail />} />
          <Route path="settings/security" element={<AdminSettingsSecurity />} />
          <Route path="settings/integrations" element={<AdminSettingsIntegrations />} />
          <Route path="featured" element={<AdminFeatured />} />
          <Route path="playlists-editorial" element={<AdminPlaylistsEditorial />} />
          <Route path="promotions" element={<AdminPromotions />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="import" element={<AdminImport />} />
          <Route path="export" element={<AdminExport />} />
          <Route path="backup" element={<AdminBackup />} />
          <Route path="api" element={<AdminAPI />} />
        </Route>
        </Routes>
      </Router>
    </>
  );
};

function App() {
  console.log('🔥 App.tsx carregando...');
  
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <PlayerProvider>
            <GlobalAudioPlayer />
            <MobileMenuProvider>
              <PWAInstructionsProvider>
                <AppContent />
              </PWAInstructionsProvider>
            </MobileMenuProvider>
          </PlayerProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
                  <Route path="profile" element={<ComposerProfile />} />
                  <Route path="copyright-claims" element={<ComposerCopyrightClaims />} />
                </Route>

                {/* Admin Routes - Protegidas */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminDashboard />
                    </Suspense>
                  } />
                  <Route path="songs" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminSongs />
                    </Suspense>
                  } />
                  <Route path="songs/create" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminSongForm />
                    </Suspense>
                  } />
                  <Route path="songs/edit/:id" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminSongForm />
                    </Suspense>
                  } />
                  <Route path="songs/pending" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminSongsPending />
                    </Suspense>
                  } />
                  <Route path="hymns" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminHymns />
                    </Suspense>
                  } />
                  <Route path="composers" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminComposers />
                    </Suspense>
                  } />
                  <Route path="composers/create" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminComposerForm />
                    </Suspense>
                  } />
                  <Route path="composers/edit/:id" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminComposerForm />
                    </Suspense>
                  } />
                  <Route path="genres" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminGenres />
                    </Suspense>
                  } />
                  <Route path="albums" element={<AdminAlbums />} />
                  <Route path="users" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminUsers />
                    </Suspense>
                  } />
                  <Route path="users/edit/:id" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminUserEdit />
                    </Suspense>
                  } />
                  <Route path="reports" element={
                    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>}>
                      <AdminReports />
                    </Suspense>
                  } />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="collections" element={<AdminCollections />} />
                  <Route path="bible-narrated" element={<AdminBibleNarrated />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="tags" element={<AdminTags />} />
                  <Route path="composers/pending" element={<AdminComposersPending />} />
                  <Route path="settings/general" element={<AdminSettings />} />
                  {/* Outras rotas placeholder usam o mesmo componente AdminSettings */}
                  <Route path="users/premium" element={<AdminUsersPremium />} />
                  <Route path="users/playlists" element={<AdminPlaylists />} />
                  <Route path="composers/verified" element={<AdminComposersVerified />} />
                  <Route path="composers/royalties" element={<AdminRoyalties />} />
                  <Route path="approvals" element={<AdminApprovals />} />
                  <Route path="copyright-claims" element={<AdminCopyrightClaims />} />
                  <Route path="comments" element={<AdminComments />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="logos" element={<AdminLogos />} />
                  <Route path="theme" element={<AdminTheme />} />
                  <Route path="menus" element={<AdminMenus />} />
                  <Route path="seo" element={<AdminSEO />} />
                  <Route path="reports/analytics" element={<AdminAnalytics />} />
                  <Route path="reports/custom" element={<AdminCustomReports />} />
                  <Route path="reports/logs" element={<AdminLogs />} />
                  <Route path="settings/general" element={<AdminSettingsGeneral />} />
                  <Route path="settings/users" element={<AdminSettingsUsers />} />
                  <Route path="settings/composers" element={<AdminSettingsComposers />} />
                  <Route path="settings/premium" element={<AdminSettingsPremium />} />
                  <Route path="settings/email" element={<AdminSettingsEmail />} />
                  <Route path="settings/security" element={<AdminSettingsSecurity />} />
                  <Route path="settings/integrations" element={<AdminSettingsIntegrations />} />
                  <Route path="featured" element={<AdminFeatured />} />
                  <Route path="playlists-editorial" element={<AdminPlaylistsEditorial />} />
                  <Route path="promotions" element={<AdminPromotions />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="campaigns" element={<AdminCampaigns />} />
                  <Route path="import" element={<AdminImport />} />
                  <Route path="export" element={<AdminExport />} />
                  <Route path="backup" element={<AdminBackup />} />
                  <Route path="api" element={<AdminAPI />} />
                </Route>
                </Routes>
              </Router>
            </MobileMenuProvider>
          </PlayerProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
