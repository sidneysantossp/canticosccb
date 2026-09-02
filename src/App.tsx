import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ScrollToTop from '@/components/ScrollToTop';
import '@/styles/globals.css';
import DevIconLabPage from '@/pages/DevIconLabPage';
import {
  AboutPage,
  AjudaPage,
  AlbumDetailPage,
  AlbumsPage,
  AuthCallbackPage,
  AvisoDetailPage,
  AvisosPage,
  BibleHubPage,
  BibleBookPage,
  BibleChapterPage,
  BibleExplorePage,
  BibliaNarradaPage,
  CategoriesPage,
  CategoryPage,
  ChatPage,
  CifraInstrumentHubPage,
  CifrasHubPage,
  CifraPage,
  CifrasListPage,
  CifrasLandingPage,
  CompositorCadastroPage,
  CompositorPublicarPage,
  ComposerPublicProfilePage,
  CompositoresPage,
  ContentClaimPage,
  ContatoPage,
  CookiesPolicyPage,
  DisclaimerPage,
  DownloadIntentPage,
  DownloadsPage,
  EditProfilePage,
  ForgotPasswordPage,
  HistoryPage,
  HomeAlternativePage,
  HomePage,
  HinosHubPage,
  HinarioRangePage,
  HymnDetailPage,
  HymnHubPage,
  HinarioListPage,
  HinarioTopicPage,
  HinarioViewPage,
  InstrumentaisPage,
  LibraryPage,
  LGPDPage,
  LikedSongsPage,
  LoginPage,
  ManageComposersPage,
  ManagerInvitesPage,
  NotificationsPage,
  NotFoundPage,
  OnboardingPage,
  PlaylistDetailPage,
  PlaylistsPage,
  PrivacyPolicyPage,
  ProfilePage,
  RadioPage,
  RegisterPage,
  ResetPasswordPage,
  SearchPage,
  SettingsPageNew,
  SubscriptionPage,
  TermsOfUsePage,
  TrendsPage,
  VerifyEmailPage,
  CreatePlaylistPage,
} from '@/pages/lazyPages';
import {
  ComposerAlbums,
  ComposerAnalytics,
  ComposerCopyrightClaims,
  ComposerCreateAlbum,
  ComposerCreateSong,
  ComposerDashboard,
  ComposerEditAlbum,
  ComposerFollowers,
  ComposerHistory,
  ComposerLiked,
  ComposerManagers,
  ComposerNotifications,
  ComposerOnboarding,
  ComposerProfile,
  ComposerSongs,
  ComposerTrending,
  ComposerUploadSong,
} from '@/pages/composer/lazyPages';
import {
  AdminAlbumForm,
  AdminAlbumsPending,
  AdminAlbums,
  AdminAnalytics,
  AdminAPI,
  AdminAPIForm,
  AdminApprovals,
  AdminBackup,
  AdminBackupForm,
  AdminBannerForm,
  AdminBanners,
  AdminBibleNarrated,
  AdminBibleNarratedForm,
  AdminBibleAudio,
  AdminCampaignForm,
  AdminCampaigns,
  AdminChat,
  AdminCategories,
  AdminCategoryForm,
  AdminCifraForm,
  AdminCifraChordShapes,
  AdminCifraMigrationPage,
  AdminCifraReview,
  AdminCifraV2Editor,
  AdminCifras,
  AdminCollectionForm,
  AdminCollections,
  AdminComments,
  AdminComposerForm,
  AdminComposers,
  AdminComposersPending,
  AdminComposersVerified,
  AdminCopyrightClaims,
  AdminCouponForm,
  AdminCoupons,
  AdminCustomReports,
  AdminDashboard,
  AdminExport,
  AdminExportForm,
  AdminFeatured,
  AdminFeaturedForm,
  AdminGenreForm,
  AdminGenres,
  AdminHinario,
  AdminHinarioForm,
  AdminHymnForm,
  AdminHymns,
  AdminImport,
  AdminImportForm,
  AdminArchiveRecovery,
  AdminLogs,
  AdminLogos,
  AdminMenus,
  AdminNoticeForm,
  AdminNotices,
  AdminPlaylistForm,
  AdminPlaylists,
  AdminPlaylistsEditorial,
  AdminPromotionForm,
  AdminPromotions,
  AdminReportAnalytics,
  AdminReportDetail,
  AdminReportLogs,
  AdminReports,
  AdminRoyalties,
  AdminSEO,
  AdminSettingsComposers,
  AdminSettingsEmail,
  AdminSettingsGeneral,
  AdminSettingsIntegrations,
  AdminSettingsSecurity,
  AdminSettingsUsers,
  AdminSongDetails,
  AdminSongForm,
  AdminSongs,
  AdminSongsPending,
  AdminTagForm,
  AdminTags,
  AdminTheme,
  AdminUserEdit,
  AdminUserForm,
  AdminUsers,
  AdminYoutubeImport,
} from '@/pages/admin/lazyPages';
import SiteConfigRuntime from '@/components/SiteConfigRuntime';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedComposerRoute from '@/components/ProtectedComposerRoute';
import { Navigate, useLocation, useParams as useRouteParams } from 'react-router-dom';
import { lazyWithChunkRecovery } from '@/utils/chunkLoadRecovery';
import CifraContributionPage from '@/pages/CifraContributionPage';
import CifraContributionsDashboard from '@/pages/CifraContributionsDashboard';
import AdminCifraContributions from '@/pages/admin/AdminCifraContributions';
import ContentCopyProtection from '@/components/ContentCopyProtection';

const AppRuntime = lazyWithChunkRecovery(() => import('@/components/app/AppRuntime'));
const Layout = lazyWithChunkRecovery(() => import('@/components/layout/Layout'));

const protectContent = (content: React.ReactNode) => (
  <ContentCopyProtection>{content}</ContentCopyProtection>
);

const RedirectToCategoria: React.FC = () => {
  const { slug } = useRouteParams();
  return <Navigate to={`/categoria/${slug}`} replace />;
};

const RedirectToCifra: React.FC = () => {
  const { slug } = useRouteParams();
  return <Navigate to={`/cifra/${slug}`} replace />;
};

const CifraInstrumentRoute: React.FC = () => {
  const { instrument } = useRouteParams();
  if (instrument !== 'violao' && instrument !== 'ukulele' && instrument !== 'teclado') {
    return <Navigate to="/cifras" replace />;
  }
  return <CifraInstrumentHubPage instrument={instrument} />;
};

const NOINDEX_EXACT_PATHS = new Set([
  '/login',
  '/register',
  '/cadastro',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/onboarding',
  '/compositor/cadastro',
  '/compositor/publicar',
  '/compositor/onboarding',
]);

const NOINDEX_PREFIXES = [
  '/perfil',
  '/profile',
  '/edit-profile',
  '/biblioteca',
  '/library',
  '/favoritos',
  '/liked-songs',
  '/liked',
  '/historico',
  '/history',
  '/downloads',
  '/notifications',
  '/notificacoes',
  '/chat',
  '/suporte',
  '/support',
  '/configuracoes',
  '/settings',
  '/assinatura',
  '/subscription',
  '/playlist/criar',
  '/manage-composers',
  '/manager-invites',
  '/composer',
  '/admin',
  '/compositor/dashboard',
  '/compositor/perfil',
  '/compositor/gerentes',
  '/compositor/musicas',
  '/compositor/musica',
  '/compositor/albuns',
  '/compositor/album',
  '/compositor/hino',
  '/compositor/analytics',
  '/compositor/seguidores',
  '/compositor/notificacoes',
  '/compositor/direitos-autorais',
];

const RouteRobots: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();
  const shouldNoindex =
    NOINDEX_EXACT_PATHS.has(pathname) ||
    NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!shouldNoindex) return null;

  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
    </Helmet>
  );
};

const AppContent: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <ScrollToTop />
      <RouteRobots />
      <Routes>
        {/* Public Routes - No Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public Routes - With Layout */}
        <Route path="/" element={<Layout />}>
          <Route path="dev/icons" element={<DevIconLabPage />} />
          {/* Home */}
          <Route index element={<HomePage />} />
          <Route path="home-alt" element={<HomeAlternativePage />} />

          {/* Browse */}
          <Route path="buscar" element={<SearchPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="hino/:id" element={<HymnDetailPage />} />
          <Route path="hymn/:id" element={<HymnDetailPage />} />
          <Route path="cifras" element={protectContent(<CifrasLandingPage />)} />
          <Route path="cifras/:instrument" element={protectContent(<CifraInstrumentRoute />)} />
          <Route path="cifras-hinos-ccb" element={protectContent(<CifrasHubPage />)} />
          <Route path="cifras-violao-ccb" element={protectContent(<CifraInstrumentHubPage instrument="violao" />)} />
          <Route path="cifras-ukulele-ccb" element={protectContent(<CifraInstrumentHubPage instrument="ukulele" />)} />
          <Route path="cifras-teclado-ccb" element={protectContent(<CifraInstrumentHubPage instrument="teclado" />)} />
          <Route path="cifras/:instrument/:slug" element={protectContent(<CifraPage />)} />
          <Route path="cifra/:slug" element={protectContent(<CifraPage />)} />
          <Route path="profile/cifras/contribuir" element={<ProtectedRoute><CifraContributionPage /></ProtectedRoute>} />
          <Route path="hinario" element={protectContent(<HinarioListPage />)} />
          <Route path="hinos-ccb" element={<HinosHubPage />} />
          <Route path="hinos-1-a-120-ccb" element={protectContent(<HinarioRangePage rangeKey="1-120" />)} />
          <Route path="hinos-121-a-240-ccb" element={protectContent(<HinarioRangePage rangeKey="121-240" />)} />
          <Route path="hinos-241-a-360-ccb" element={protectContent(<HinarioRangePage rangeKey="241-360" />)} />
          <Route path="hinos-361-a-480-ccb" element={protectContent(<HinarioRangePage rangeKey="361-480" />)} />
          <Route path="hinario-5-ccb" element={protectContent(<HinarioTopicPage topic="hinario5" />)} />
          <Route path="hinario/:slug" element={protectContent(<HinarioViewPage />)} />
          <Route path="letras-hinos-ccb" element={protectContent(<HinarioTopicPage topic="letras" />)} />
          <Route path="hinos-cantados-ccb" element={<HymnHubPage hub="cantados" />} />
          <Route path="hinos-tocados-ccb" element={<HymnHubPage hub="tocados" />} />
          <Route path="hinos-avulsos-ccb" element={<HymnHubPage hub="avulsos" />} />
          <Route path="albuns" element={<AlbumsPage />} />
          <Route path="album/:id" element={<AlbumDetailPage />} />
          <Route path="compositores" element={<CompositoresPage />} />
          <Route path="compositor/:id" element={<ComposerPublicProfilePage />} />
          <Route path="artist/:id" element={<ComposerPublicProfilePage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categoria/:slug" element={<CategoryPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          {/* Redirects para URLs antigas indexadas pelo Google */}
          <Route path="categorias/:slug" element={<RedirectToCategoria />} />
          <Route path="cifras/:slug" element={<RedirectToCifra />} />
          <Route path="terms" element={<Navigate to="/termos" replace />} />
          <Route path="playlist/:id" element={<PlaylistDetailPage />} />
          <Route path="tendencias" element={<TrendsPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="recem-chegados" element={<TrendsPage />} />

          {/* Legal */}
          <Route path="termos" element={<TermsOfUsePage />} />
          <Route path="privacidade" element={<PrivacyPolicyPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="disclaimer" element={<DisclaimerPage />} />
          <Route path="sobre" element={<AboutPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="cookies" element={<CookiesPolicyPage />} />
          <Route path="reivindicacao-de-conteudo" element={<ContentClaimPage />} />
          <Route path="content-claim" element={<ContentClaimPage />} />
          <Route path="lgpd" element={<LGPDPage />} />
          <Route path="premium" element={<Navigate to="/cadastro" replace />} />
          <Route path="instrumentais" element={<InstrumentaisPage />} />
          <Route path="biblia-ccb" element={protectContent(<BibleHubPage />)} />
          <Route path="biblia-ccb/busca" element={protectContent(<BibleExplorePage section="busca" />)} />
          <Route path="biblia-ccb/temas" element={protectContent(<BibleExplorePage section="temas" />)} />
          <Route path="biblia-ccb/personagens" element={protectContent(<BibleExplorePage section="personagens" />)} />
          <Route path="biblia-ccb/dicionario" element={protectContent(<BibleExplorePage section="dicionario" />)} />
          <Route path="biblia-ccb/:bookSlug/:chapterSlug" element={protectContent(<BibleChapterPage />)} />
          <Route path="biblia-ccb/:bookSlug" element={protectContent(<BibleBookPage />)} />
          <Route path="biblia-narrada" element={protectContent(<BibliaNarradaPage />)} />
          <Route path="baixar-hinos-ccb" element={<DownloadIntentPage topic="hinos" />} />
          <Route path="baixar-albuns-ccb" element={<DownloadIntentPage topic="albuns" />} />
          <Route path="baixar-cds-ccb" element={<DownloadIntentPage topic="cds" />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="radio" element={<RadioPage />} />
          <Route path="compositor/cadastro" element={<CompositorCadastroPage />} />
          <Route path="compositor/onboarding" element={<ComposerOnboarding />} />
          <Route path="compositor/publicar" element={<CompositorPublicarPage />} />
          <Route path="ajuda" element={<AjudaPage />} />
          <Route path="contato" element={<ContatoPage />} />
          <Route path="avisos" element={<AvisosPage />} />
          <Route path="avisos/:id" element={<AvisoDetailPage />} />

          {/* User Routes - Protected */}
          <Route path="perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="perfil/editar" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
          {/* English aliases */}
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="profile/cifras" element={<ProtectedRoute><CifraContributionsDashboard /></ProtectedRoute>} />
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
          <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="suporte" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="support" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="configuracoes" element={<ProtectedRoute><SettingsPageNew /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><SettingsPageNew /></ProtectedRoute>} />
          <Route path="assinatura" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="playlist/criar" element={<ProtectedRoute><CreatePlaylistPage /></ProtectedRoute>} />
          <Route path="manage-composers" element={<ProtectedRoute><ManageComposersPage /></ProtectedRoute>} />
          <Route path="manager-invites" element={<ProtectedRoute><ManagerInvitesPage /></ProtectedRoute>} />

          {/* Composer Routes - Protected + Verified Composer Only */}
          <Route path="composer" element={<ProtectedComposerRoute><ComposerDashboard /></ProtectedComposerRoute>} />
          <Route path="composer/dashboard" element={<ProtectedComposerRoute><ComposerDashboard /></ProtectedComposerRoute>} />
          <Route path="composer/cifras" element={<ProtectedComposerRoute><CifraContributionsDashboard /></ProtectedComposerRoute>} />
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
          <Route path="compositor/performance" element={<ProtectedComposerRoute><ComposerAnalytics /></ProtectedComposerRoute>} />
          <Route path="composer/analytics" element={<ProtectedComposerRoute><ComposerAnalytics /></ProtectedComposerRoute>} />
          <Route path="composer/performance" element={<ProtectedComposerRoute><ComposerAnalytics /></ProtectedComposerRoute>} />
          <Route path="compositor/seguidores" element={<ProtectedComposerRoute><ComposerFollowers /></ProtectedComposerRoute>} />
          <Route path="composer/followers" element={<ProtectedComposerRoute><ComposerFollowers /></ProtectedComposerRoute>} />
          <Route path="compositor/notificacoes" element={<ProtectedComposerRoute><ComposerNotifications /></ProtectedComposerRoute>} />
          <Route path="composer/notifications" element={<ProtectedComposerRoute><ComposerNotifications /></ProtectedComposerRoute>} />
          <Route path="compositor/direitos-autorais" element={<ProtectedComposerRoute><ComposerCopyrightClaims /></ProtectedComposerRoute>} />
          <Route path="composer/copyright-claims" element={<ProtectedComposerRoute><ComposerCopyrightClaims /></ProtectedComposerRoute>} />
          {/* compositor/onboarding is public - it has its own signup form */}
          <Route path="composer/trending" element={<ProtectedComposerRoute><ComposerTrending /></ProtectedComposerRoute>} />
          <Route path="composer/liked" element={<ProtectedComposerRoute><ComposerLiked /></ProtectedComposerRoute>} />
          <Route path="composer/history" element={<ProtectedComposerRoute><ComposerHistory /></ProtectedComposerRoute>} />

          {/* Admin Routes - Protected + Admin Role */}
          <Route path="admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/approvals" element={<ProtectedRoute requireAdmin><AdminApprovals /></ProtectedRoute>} />

          {/* Users Management */}
          <Route path="admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="admin/users/criar" element={<ProtectedRoute requireAdmin><AdminUserForm /></ProtectedRoute>} />
          <Route path="admin/users/create" element={<ProtectedRoute requireAdmin><AdminUserForm /></ProtectedRoute>} />
          <Route path="admin/users/editar/:id" element={<ProtectedRoute requireAdmin><AdminUserEdit /></ProtectedRoute>} />
          <Route path="admin/users/edit/:id" element={<ProtectedRoute requireAdmin><AdminUserEdit /></ProtectedRoute>} />
          <Route path="admin/usuarios/editar/:id" element={<ProtectedRoute requireAdmin><AdminUserEdit /></ProtectedRoute>} />
          <Route path="admin/usuarios/premium" element={<ProtectedRoute requireAdmin><Navigate to="/admin/users" replace /></ProtectedRoute>} />
          <Route path="admin/users/premium" element={<ProtectedRoute requireAdmin><Navigate to="/admin/users" replace /></ProtectedRoute>} />

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
          <Route path="admin/chat" element={<ProtectedRoute requireAdmin><AdminChat /></ProtectedRoute>} />
          <Route path="admin/support" element={<ProtectedRoute requireAdmin><AdminChat /></ProtectedRoute>} />
          <Route path="admin/moderation/chat" element={<ProtectedRoute requireAdmin><AdminChat /></ProtectedRoute>} />

          {/* Content Management */}
          <Route path="admin/hinos" element={<ProtectedRoute requireAdmin><AdminHymns /></ProtectedRoute>} />
          <Route path="admin/hymns" element={<ProtectedRoute requireAdmin><AdminHymns /></ProtectedRoute>} />
          <Route path="admin/hino/criar" element={<ProtectedRoute requireAdmin><AdminHymnForm /></ProtectedRoute>} />
          <Route path="admin/hino/editar/:id" element={<ProtectedRoute requireAdmin><AdminHymnForm /></ProtectedRoute>} />
          <Route path="admin/hino/importar-youtube" element={<ProtectedRoute requireAdmin><AdminYoutubeImport /></ProtectedRoute>} />
          <Route path="admin/musicas" element={<ProtectedRoute requireAdmin><AdminSongs /></ProtectedRoute>} />
          <Route path="admin/songs" element={<ProtectedRoute requireAdmin><AdminSongs /></ProtectedRoute>} />
          <Route path="admin/songs/:id" element={<ProtectedRoute requireAdmin><AdminSongDetails /></ProtectedRoute>} />
          <Route path="admin/musicas/pendentes" element={<ProtectedRoute requireAdmin><AdminSongsPending /></ProtectedRoute>} />
          <Route path="admin/songs/pending" element={<ProtectedRoute requireAdmin><AdminSongsPending /></ProtectedRoute>} />
          <Route path="admin/albuns/pendentes" element={<ProtectedRoute requireAdmin><AdminAlbumsPending /></ProtectedRoute>} />
          <Route path="admin/albums/pending" element={<ProtectedRoute requireAdmin><AdminAlbumsPending /></ProtectedRoute>} />
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
          <Route path="admin/users/playlists" element={<ProtectedRoute requireAdmin><AdminPlaylists /></ProtectedRoute>} />
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
          <Route path="admin/reports/:id" element={<ProtectedRoute requireAdmin><AdminReportDetail /></ProtectedRoute>} />
          <Route path="admin/reports/analytics" element={<ProtectedRoute requireAdmin><AdminReportAnalytics /></ProtectedRoute>} />
          <Route path="admin/reports/logs" element={<ProtectedRoute requireAdmin><AdminReportLogs /></ProtectedRoute>} />
          <Route path="admin/reports/custom" element={<ProtectedRoute requireAdmin><AdminCustomReports /></ProtectedRoute>} />
          <Route path="admin/royalties" element={<ProtectedRoute requireAdmin><AdminRoyalties /></ProtectedRoute>} />
          <Route path="admin/composers/royalties" element={<ProtectedRoute requireAdmin><AdminRoyalties /></ProtectedRoute>} />

          {/* Settings */}
          <Route path="admin/settings/general" element={<ProtectedRoute requireAdmin><AdminSettingsGeneral /></ProtectedRoute>} />
          <Route path="admin/settings/users" element={<ProtectedRoute requireAdmin><AdminSettingsUsers /></ProtectedRoute>} />
          <Route path="admin/settings/composers" element={<ProtectedRoute requireAdmin><AdminSettingsComposers /></ProtectedRoute>} />
          <Route path="admin/settings/premium" element={<ProtectedRoute requireAdmin><Navigate to="/admin/settings/users" replace /></ProtectedRoute>} />
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
          <Route path="admin/recuperacao-midias" element={<ProtectedRoute requireAdmin><AdminArchiveRecovery /></ProtectedRoute>} />
          <Route path="admin/exportar" element={<ProtectedRoute requireAdmin><AdminExport /></ProtectedRoute>} />
          <Route path="admin/export" element={<ProtectedRoute requireAdmin><AdminExport /></ProtectedRoute>} />
          <Route path="admin/export/criar" element={<ProtectedRoute requireAdmin><AdminExportForm /></ProtectedRoute>} />
          <Route path="admin/export/create" element={<ProtectedRoute requireAdmin><AdminExportForm /></ProtectedRoute>} />
          <Route path="admin/api" element={<ProtectedRoute requireAdmin><AdminAPI /></ProtectedRoute>} />
          <Route path="admin/api/criar" element={<ProtectedRoute requireAdmin><AdminAPIForm /></ProtectedRoute>} />
          <Route path="admin/api/create" element={<ProtectedRoute requireAdmin><AdminAPIForm /></ProtectedRoute>} />
          {/* Notices Management */}
          <Route path="admin/notices" element={<ProtectedRoute requireAdmin><AdminNotices /></ProtectedRoute>} />
          <Route path="admin/notices/create" element={<ProtectedRoute requireAdmin><AdminNoticeForm /></ProtectedRoute>} />
          <Route path="admin/notices/edit/:id" element={<ProtectedRoute requireAdmin><AdminNoticeForm /></ProtectedRoute>} />

          <Route path="admin/biblia-narrada" element={<ProtectedRoute requireAdmin><AdminBibleNarrated /></ProtectedRoute>} />
          <Route path="admin/bible-narrated" element={<ProtectedRoute requireAdmin><AdminBibleNarrated /></ProtectedRoute>} />
          <Route path="admin/bible-narrated/criar" element={<ProtectedRoute requireAdmin><AdminBibleNarratedForm /></ProtectedRoute>} />
          <Route path="admin/bible-narrated/create" element={<ProtectedRoute requireAdmin><AdminBibleNarratedForm /></ProtectedRoute>} />
          <Route path="admin/bible-narrated/editar/:id" element={<ProtectedRoute requireAdmin><AdminBibleNarratedForm /></ProtectedRoute>} />
          <Route path="admin/bible-narrated/edit/:id" element={<ProtectedRoute requireAdmin><AdminBibleNarratedForm /></ProtectedRoute>} />
          <Route path="admin/biblia-em-audio" element={<ProtectedRoute requireAdmin><AdminBibleAudio /></ProtectedRoute>} />
          <Route path="admin/bible-audio" element={<ProtectedRoute requireAdmin><AdminBibleAudio /></ProtectedRoute>} />

          {/* Cifras Management */}
          <Route path="admin/cifras" element={<ProtectedRoute requireAdmin><AdminCifras /></ProtectedRoute>} />
          <Route path="admin/cifras/new" element={<ProtectedRoute requireAdmin><AdminCifraForm /></ProtectedRoute>} />
          <Route path="admin/cifras/:id/edit" element={<ProtectedRoute requireAdmin><AdminCifraForm /></ProtectedRoute>} />
          <Route path="admin/cifras/:id/migrate" element={<ProtectedRoute requireAdmin><AdminCifraMigrationPage /></ProtectedRoute>} />
          <Route path="admin/cifras-v2/revisao" element={<ProtectedRoute requireAdmin><AdminCifraReview /></ProtectedRoute>} />
          <Route path="admin/cifras-contribuicoes" element={<ProtectedRoute requireAdmin><AdminCifraContributions /></ProtectedRoute>} />
          <Route path="admin/cifras-v2/new" element={<ProtectedRoute requireAdmin><AdminCifraV2Editor /></ProtectedRoute>} />
          <Route path="admin/cifras-v2/versions/:versionId/edit" element={<ProtectedRoute requireAdmin><AdminCifraV2Editor /></ProtectedRoute>} />
          <Route path="admin/cifras-v2/shapes" element={<ProtectedRoute requireAdmin><AdminCifraChordShapes /></ProtectedRoute>} />

          {/* Hinário Management */}
          <Route path="admin/hinario" element={<ProtectedRoute requireAdmin><AdminHinario /></ProtectedRoute>} />
          <Route path="admin/hinario/new" element={<ProtectedRoute requireAdmin><AdminHinarioForm /></ProtectedRoute>} />
          <Route path="admin/hinario/:id/edit" element={<ProtectedRoute requireAdmin><AdminHinarioForm /></ProtectedRoute>} />

          {/* 404 - Catch All */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
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
                <SiteConfigRuntime />
                <Suspense fallback={null}>
                  <AppRuntime />
                </Suspense>
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
