// API URLs
export const API_URLS = {
  BASE_URL: 'http://localhost:3000',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
} as const;

// Asset URLs
export const ASSETS = {
  LOGO_URL: 'https://canticosccb.com.br/logo-canticos-ccb.png',
  DEFAULT_AVATAR: 'https://i.pravatar.cc/150?img=1',
  PLACEHOLDER_IMAGE: 'https://picsum.photos/seed/placeholder/300/300',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'Cânticos CCB',
  DESCRIPTION: 'Plataforma de Cânticos da Congregação Cristã no Brasil',
  VERSION: '1.0.0',
  AUTHOR: 'Congregação Cristã no Brasil',
  COPYRIGHT_YEAR: new Date().getFullYear(),
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  LIBRARY: '/library',
  LIKED: '/liked',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  PREMIUM: '/premium',
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  ABOUT: '/about',
  HINOS_CANTADOS: '/hinos-cantados',
  HINOS_TOCADOS: '/hinos-tocados',
  INSTRUMENTAIS: '/instrumentais',
  BIBLIA_NARRADA: '/biblia-narrada',
  COMPOSITORES: '/compositores',
  COMPOSITOR_CADASTRO: '/compositor/cadastro',
} as const;

// Player Configuration
export const PLAYER_CONFIG = {
  DEFAULT_VOLUME: 0.8,
  FADE_DURATION: 300,
  SEEK_STEP: 10, // seconds
  AUTO_PLAY_DELAY: 1000, // milliseconds
} as const;

// UI Configuration
export const UI_CONFIG = {
  CAROUSEL_AUTO_ROTATE_INTERVAL: 5000, // milliseconds
  COMPOSER_ROTATE_INTERVAL: 4000, // milliseconds
  TOAST_DURATION: 3000, // milliseconds
  DEBOUNCE_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 300, // milliseconds
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Social Media Links
export const SOCIAL_LINKS = {
  INSTAGRAM: 'https://instagram.com/ccb_oficial',
  FACEBOOK: 'https://facebook.com/ccb.oficial',
  YOUTUBE: 'https://youtube.com/c/CCBOficial',
  WEBSITE: 'https://ccb.org.br',
} as const;

// Audio Formats
export const AUDIO_FORMATS = {
  SUPPORTED: ['mp3', 'wav', 'ogg', 'm4a'],
  PREFERRED: 'mp3',
  QUALITY: {
    LOW: '128kbps',
    MEDIUM: '192kbps',
    HIGH: '320kbps',
  },
} as const;

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PLAYLIST_NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Acesso não autorizado. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Conteúdo não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos.',
  AUDIO_LOAD_ERROR: 'Erro ao carregar o áudio. Tente novamente.',
  IMAGE_LOAD_ERROR: 'Erro ao carregar a imagem.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso!',
  REGISTER_SUCCESS: 'Conta criada com sucesso!',
  PLAYLIST_CREATED: 'Playlist criada com sucesso!',
  PLAYLIST_UPDATED: 'Playlist atualizada com sucesso!',
  SONG_LIKED: 'Hino adicionado aos favoritos!',
  SONG_UNLIKED: 'Hino removido dos favoritos!',
  PROFILE_UPDATED: 'Perfil atualizado com sucesso!',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: 'ccb_user_token',
  USER_DATA: 'ccb_user_data',
  PLAYER_VOLUME: 'ccb_player_volume',
  PLAYER_QUEUE: 'ccb_player_queue',
  THEME_PREFERENCE: 'ccb_theme',
  LANGUAGE_PREFERENCE: 'ccb_language',
  ONBOARDING_COMPLETED: 'ccb_onboarding_completed',
} as const;

// Categories
export const CATEGORIES = {
  CANTADOS: 'Cantados',
  TOCADOS: 'Tocados',
  INSTRUMENTAIS: 'Instrumentais',
  BIBLIA: 'Bíblia',
  ORACAO: 'Oração',
  LOUVOR: 'Louvor',
  ADORACAO: 'Adoração',
} as const;
