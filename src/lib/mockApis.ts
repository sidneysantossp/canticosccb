// APIs Mockadas temporárias para fazer o build passar
// Estas serão substituídas por implementações reais com Firebase/Firestore

export interface HymnSearchResult {
  id: string;
  number: number;
  title: string;
  composer_name?: string;
  category_name?: string;
}

export interface ComposerSearchResult {
  id: string;
  name: string;
  bio?: string;
}

export interface AlbumSearchResult {
  id: string;
  title: string;
  composer_name?: string;
}

export interface PlaylistSearchResult {
  id: string;
  name: string;
  description?: string;
}

export interface SearchResult {
  hymns: HymnSearchResult[];
  composers: ComposerSearchResult[];
  albums: AlbumSearchResult[];
  playlists: PlaylistSearchResult[];
}

// Busca rápida mockada
export const quickSearch = async (query: string): Promise<SearchResult> => {
  console.log('🔍 Mock quickSearch:', query);
  return {
    hymns: [],
    composers: [],
    albums: [],
    playlists: []
  };
};

// Busca avançada mockada
export const advancedSearch = async (params: any): Promise<SearchResult> => {
  console.log('🔍 Mock advancedSearch:', params);
  return {
    hymns: [],
    composers: [],
    albums: [],
    playlists: []
  };
};

// Logo mock: lê do sessionStorage (preenchido pela área admin) e retorna um fallback
export const getLogoByType = async (type: string): Promise<{ url: string } | null> => {
  try {
    // Prioriza cache específico do tipo, senão usa 'primary'
    const cacheKey = `${type}LogoUrl`;
    const fromSession = (typeof sessionStorage !== 'undefined')
      ? (sessionStorage.getItem(cacheKey) || sessionStorage.getItem('primaryLogoUrl'))
      : null;
    const fromLocal = (typeof localStorage !== 'undefined')
      ? (localStorage.getItem(cacheKey) || localStorage.getItem('primaryLogoUrl'))
      : null;
    const cached = fromSession || fromLocal;
    if (cached) return { url: cached };
  } catch {}

  // Fallback seguro local (garante UI funcional)
  return { url: '/logo-canticos-ccb.svg' };
};
