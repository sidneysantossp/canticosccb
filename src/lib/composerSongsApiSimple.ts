// STUB temporário - Substituir com implementação real quando backend estiver pronto
export const getComposerSongs = async (...args: any[]) => [];
export const getComposerSong = async (...args: any[]) => null;
export const createSong = async (...args: any[]) => ({ success: true, id: 'mock-id' });
export const updateSong = async (...args: any[]) => ({ success: true });
export const deleteSong = async (...args: any[]) => ({ success: true });
export const publishSong = async (...args: any[]) => ({ success: true });
export const getComposerSongStats = async (...args: any[]) => ({
  total: 0,
  published: 0,
  draft: 0,
  pending: 0,
  totalPlays: 0,
  totalLikes: 0,
  averageRating: 0
});
export const getComposerSongTrends = async (...args: any[]) => [];

export type ComposerSong = any;
export type ComposerSongStats = any;
export type SongTrend = any;
