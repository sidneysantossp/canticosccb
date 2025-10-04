// ==================== CORE TYPES ====================
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPremium: boolean;
  createdAt: string;
}

export interface Hino {
  id: string;
  title: string;
  number: number;
  category: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  coverUrl?: string;
  lyrics?: string;
  plays: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: string[]; // Array of hino IDs
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  followers: number;
  monthlyListeners: number;
  isFollowed: boolean;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  coverUrl?: string;
  releaseDate: string;
  tracks: string[];
}

// ==================== PLAYER TYPES ====================
export interface PlayerState {
  currentTrack: Hino | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queue: Hino[];
  history: Hino[];
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
}

// ==================== UI TYPES ====================
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// ==================== FORM TYPES ====================
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PlaylistForm {
  name: string;
  description?: string;
  isPublic: boolean;
}

// ==================== API TYPES ====================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== ROUTE TYPES ====================
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  title: string;
  requiresAuth?: boolean;
  layout?: 'default' | 'auth' | 'minimal';
}
