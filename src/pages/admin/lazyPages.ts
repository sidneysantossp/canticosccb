import { lazy } from 'react';

// Dashboard & Analytics
export const AdminDashboard = lazy(() => import('./AdminDashboard'));
export const AdminAnalytics = lazy(() => import('./AdminAnalytics'));

// Content Management
export const AdminSongs = lazy(() => import('./AdminSongs'));
export const AdminSongForm = lazy(() => import('./AdminSongForm'));
export const AdminSongsPending = lazy(() => import('./songs/AdminSongsPending'));
export const AdminAlbums = lazy(() => import('./AdminAlbums'));
export const AdminCollections = lazy(() => import('./AdminCollections'));
export const AdminCategories = lazy(() => import('./AdminCategories'));
export const AdminGenres = lazy(() => import('./AdminGenres'));
export const AdminTags = lazy(() => import('./AdminTags'));

// Users
export const AdminUsers = lazy(() => import('./AdminUsers'));
export const AdminUsersPremium = lazy(() => import('./AdminUsersPremium'));
export const AdminPlaylists = lazy(() => import('./playlists/AdminPlaylists'));

// Composers
export const AdminComposers = lazy(() => import('./AdminComposers'));
export const AdminComposerForm = lazy(() => import('./AdminComposerForm'));
export const AdminComposersPending = lazy(() => import('./AdminComposersPending'));
export const AdminComposersVerified = lazy(() => import('./AdminComposersVerified'));
export const AdminRoyalties = lazy(() => import('./AdminRoyalties'));

// Moderation
export const AdminApprovals = lazy(() => import('./approvals/AdminApprovals'));
export const AdminReports = lazy(() => import('./AdminReports'));
export const AdminComments = lazy(() => import('./AdminComments'));

// Appearance
export const AdminBanners = lazy(() => import('./AdminBanners'));
export const AdminLogos = lazy(() => import('./AdminLogos'));
export const AdminTheme = lazy(() => import('./AdminTheme'));
export const AdminMenus = lazy(() => import('./AdminMenus'));
export const AdminSEO = lazy(() => import('./AdminSEO'));

// Reports
export const AdminCustomReports = lazy(() => import('./AdminCustomReports'));
export const AdminLogs = lazy(() => import('./AdminLogs'));

// Settings
export const AdminSettings = lazy(() => import('./AdminSettings'));
export const AdminSettingsGeneral = lazy(() => import('./AdminSettingsGeneral'));
export const AdminSettingsUsers = lazy(() => import('./AdminSettingsUsers'));
export const AdminSettingsComposers = lazy(() => import('./AdminSettingsComposers'));
export const AdminSettingsPremium = lazy(() => import('./AdminSettingsPremium'));
export const AdminSettingsEmail = lazy(() => import('./AdminSettingsEmail'));
export const AdminSettingsSecurity = lazy(() => import('./AdminSettingsSecurity'));
export const AdminSettingsIntegrations = lazy(() => import('./AdminSettingsIntegrations'));

// Marketing
export const AdminFeatured = lazy(() => import('./AdminFeatured'));
export const AdminPlaylistsEditorial = lazy(() => import('./AdminPlaylistsEditorial'));
export const AdminPromotions = lazy(() => import('./AdminPromotions'));
export const AdminCoupons = lazy(() => import('./AdminCoupons'));
export const AdminCampaigns = lazy(() => import('./AdminCampaigns'));

// Tools
export const AdminImport = lazy(() => import('./AdminImport'));
export const AdminExport = lazy(() => import('./AdminExport'));
export const AdminBackup = lazy(() => import('./AdminBackup'));
export const AdminAPI = lazy(() => import('./AdminAPI'));
