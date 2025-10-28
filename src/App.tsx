import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProtectedComposerRoute } from '@/components/ProtectedComposerRoute';
import '@/styles/globals.css';

// Public Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OnboardingPage from '@/pages/OnboardingPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import AlbumsPage from '@/pages/AlbumsPage';
import AlbumDetailPage from '@/pages/AlbumDetailPage';
import CompositoresPage from '@/pages/CompositoresPage';
import ComposerPublicProfilePage from '@/pages/ComposerPublicProfilePage';
import SearchPage from '@/pages/SearchPage';
import CategoriesPage from '@/pages/CategoriesPage';
import CategoryPage from '@/pages/CategoryPage';
import PlaylistDetailPage from '@/pages/PlaylistDetailPage';
import TrendsPage from '@/pages/TrendsPage';
import TermsOfUsePage from '@/pages/TermsOfUsePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import DisclaimerPage from '@/pages/DisclaimerPage';

// User Pages
import ProfilePage from '@/pages/ProfilePage';
import EditProfilePage from '@/pages/EditProfilePage';
import LibraryPage from '@/pages/LibraryPage';
import LikedSongsPage from '@/pages/LikedSongsPage';
import HistoryPage from '@/pages/HistoryPage';
import NotificationsPage from '@/pages/NotificationsPage';
import ManageComposersPage from '@/pages/ManageComposersPage';
import ManagerInvitesPage from '@/pages/ManagerInvitesPage';
import DownloadsPage from '@/pages/DownloadsPage';
import SettingsPageNew from '@/pages/SettingsPageNew';
import SubscriptionPage from '@/pages/SubscriptionPage';
import CreatePlaylistPage from '@/pages/CreatePlaylistPage';

// Composer Pages
import ComposerDashboard from '@/pages/composer/ComposerDashboard';
import ComposerProfile from '@/pages/composer/ComposerProfile';
import ComposerSongs from '@/pages/composer/ComposerSongs';
import ComposerCreateSong from '@/pages/composer/ComposerCreateSong';
import ComposerManagers from '@/pages/composer/ComposerManagers';
import ComposerUploadSong from '@/pages/composer/ComposerUploadSong';
// import ComposerSongForm from '@/pages/composer/ComposerSongForm';
import ComposerAlbums from '@/pages/composer/ComposerAlbums';
import ComposerCreateAlbum from '@/pages/composer/ComposerCreateAlbum';
import ComposerEditAlbum from '@/pages/composer/ComposerEditAlbum';
import ComposerAnalytics from '@/pages/composer/ComposerAnalytics';
import ComposerFollowers from '@/pages/composer/ComposerFollowers';
import ComposerNotifications from '@/pages/composer/ComposerNotifications';
import ComposerCopyrightClaims from '@/pages/composer/ComposerCopyrightClaims';
import ComposerOnboarding from '@/pages/composer/ComposerOnboarding';

// Admin Pages
// import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminDashboard from '@/pages/admin/AdminDashboardSimple'; // Versão simplificada para debug
import AdminApprovals from '@/pages/admin/approvals/AdminApprovals';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminUserEdit from '@/pages/admin/AdminUserEdit';
import AdminUserForm from '@/pages/admin/AdminUserForm';
import AdminUsersPremium from '@/pages/admin/AdminUsersPremium';
import AdminComposers from '@/pages/admin/AdminComposers';
import AdminComposersPending from '@/pages/admin/AdminComposersPending';
import AdminComposersVerified from '@/pages/admin/AdminComposersVerified';
import AdminComposerForm from '@/pages/admin/AdminComposerForm';
import AdminAlbumForm from '@/pages/admin/AdminAlbumForm';
import AdminHymns from '@/pages/admin/AdminHymns';
import AdminHymnForm from '@/pages/admin/AdminHymnForm';
import AdminSongs from '@/pages/admin/AdminSongs';
import AdminSongsPending from '@/pages/admin/songs/AdminSongsPending';
import AdminSongDetails from '@/pages/admin/songs/AdminSongDetails';
import AdminSongForm from '@/pages/admin/AdminSongForm';
import AdminAlbums from '@/pages/admin/AdminAlbums';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminCategoryForm from '@/pages/admin/AdminCategoryForm';
import AdminGenres from '@/pages/admin/AdminGenres';
import AdminGenreForm from '@/pages/admin/AdminGenreForm';
import AdminTags from '@/pages/admin/AdminTags';
import AdminTagForm from '@/pages/admin/AdminTagForm';
import AdminPlaylistsEditorial from '@/pages/admin/AdminPlaylistsEditorial';
import AdminPlaylistForm from '@/pages/admin/AdminPlaylistForm';
import AdminBanners from '@/pages/admin/AdminBanners';
import AdminBannerForm from '@/pages/admin/AdminBannerForm';
import AdminFeatured from '@/pages/admin/AdminFeatured';
import AdminFeaturedForm from '@/pages/admin/AdminFeaturedForm';
import AdminCollections from '@/pages/admin/AdminCollections';
import AdminCollectionForm from '@/pages/admin/AdminCollectionForm';
import AdminCampaigns from '@/pages/admin/AdminCampaigns';
import AdminCampaignForm from '@/pages/admin/AdminCampaignForm';
import AdminPromotions from '@/pages/admin/AdminPromotions';
import AdminPromotionForm from '@/pages/admin/AdminPromotionForm';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminCouponForm from '@/pages/admin/AdminCouponForm';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminReports from '@/pages/admin/reports/AdminReports';
import AdminReportAnalytics from '@/pages/admin/reports/AdminReportAnalytics';
import AdminReportLogs from '@/pages/admin/reports/AdminReportLogs';
import AdminCustomReports from '@/pages/admin/AdminCustomReports';
import AdminLogs from '@/pages/admin/AdminLogs';
import AdminLogos from '@/pages/admin/AdminLogos';
import AdminComments from '@/pages/admin/AdminComments';
import AdminCopyrightClaims from '@/pages/admin/AdminCopyrightClaims';
import AdminRoyalties from '@/pages/admin/AdminRoyalties';
// Temporariamente desabilitado para acelerar o build
// import AdminSettings from '@/pages/admin/AdminSettings';
import AdminSettingsGeneral from '@/pages/admin/AdminSettingsGeneral';
import AdminSettingsUsers from '@/pages/admin/AdminSettingsUsers';
import AdminSettingsComposers from '@/pages/admin/AdminSettingsComposers';
import AdminSettingsPremium from '@/pages/admin/AdminSettingsPremium';
import AdminSettingsEmail from '@/pages/admin/AdminSettingsEmail';
import AdminSettingsSecurity from '@/pages/admin/AdminSettingsSecurity';
import AdminSettingsIntegrations from '@/pages/admin/AdminSettingsIntegrations';
import AdminSEO from '@/pages/admin/AdminSEO';
import AdminMenus from '@/pages/admin/AdminMenus';
import AdminTheme from '@/pages/admin/AdminTheme';
// import AdminLogos from '@/pages/admin/AdminLogos'; // Already imported above
import AdminBackup from '@/pages/admin/AdminBackup';
import AdminBackupForm from '@/pages/admin/AdminBackupForm';
import AdminImport from '@/pages/admin/AdminImport';
import AdminImportForm from '@/pages/admin/AdminImportForm';
import AdminExport from '@/pages/admin/AdminExport';
import AdminExportForm from '@/pages/admin/AdminExportForm';
import AdminAPI from '@/pages/admin/AdminAPI';
import AdminAPIForm from '@/pages/admin/AdminAPIForm';
import AdminBibleNarrated from '@/pages/admin/AdminBibleNarrated';
import AdminBibleNarratedForm from '@/pages/admin/AdminBibleNarratedForm';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import { Navigate } from 'react-router-dom';

const AppContent: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes - No Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Public Routes - With Layout */}
        <Route path="/" element={<Layout />}>
          {/* Home */}
          <Route index element={<HomePage />} />
          
          {/* Browse */}
          <Route path="buscar" element={<SearchPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="albuns" element={<AlbumsPage />} />
          <Route path="album/:id" element={<AlbumDetailPage />} />
          <Route path="compositores" element={<CompositoresPage />} />
          <Route path="compositor/:id" element={<ComposerPublicProfilePage />} />
          <Route path="artist/:id" element={<ComposerPublicProfilePage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categoria/:slug" element={<CategoryPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="playlist/:id" element={<PlaylistDetailPage />} />
          <Route path="tendencias" element={<TrendsPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="recem-chegados" element={<TrendsPage />} />
          
          {/* Legal */}
          <Route path="termos" element={<TermsOfUsePage />} />
          <Route path="privacidade" element={<PrivacyPolicyPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="disclaimer" element={<DisclaimerPage />} />
          
          {/* User Routes - Protected */}
          <Route path="perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="perfil/editar" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          {/* English aliases */}
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="edit-profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          <Route path="biblioteca" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="favoritos" element={<ProtectedRoute><LikedSongsPage /></ProtectedRoute>} />
          <Route path="liked-songs" element={<Navigate to="/favoritos" replace />} />
          <Route path="liked" element={<Navigate to="/favoritos" replace />} />
          <Route path="historico" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="downloads" element={<ProtectedRoute><DownloadsPage /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="notificacoes" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="configuracoes" element={<ProtectedRoute><SettingsPageNew /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><SettingsPageNew /></ProtectedRoute>} />
          <Route path="assinatura" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="playlist/criar" element={<ProtectedRoute><CreatePlaylistPage /></ProtectedRoute>} />
          <Route path="manage-composers" element={<ProtectedRoute><ManageComposersPage /></ProtectedRoute>} />
          <Route path="manager-invites" element={<ProtectedRoute><ManagerInvitesPage /></ProtectedRoute>} />
          <Route path="subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="playlist/criar" element={<ProtectedRoute><CreatePlaylistPage /></ProtectedRoute>} />
          
          {/* Composer Routes - Protected + Verified Composer Only */}
          <Route path="composer" element={<ProtectedComposerRoute><ComposerDashboard /></ProtectedComposerRoute>} />
          <Route path="composer/dashboard" element={<ProtectedComposerRoute><ComposerDashboard /></ProtectedComposerRoute>} />
          <Route path="compositor/dashboard" element={<ProtectedComposerRoute><ComposerDashboard /></ProtectedComposerRoute>} />
          <Route path="compositor/perfil" element={<ProtectedComposerRoute><ComposerProfile /></ProtectedComposerRoute>} />
          <Route path="composer/profile" element={<ProtectedComposerRoute><ComposerProfile /></ProtectedComposerRoute>} />
          <Route path="compositor/gerentes" element={<ProtectedComposerRoute><ComposerManagers /></ProtectedComposerRoute>} />
          <Route path="composer/managers" element={<ProtectedComposerRoute><ComposerManagers /></ProtectedComposerRoute>} />
          <Route path="compositor/musicas" element={<ProtectedComposerRoute><ComposerSongs /></ProtectedComposerRoute>} />
          <Route path="composer/songs" element={<ProtectedComposerRoute><ComposerSongs /></ProtectedComposerRoute>} />
          <Route path="compositor/musica/criar" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="composer/songs/new" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="compositor/musica/editar/:id" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="composer/songs/edit/:id" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="composer/songs/:id/edit" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="compositor/musica/upload" element={<ProtectedComposerRoute><ComposerUploadSong /></ProtectedComposerRoute>} />
          <Route path="composer/songs/upload" element={<ProtectedComposerRoute><ComposerUploadSong /></ProtectedComposerRoute>} />
          <Route path="compositor/albuns" element={<ProtectedComposerRoute><ComposerAlbums /></ProtectedComposerRoute>} />
          <Route path="composer/albums" element={<ProtectedComposerRoute><ComposerAlbums /></ProtectedComposerRoute>} />
          <Route path="compositor/album/criar" element={<ProtectedComposerRoute><ComposerCreateAlbum /></ProtectedComposerRoute>} />
          <Route path="composer/albums/create" element={<ProtectedComposerRoute><ComposerCreateAlbum /></ProtectedComposerRoute>} />
          <Route path="composer/albums/new" element={<ProtectedComposerRoute><ComposerCreateAlbum /></ProtectedComposerRoute>} />
          <Route path="compositor/album/editar/:id" element={<ProtectedComposerRoute><ComposerEditAlbum /></ProtectedComposerRoute>} />
          <Route path="composer/albums/edit/:id" element={<ProtectedComposerRoute><ComposerEditAlbum /></ProtectedComposerRoute>} />
          <Route path="compositor/hino/criar" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="composer/songs/create" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="composer/songs/new" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="compositor/hino/editar/:id" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="composer/songs/edit/:id" element={<ProtectedComposerRoute><ComposerCreateSong /></ProtectedComposerRoute>} />
          <Route path="compositor/analytics" element={<ProtectedComposerRoute><ComposerAnalytics /></ProtectedComposerRoute>} />
          <Route path="composer/analytics" element={<ProtectedComposerRoute><ComposerAnalytics /></ProtectedComposerRoute>} />
          <Route path="compositor/seguidores" element={<ProtectedComposerRoute><ComposerFollowers /></ProtectedComposerRoute>} />
          <Route path="composer/followers" element={<ProtectedComposerRoute><ComposerFollowers /></ProtectedComposerRoute>} />
          <Route path="compositor/notificacoes" element={<ProtectedComposerRoute><ComposerNotifications /></ProtectedComposerRoute>} />
          <Route path="composer/notifications" element={<ProtectedComposerRoute><ComposerNotifications /></ProtectedComposerRoute>} />
          <Route path="compositor/direitos-autorais" element={<ProtectedComposerRoute><ComposerCopyrightClaims /></ProtectedComposerRoute>} />
          <Route path="composer/copyright-claims" element={<ProtectedComposerRoute><ComposerCopyrightClaims /></ProtectedComposerRoute>} />
          <Route path="compositor/onboarding" element={<ProtectedComposerRoute><ComposerOnboarding /></ProtectedComposerRoute>} />
          <Route path="composer/trending" element={<ProtectedComposerRoute><TrendsPage /></ProtectedComposerRoute>} />
          <Route path="composer/liked" element={<ProtectedComposerRoute><LikedSongsPage /></ProtectedComposerRoute>} />
          <Route path="composer/history" element={<ProtectedComposerRoute><HistoryPage /></ProtectedComposerRoute>} />
          
          {/* Admin Routes - Protected + Admin Role */}
          <Route path="admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/approvals" element={<ProtectedRoute requireAdmin><AdminApprovals /></ProtectedRoute>} />
          
          {/* Users Management */}
          <Route path="admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="admin/users/criar" element={<ProtectedRoute requireAdmin><AdminUserForm /></ProtectedRoute>} />
          <Route path="admin/users/create" element={<ProtectedRoute requireAdmin><AdminUserForm /></ProtectedRoute>} />
          <Route path="admin/users/editar/:id" element={<ProtectedRoute requireAdmin><AdminUserForm /></ProtectedRoute>} />
          <Route path="admin/users/edit/:id" element={<ProtectedRoute requireAdmin><AdminUserForm /></ProtectedRoute>} />
          <Route path="admin/usuarios/editar/:id" element={<ProtectedRoute requireAdmin><AdminUserEdit /></ProtectedRoute>} />
          <Route path="admin/usuarios/premium" element={<ProtectedRoute requireAdmin><AdminUsersPremium /></ProtectedRoute>} />
          <Route path="admin/users/premium" element={<ProtectedRoute requireAdmin><AdminUsersPremium /></ProtectedRoute>} />
          
          {/* Composers Management */}
          <Route path="admin/compositores" element={<ProtectedRoute requireAdmin><AdminComposers /></ProtectedRoute>} />
          <Route path="admin/composers" element={<ProtectedRoute requireAdmin><AdminComposers /></ProtectedRoute>} />
          <Route path="admin/compositores/pendentes" element={<ProtectedRoute requireAdmin><AdminComposersPending /></ProtectedRoute>} />
          <Route path="admin/composers/pending" element={<ProtectedRoute requireAdmin><AdminComposersPending /></ProtectedRoute>} />
          <Route path="admin/compositores/verificados" element={<ProtectedRoute requireAdmin><AdminComposersVerified /></ProtectedRoute>} />
          <Route path="admin/composers/verified" element={<ProtectedRoute requireAdmin><AdminComposersVerified /></ProtectedRoute>} />
          <Route path="admin/compositor/criar" element={<ProtectedRoute requireAdmin><AdminComposerForm /></ProtectedRoute>} />
          <Route path="admin/composer/create" element={<ProtectedRoute requireAdmin><AdminComposerForm /></ProtectedRoute>} />
          <Route path="admin/composers/create" element={<ProtectedRoute requireAdmin><AdminComposerForm /></ProtectedRoute>} />
          <Route path="admin/compositor/editar/:id" element={<ProtectedRoute requireAdmin><AdminComposerForm /></ProtectedRoute>} />
          <Route path="admin/composer/edit/:id" element={<ProtectedRoute requireAdmin><AdminComposerForm /></ProtectedRoute>} />
          <Route path="admin/composers/edit/:id" element={<ProtectedRoute requireAdmin><AdminComposerForm /></ProtectedRoute>} />
          
          {/* Content Management */}
          <Route path="admin/hinos" element={<ProtectedRoute requireAdmin><AdminHymns /></ProtectedRoute>} />
          <Route path="admin/hymns" element={<ProtectedRoute requireAdmin><AdminHymns /></ProtectedRoute>} />
          <Route path="admin/hino/criar" element={<ProtectedRoute requireAdmin><AdminHymnForm /></ProtectedRoute>} />
          <Route path="admin/hino/editar/:id" element={<ProtectedRoute requireAdmin><AdminHymnForm /></ProtectedRoute>} />
          <Route path="admin/musicas" element={<ProtectedRoute requireAdmin><AdminSongs /></ProtectedRoute>} />
          <Route path="admin/songs" element={<ProtectedRoute requireAdmin><AdminSongs /></ProtectedRoute>} />
          <Route path="admin/songs/:id" element={<ProtectedRoute requireAdmin><AdminSongDetails /></ProtectedRoute>} />
          <Route path="admin/musicas/pendentes" element={<ProtectedRoute requireAdmin><AdminSongsPending /></ProtectedRoute>} />
          <Route path="admin/songs/pending" element={<ProtectedRoute requireAdmin><AdminSongsPending /></ProtectedRoute>} />
          <Route path="admin/musica/criar" element={<ProtectedRoute requireAdmin><AdminSongForm /></ProtectedRoute>} />
          <Route path="admin/musica/editar/:id" element={<ProtectedRoute requireAdmin><AdminSongForm /></ProtectedRoute>} />
          <Route path="admin/albuns" element={<ProtectedRoute requireAdmin><AdminAlbums /></ProtectedRoute>} />
          <Route path="admin/albums" element={<ProtectedRoute requireAdmin><AdminAlbums /></ProtectedRoute>} />
          <Route path="admin/albuns/criar" element={<ProtectedRoute requireAdmin><AdminAlbumForm /></ProtectedRoute>} />
          <Route path="admin/albums/create" element={<ProtectedRoute requireAdmin><AdminAlbumForm /></ProtectedRoute>} />
          <Route path="admin/albuns/editar/:id" element={<ProtectedRoute requireAdmin><AdminAlbumForm /></ProtectedRoute>} />
          <Route path="admin/albums/edit/:id" element={<ProtectedRoute requireAdmin><AdminAlbumForm /></ProtectedRoute>} />
          <Route path="admin/categorias" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
          <Route path="admin/categories" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
          <Route path="admin/categories/criar" element={<ProtectedRoute requireAdmin><AdminCategoryForm /></ProtectedRoute>} />
          <Route path="admin/categories/create" element={<ProtectedRoute requireAdmin><AdminCategoryForm /></ProtectedRoute>} />
          <Route path="admin/categories/editar/:id" element={<ProtectedRoute requireAdmin><AdminCategoryForm /></ProtectedRoute>} />
          <Route path="admin/categories/edit/:id" element={<ProtectedRoute requireAdmin><AdminCategoryForm /></ProtectedRoute>} />
          <Route path="admin/generos" element={<ProtectedRoute requireAdmin><AdminGenres /></ProtectedRoute>} />
          <Route path="admin/genres" element={<ProtectedRoute requireAdmin><AdminGenres /></ProtectedRoute>} />
          <Route path="admin/genres/criar" element={<ProtectedRoute requireAdmin><AdminGenreForm /></ProtectedRoute>} />
          <Route path="admin/genres/create" element={<ProtectedRoute requireAdmin><AdminGenreForm /></ProtectedRoute>} />
          <Route path="admin/genres/editar/:id" element={<ProtectedRoute requireAdmin><AdminGenreForm /></ProtectedRoute>} />
          <Route path="admin/genres/edit/:id" element={<ProtectedRoute requireAdmin><AdminGenreForm /></ProtectedRoute>} />
          <Route path="admin/tags" element={<ProtectedRoute requireAdmin><AdminTags /></ProtectedRoute>} />
          <Route path="admin/tags/criar" element={<ProtectedRoute requireAdmin><AdminTagForm /></ProtectedRoute>} />
          <Route path="admin/tags/create" element={<ProtectedRoute requireAdmin><AdminTagForm /></ProtectedRoute>} />
          <Route path="admin/tags/editar/:id" element={<ProtectedRoute requireAdmin><AdminTagForm /></ProtectedRoute>} />
          <Route path="admin/tags/edit/:id" element={<ProtectedRoute requireAdmin><AdminTagForm /></ProtectedRoute>} />
          <Route path="admin/playlists" element={<ProtectedRoute requireAdmin><AdminPlaylistsEditorial /></ProtectedRoute>} />
          <Route path="admin/playlists-editorial" element={<ProtectedRoute requireAdmin><AdminPlaylistsEditorial /></ProtectedRoute>} />
          <Route path="admin/users/playlists" element={<ProtectedRoute requireAdmin><AdminPlaylistsEditorial /></ProtectedRoute>} />
          <Route path="admin/playlists/criar" element={<ProtectedRoute requireAdmin><AdminPlaylistForm /></ProtectedRoute>} />
          <Route path="admin/playlists/create" element={<ProtectedRoute requireAdmin><AdminPlaylistForm /></ProtectedRoute>} />
          <Route path="admin/playlists/editar/:id" element={<ProtectedRoute requireAdmin><AdminPlaylistForm /></ProtectedRoute>} />
          <Route path="admin/playlists/edit/:id" element={<ProtectedRoute requireAdmin><AdminPlaylistForm /></ProtectedRoute>} />
          
          {/* Promotions */}
          <Route path="admin/banners" element={<ProtectedRoute requireAdmin><AdminBanners /></ProtectedRoute>} />
          <Route path="admin/banners/criar" element={<ProtectedRoute requireAdmin><AdminBannerForm /></ProtectedRoute>} />
          <Route path="admin/banners/create" element={<ProtectedRoute requireAdmin><AdminBannerForm /></ProtectedRoute>} />
          <Route path="admin/banners/editar/:id" element={<ProtectedRoute requireAdmin><AdminBannerForm /></ProtectedRoute>} />
          <Route path="admin/banners/edit/:id" element={<ProtectedRoute requireAdmin><AdminBannerForm /></ProtectedRoute>} />
          <Route path="admin/destaques" element={<ProtectedRoute requireAdmin><AdminFeatured /></ProtectedRoute>} />
          <Route path="admin/featured" element={<ProtectedRoute requireAdmin><AdminFeatured /></ProtectedRoute>} />
          <Route path="admin/featured/criar" element={<ProtectedRoute requireAdmin><AdminFeaturedForm /></ProtectedRoute>} />
          <Route path="admin/featured/create" element={<ProtectedRoute requireAdmin><AdminFeaturedForm /></ProtectedRoute>} />
          <Route path="admin/featured/editar/:id" element={<ProtectedRoute requireAdmin><AdminFeaturedForm /></ProtectedRoute>} />
          <Route path="admin/featured/edit/:id" element={<ProtectedRoute requireAdmin><AdminFeaturedForm /></ProtectedRoute>} />
          <Route path="admin/colecoes" element={<ProtectedRoute requireAdmin><AdminCollections /></ProtectedRoute>} />
          <Route path="admin/collections" element={<ProtectedRoute requireAdmin><AdminCollections /></ProtectedRoute>} />
          <Route path="admin/collections/criar" element={<ProtectedRoute requireAdmin><AdminCollectionForm /></ProtectedRoute>} />
          <Route path="admin/collections/create" element={<ProtectedRoute requireAdmin><AdminCollectionForm /></ProtectedRoute>} />
          <Route path="admin/collections/editar/:id" element={<ProtectedRoute requireAdmin><AdminCollectionForm /></ProtectedRoute>} />
          <Route path="admin/collections/edit/:id" element={<ProtectedRoute requireAdmin><AdminCollectionForm /></ProtectedRoute>} />
          <Route path="admin/campanhas" element={<ProtectedRoute requireAdmin><AdminCampaigns /></ProtectedRoute>} />
          <Route path="admin/campaigns" element={<ProtectedRoute requireAdmin><AdminCampaigns /></ProtectedRoute>} />
          <Route path="admin/campaigns/criar" element={<ProtectedRoute requireAdmin><AdminCampaignForm /></ProtectedRoute>} />
          <Route path="admin/campaigns/create" element={<ProtectedRoute requireAdmin><AdminCampaignForm /></ProtectedRoute>} />
          <Route path="admin/campaigns/editar/:id" element={<ProtectedRoute requireAdmin><AdminCampaignForm /></ProtectedRoute>} />
          <Route path="admin/campaigns/edit/:id" element={<ProtectedRoute requireAdmin><AdminCampaignForm /></ProtectedRoute>} />
          <Route path="admin/promocoes" element={<ProtectedRoute requireAdmin><AdminPromotions /></ProtectedRoute>} />
          <Route path="admin/promotions" element={<ProtectedRoute requireAdmin><AdminPromotions /></ProtectedRoute>} />
          <Route path="admin/promotions/criar" element={<ProtectedRoute requireAdmin><AdminPromotionForm /></ProtectedRoute>} />
          <Route path="admin/promotions/create" element={<ProtectedRoute requireAdmin><AdminPromotionForm /></ProtectedRoute>} />
          <Route path="admin/promotions/editar/:id" element={<ProtectedRoute requireAdmin><AdminPromotionForm /></ProtectedRoute>} />
          <Route path="admin/promotions/edit/:id" element={<ProtectedRoute requireAdmin><AdminPromotionForm /></ProtectedRoute>} />
          <Route path="admin/cupons" element={<ProtectedRoute requireAdmin><AdminCoupons /></ProtectedRoute>} />
          <Route path="admin/coupons" element={<ProtectedRoute requireAdmin><AdminCoupons /></ProtectedRoute>} />
          <Route path="admin/coupons/criar" element={<ProtectedRoute requireAdmin><AdminCouponForm /></ProtectedRoute>} />
          <Route path="admin/coupons/create" element={<ProtectedRoute requireAdmin><AdminCouponForm /></ProtectedRoute>} />
          <Route path="admin/coupons/editar/:id" element={<ProtectedRoute requireAdmin><AdminCouponForm /></ProtectedRoute>} />
          <Route path="admin/coupons/edit/:id" element={<ProtectedRoute requireAdmin><AdminCouponForm /></ProtectedRoute>} />
          
          {/* Analytics & Reports */}
          <Route path="admin/analytics" element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>} />
          {/* <Route path="admin/relatorios" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} /> */}
          {/* <Route path="admin/relatorios/customizados" element={<ProtectedRoute requireAdmin><AdminCustomReports /></ProtectedRoute>} /> */}
          <Route path="admin/logs" element={<ProtectedRoute requireAdmin><AdminLogs /></ProtectedRoute>} />
          <Route path="admin/logos" element={<ProtectedRoute requireAdmin><AdminLogos /></ProtectedRoute>} />
          <Route path="admin/theme" element={<ProtectedRoute requireAdmin><AdminTheme /></ProtectedRoute>} />
          <Route path="admin/tema" element={<ProtectedRoute requireAdmin><AdminTheme /></ProtectedRoute>} />
          <Route path="admin/menus" element={<ProtectedRoute requireAdmin><AdminMenus /></ProtectedRoute>} />
          <Route path="admin/seo" element={<ProtectedRoute requireAdmin><AdminSEO /></ProtectedRoute>} />
          
          {/* Moderation */}
          <Route path="admin/comentarios" element={<ProtectedRoute requireAdmin><AdminComments /></ProtectedRoute>} />
          <Route path="admin/comments" element={<ProtectedRoute requireAdmin><AdminComments /></ProtectedRoute>} />
          <Route path="admin/direitos-autorais" element={<ProtectedRoute requireAdmin><AdminCopyrightClaims /></ProtectedRoute>} />
          <Route path="admin/copyright-claims" element={<ProtectedRoute requireAdmin><AdminCopyrightClaims /></ProtectedRoute>} />
          <Route path="admin/reports" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} />
          <Route path="admin/reports/analytics" element={<ProtectedRoute requireAdmin><AdminReportAnalytics /></ProtectedRoute>} />
          <Route path="admin/reports/logs" element={<ProtectedRoute requireAdmin><AdminReportLogs /></ProtectedRoute>} />
          <Route path="admin/reports/custom" element={<ProtectedRoute requireAdmin><AdminCustomReports /></ProtectedRoute>} />
          <Route path="admin/royalties" element={<ProtectedRoute requireAdmin><AdminRoyalties /></ProtectedRoute>} />
          <Route path="admin/composers/royalties" element={<ProtectedRoute requireAdmin><AdminRoyalties /></ProtectedRoute>} />
          
          {/* Settings */}
          <Route path="admin/settings/general" element={<ProtectedRoute requireAdmin><AdminSettingsGeneral /></ProtectedRoute>} />
          <Route path="admin/settings/users" element={<ProtectedRoute requireAdmin><AdminSettingsUsers /></ProtectedRoute>} />
          <Route path="admin/settings/composers" element={<ProtectedRoute requireAdmin><AdminSettingsComposers /></ProtectedRoute>} />
          <Route path="admin/settings/premium" element={<ProtectedRoute requireAdmin><AdminSettingsPremium /></ProtectedRoute>} />
          <Route path="admin/settings/email" element={<ProtectedRoute requireAdmin><AdminSettingsEmail /></ProtectedRoute>} />
          <Route path="admin/settings/security" element={<ProtectedRoute requireAdmin><AdminSettingsSecurity /></ProtectedRoute>} />
          <Route path="admin/settings/integrations" element={<ProtectedRoute requireAdmin><AdminSettingsIntegrations /></ProtectedRoute>} />
          
          {/* Customization - Temporariamente desabilitado */}
          {/* <Route path="admin/seo" element={<ProtectedRoute requireAdmin><AdminSEO /></ProtectedRoute>} /> */}
          {/* <Route path="admin/menus" element={<ProtectedRoute requireAdmin><AdminMenus /></ProtectedRoute>} /> */}
          {/* <Route path="admin/tema" element={<ProtectedRoute requireAdmin><AdminTheme /></ProtectedRoute>} /> */}
          {/* <Route path="admin/logos" element={<ProtectedRoute requireAdmin><AdminLogos /></ProtectedRoute>} /> */}
          
          {/* System - Temporariamente desabilitado */}
          <Route path="admin/backup" element={<ProtectedRoute requireAdmin><AdminBackup /></ProtectedRoute>} />
          <Route path="admin/backup/criar" element={<ProtectedRoute requireAdmin><AdminBackupForm /></ProtectedRoute>} />
          <Route path="admin/backup/create" element={<ProtectedRoute requireAdmin><AdminBackupForm /></ProtectedRoute>} />
          <Route path="admin/importar" element={<ProtectedRoute requireAdmin><AdminImport /></ProtectedRoute>} />
          <Route path="admin/import" element={<ProtectedRoute requireAdmin><AdminImport /></ProtectedRoute>} />
          <Route path="admin/import/criar" element={<ProtectedRoute requireAdmin><AdminImportForm /></ProtectedRoute>} />
          <Route path="admin/import/create" element={<ProtectedRoute requireAdmin><AdminImportForm /></ProtectedRoute>} />
          <Route path="admin/exportar" element={<ProtectedRoute requireAdmin><AdminExport /></ProtectedRoute>} />
          <Route path="admin/export" element={<ProtectedRoute requireAdmin><AdminExport /></ProtectedRoute>} />
          <Route path="admin/export/criar" element={<ProtectedRoute requireAdmin><AdminExportForm /></ProtectedRoute>} />
          <Route path="admin/export/create" element={<ProtectedRoute requireAdmin><AdminExportForm /></ProtectedRoute>} />
          <Route path="admin/api" element={<ProtectedRoute requireAdmin><AdminAPI /></ProtectedRoute>} />
          <Route path="admin/api/criar" element={<ProtectedRoute requireAdmin><AdminAPIForm /></ProtectedRoute>} />
          <Route path="admin/api/create" element={<ProtectedRoute requireAdmin><AdminAPIForm /></ProtectedRoute>} />
          <Route path="admin/biblia-narrada" element={<ProtectedRoute requireAdmin><AdminBibleNarrated /></ProtectedRoute>} />
          <Route path="admin/bible-narrated" element={<ProtectedRoute requireAdmin><AdminBibleNarrated /></ProtectedRoute>} />
          <Route path="admin/bible-narrated/criar" element={<ProtectedRoute requireAdmin><AdminBibleNarratedForm /></ProtectedRoute>} />
          <Route path="admin/bible-narrated/create" element={<ProtectedRoute requireAdmin><AdminBibleNarratedForm /></ProtectedRoute>} />
          <Route path="admin/bible-narrated/editar/:id" element={<ProtectedRoute requireAdmin><AdminBibleNarratedForm /></ProtectedRoute>} />
          <Route path="admin/bible-narrated/edit/:id" element={<ProtectedRoute requireAdmin><AdminBibleNarratedForm /></ProtectedRoute>} />
        </Route>
      </Routes>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <NotificationsProvider>
            <PlayerProvider>
              <MobileMenuProvider>
                <GlobalAudioPlayer />
                <AppContent />
              </MobileMenuProvider>
            </PlayerProvider>
          </NotificationsProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;

