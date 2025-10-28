// STUB temporário - Substituir com implementação real quando backend estiver pronto
export const getAll = async (...args: any[]) => [];
export const getById = async (...args: any[]) => null;
export const create = async (...args: any[]) => ({ success: true });
export const update = async (...args: any[]) => ({ success: true });
export const deleteItem = async (...args: any[]) => ({ success: true });
export const getTopSongs = async (limit: number = 10) => {
  // Generate mock top songs
  const mockSongs = [
    { title: 'Hino 1', plays: 150, likes: 80 },
    { title: 'Hino 5', plays: 120, likes: 65 },
    { title: 'Hino 10', plays: 100, likes: 50 },
    { title: 'Hino 15', plays: 90, likes: 45 },
    { title: 'Hino 20', plays: 85, likes: 42 },
    { title: 'Hino 25', plays: 75, likes: 38 },
    { title: 'Hino 30', plays: 70, likes: 35 },
    { title: 'Hino 35', plays: 65, likes: 32 },
    { title: 'Hino 40', plays: 60, likes: 30 },
    { title: 'Hino 45', plays: 55, likes: 28 },
  ];
  return mockSongs.slice(0, limit);
};
export const getPlaysByDay = async (period: number = 30) => {
  // Generate mock data for the chart
  const data = [];
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    data.push({
      date: dateStr,
      plays: Math.floor(Math.random() * 100)
    });
  }
  return data;
};
export const getGenreStats = async () => {
  // Generate mock genre distribution
  return [
    { name: 'Cantados', count: 150 },
    { name: 'Solo', count: 80 },
    { name: 'Congregação', count: 120 },
    { name: 'Mocidade', count: 60 },
    { name: 'Crianças', count: 40 },
    { name: 'Outros', count: 30 }
  ];
};
export const getUserGrowth = async (period: number = 30) => {
  // Generate mock data for user growth
  const data = [];
  let total = 100;
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    const newUsers = Math.floor(Math.random() * 10);
    total += newUsers;
    data.push({
      date: dateStr,
      new: newUsers,
      total: total
    });
  }
  return data;
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
