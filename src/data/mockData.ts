import { Hino, Playlist, Artist, Album, User } from '@/types';

// ==================== MOCK USERS ====================
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'jane.doe@example.com',
    name: 'Jane Doe',
    avatar: 'https://i.pravatar.cc/80?img=1',
    role: 'composer',
    isPremium: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'admin@canticosccb.com.br',
    name: 'Administrador',
    avatar: 'https://i.pravatar.cc/80?img=2',
    role: 'admin',
    isPremium: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    email: 'user@example.com',
    name: 'Usuário Comum',
    avatar: 'https://i.pravatar.cc/80?img=3',
    role: 'user',
    isPremium: false,
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
  },
  {
    id: '6',
    title: 'Hino 25 - Graça Maravilhosa',
    number: 25,
    category: 'Louvores',
    artist: 'Coral CCB',
    duration: '3:30',
    audioUrl: '/audio/hino-25.mp3',
    coverUrl: 'https://picsum.photos/seed/hino25/300/300',
    lyrics: 'Graça maravilhosa, graça sem igual...',
    plays: 14200,
    isLiked: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    title: 'Hino 125 - Paz do Senhor',
    number: 125,
    category: 'Adoração',
    artist: 'Coral CCB',
    duration: '4:15',
    audioUrl: '/audio/hino-125.mp3',
    coverUrl: 'https://picsum.photos/seed/hino125/300/300',
    lyrics: 'A paz do Senhor seja convosco...',
    plays: 13500,
    isLiked: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    title: 'Hino 300 - Momento de Oração',
    number: 300,
    category: 'Adoração',
    artist: 'Coral CCB',
    duration: '3:55',
    audioUrl: '/audio/hino-300.mp3',
    coverUrl: 'https://picsum.photos/seed/hino300/300/300',
    lyrics: 'No momento de oração, elevo minha voz...',
    plays: 11800,
    isLiked: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '9',
    title: 'Hino 75 - Glória ao Senhor',
    number: 75,
    category: 'Louvores',
    artist: 'Coral CCB',
    duration: '4:05',
    audioUrl: '/audio/hino-75.mp3',
    coverUrl: 'https://picsum.photos/seed/hino75/300/300',
    lyrics: 'Glória ao Senhor, glória ao Rei...',
    plays: 15600,
    isLiked: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '10',
    title: 'Hino 150 - Fonte de Vida',
    number: 150,
    category: 'Esperança',
    artist: 'Coral CCB',
    duration: '3:40',
    audioUrl: '/audio/hino-150.mp3',
    coverUrl: 'https://picsum.photos/seed/hino150/300/300',
    lyrics: 'Jesus é a fonte de vida eterna...',
    plays: 12300,
    isLiked: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '11',
    title: 'Hino 400 - Caminho da Salvação',
    number: 400,
    category: 'Convite',
    artist: 'Coral CCB',
    duration: '4:25',
    audioUrl: '/audio/hino-400.mp3',
    coverUrl: 'https://picsum.photos/seed/hino400/300/300',
    lyrics: 'Há um caminho que conduz à salvação...',
    plays: 13900,
    isLiked: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '12',
    title: 'Hino 99 - Bendito Salvador',
    number: 99,
    category: 'Adoração',
    artist: 'Coral CCB',
    duration: '3:50',
    audioUrl: '/audio/hino-99.mp3',
    coverUrl: 'https://picsum.photos/seed/hino99/300/300',
    lyrics: 'Bendito Salvador, meu Redentor...',
    plays: 14800,
    isLiked: false,
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
