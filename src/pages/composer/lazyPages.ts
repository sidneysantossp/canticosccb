import { lazyWithChunkRecovery } from '@/utils/chunkLoadRecovery';

export const ComposerDashboard = lazyWithChunkRecovery(() => import('./ComposerDashboard'));
export const ComposerProfile = lazyWithChunkRecovery(() => import('./ComposerProfile'));
export const ComposerSongs = lazyWithChunkRecovery(() => import('./ComposerSongs'));
export const ComposerCreateSong = lazyWithChunkRecovery(() => import('./ComposerCreateSong'));
export const ComposerManagers = lazyWithChunkRecovery(() => import('./ComposerManagers'));
export const ComposerUploadSong = lazyWithChunkRecovery(() => import('./ComposerUploadSong'));
export const ComposerAlbums = lazyWithChunkRecovery(() => import('./ComposerAlbums'));
export const ComposerCreateAlbum = lazyWithChunkRecovery(() => import('./ComposerCreateAlbum'));
export const ComposerEditAlbum = lazyWithChunkRecovery(() => import('./ComposerEditAlbum'));
export const ComposerAnalytics = lazyWithChunkRecovery(() => import('./ComposerAnalytics'));
export const ComposerFollowers = lazyWithChunkRecovery(() => import('./ComposerFollowers'));
export const ComposerNotifications = lazyWithChunkRecovery(() => import('./ComposerNotifications'));
export const ComposerCopyrightClaims = lazyWithChunkRecovery(() => import('./ComposerCopyrightClaims'));
export const ComposerOnboarding = lazyWithChunkRecovery(() => import('./ComposerOnboarding'));
export const ComposerTrending = lazyWithChunkRecovery(() => import('./ComposerTrending'));
export const ComposerLiked = lazyWithChunkRecovery(() => import('./ComposerLiked'));
export const ComposerHistory = lazyWithChunkRecovery(() => import('./ComposerHistory'));
