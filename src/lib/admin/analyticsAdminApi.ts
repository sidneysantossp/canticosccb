// TODO: Integrar com Supabase analytics quando disponível
export const getAll = async (...args: any[]) => [];
export const getById = async (...args: any[]) => null;
export const create = async (...args: any[]) => ({ success: true });
export const update = async (...args: any[]) => ({ success: true });
export const deleteItem = async (...args: any[]) => ({ success: true });
export const getTopSongs = async (limit: number = 10) => {
  return [];
};
export const getPlaysByDay = async (period: number = 30) => {
  return [];
};
export const getGenreStats = async () => {
  return [];
};
export const getUserGrowth = async (period: number = 30) => {
  return [];
};
export const getAnalyticsSummary = async (...args: any[]) => ({ 
  totalPlays: 0, 
  totalLikes: 0, 
  totalSongs: 0, 
  totalUsers: 0 
});
export const getSiteSettings = async (...args: any[]) => ({});
export const updateSiteSettings = async (...args: any[]) => ({ success: true });
export const getComments = async (...args: any[]) => [];
export const deleteComment = async (...args: any[]) => ({ success: true });
export const approveComment = async (...args: any[]) => ({ success: true });
export const getClaims = async (...args: any[]) => [];
export const getCopyrightClaims = async (...args: any[]) => [];
export const updateClaim = async (...args: any[]) => ({ success: true });
export const getRoyalties = async (...args: any[]) => [];
export const processPayment = async (...args: any[]) => ({ success: true });
export const getAllPlaylists = async (...args: any[]) => [];
export const createPlaylist = async (...args: any[]) => ({ success: true });
export const updatePlaylist = async (...args: any[]) => ({ success: true });
export const deletePlaylist = async (...args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
