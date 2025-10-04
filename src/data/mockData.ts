import { Hino, Playlist, Artist, Album, User } from '@/types';

// ==================== MOCK USERS ====================
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'jane.doe@example.com',
    name: 'Jane Doe',
    avatar: 'https://i.pravatar.cc/80?img=1',
    isPremium: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// ==================== MOCK HINOS ====================
export const mockHinos: Hino[] = [
  {
    id: '1',
    title: 'Hino 1 - Deus Eterno',
    number: 1,
    category: 'Louvores',
    artist: 'Coral CCB',
    duration: '3:45',
    audioUrl: '/audio/hino-1.mp3',
    coverUrl: 'https://picsum.photos/seed/hino1/300/300',
    lyrics: 'Deus eterno, Deus eterno, fonte de amor...',
    plays: 15420,
    isLiked: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Hino 5 - Vem Pecador',
    number: 5,
    category: 'Convite',
    artist: 'Coral CCB',
    duration: '4:20',
    audioUrl: '/audio/hino-5.mp3',
    coverUrl: 'https://picsum.photos/seed/hino5/300/300',
    lyrics: 'Vem pecador, vem sem tardar...',
    plays: 12850,
    isLiked: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Hino 10 - Ao Deus de Abraão',
    number: 10,
    category: 'Adoração',
    artist: 'Coral CCB',
    duration: '3:15',
    audioUrl: '/audio/hino-10.mp3',
    coverUrl: 'https://picsum.photos/seed/hino10/300/300',
    lyrics: 'Ao Deus de Abraão louvai...',
    plays: 9630,
    isLiked: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    title: 'Hino 50 - Saudosa Lembrança',
    number: 50,
    category: 'Saudade',
    artist: 'Coral CCB',
    duration: '4:10',
    audioUrl: '/audio/hino-50.mp3',
    coverUrl: 'https://picsum.photos/seed/hino50/300/300',
    lyrics: `Primeira estrofe do hino de louvor
Com melodia suave e harmoniosa
Palavras de fé e esperança
Cantadas em adoração

Segunda estrofe traz reflexão
Sobre a graça divina
E o amor que nos alcança
A cada novo dia

Terceira estrofe finaliza
Com gratidão e louvor
Pela bondade eterna
Do nosso Criador`,
    plays: 18750,
    isLiked: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    title: 'Hino 200 - Jerusalém Celeste',
    number: 200,
    category: 'Esperança',
    artist: 'Coral CCB',
    duration: '4:45',
    audioUrl: '/audio/hino-200.mp3',
    coverUrl: 'https://picsum.photos/seed/hino200/300/300',
    lyrics: 'Jerusalém celeste, cidade do Senhor...',
    plays: 16890,
    isLiked: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// ==================== MOCK PLAYLISTS ====================
export const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Hinos Cantados',
    description: 'Os hinos mais cantados da CCB',
    coverUrl: 'https://picsum.photos/seed/playlist1/300/300',
    tracks: ['1', '2', '4', '5'],
    isPublic: true,
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Hinos Tocados',
    description: 'Hinos instrumentais para meditação',
    coverUrl: 'https://picsum.photos/seed/playlist2/300/300',
    tracks: ['3', '6'],
    isPublic: true,
    userId: '1',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Favoritos Pessoais',
    description: 'Minha coleção pessoal de hinos',
    coverUrl: 'https://picsum.photos/seed/playlist3/300/300',
    tracks: ['2', '4', '6'],
    isPublic: false,
    userId: '1',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z'
  }
];

// ==================== MOCK ARTISTS ====================
export const mockArtists: Artist[] = [
  {
    id: '1',
    name: 'Coral CCB',
    bio: 'Coral oficial da Congregação Cristã no Brasil',
    imageUrl: 'https://picsum.photos/seed/coral/400/400',
    followers: 125000,
    monthlyListeners: 89000,
    isFollowed: true
  },
  {
    id: '2',
    name: 'Orquestra CCB',
    bio: 'Orquestra oficial da Congregação Cristã no Brasil',
    imageUrl: 'https://picsum.photos/seed/orquestra/400/400',
    followers: 98000,
    monthlyListeners: 67000,
    isFollowed: false
  }
];

// ==================== MOCK ALBUMS ====================
export const mockAlbums: Album[] = [
  {
    id: '1',
    title: 'Hinário 5 - Louvores',
    artistId: '1',
    coverUrl: 'https://picsum.photos/seed/album1/300/300',
    releaseDate: '2023-01-01',
    tracks: ['1', '2', '3']
  },
  {
    id: '2',
    title: 'Hinário 5 - Convite',
    artistId: '1',
    coverUrl: 'https://picsum.photos/seed/album2/300/300',
    releaseDate: '2023-02-01',
    tracks: ['4', '5', '6']
  }
];

// ==================== MOCK CATEGORIES ====================
export const mockCategories = [
  { id: '1', name: 'Louvores', count: 45, color: '#1db954' },
  { id: '2', name: 'Convite', count: 32, color: '#e22856' },
  { id: '3', name: 'Adoração', count: 28, color: '#ff6b35' },
  { id: '4', name: 'Saudade', count: 19, color: '#7c3aed' },
  { id: '5', name: 'Vitória', count: 24, color: '#0891b2' },
  { id: '6', name: 'Esperança', count: 31, color: '#059669' }
];

// ==================== HELPER FUNCTIONS ====================
export const getHinoById = (id: string): Hino | undefined => {
  return mockHinos.find(hino => hino.id === id);
};

export const getPlaylistById = (id: string): Playlist | undefined => {
  return mockPlaylists.find(playlist => playlist.id === id);
};

export const getArtistById = (id: string): Artist | undefined => {
  return mockArtists.find(artist => artist.id === id);
};

export const getHinosByCategory = (category: string): Hino[] => {
  return mockHinos.filter(hino => hino.category.toLowerCase() === category.toLowerCase());
};

export const getPopularHinos = (limit: number = 6): Hino[] => {
  return [...mockHinos]
    .sort((a, b) => b.plays - a.plays)
    .slice(0, limit);
};

export const getRecentlyAdded = (limit: number = 6): Hino[] => {
  return [...mockHinos]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

export const getLikedHinos = (): Hino[] => {
  return mockHinos.filter(hino => hino.isLiked);
};

export const searchHinos = (query: string): Hino[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockHinos.filter(hino => 
    hino.title.toLowerCase().includes(lowercaseQuery) ||
    hino.category.toLowerCase().includes(lowercaseQuery) ||
    hino.artist.toLowerCase().includes(lowercaseQuery)
  );
};
