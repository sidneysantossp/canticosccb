/**
 * Utilitários para gerar dados estruturados Schema.org
 * Referência: https://schema.org/
 */

import { DEFAULT_SITE_URL, normalizeSiteUrl } from '@/utils/siteUrl';

const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_APP_URL || '').trim();
  if (envUrl) return normalizeSiteUrl(envUrl, DEFAULT_SITE_URL);
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin, DEFAULT_SITE_URL);
  }
  return DEFAULT_SITE_URL;
};

/**
 * Schema para a organização/website
 */
export const generateOrganizationSchema = () => {
  const BASE_URL = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cânticos CCB',
    url: BASE_URL,
    logo: `${BASE_URL}/logo-canticos-ccb.png`,
    description: 'Plataforma de hinos da Congregação Cristã no Brasil',
    inLanguage: 'pt-BR',
    sameAs: [
      'https://www.instagram.com/canticosccb.com.br/',
      'https://www.facebook.com/canticosccbsiteoficial/'
    ]
  };
};

/**
 * Schema para Website com SearchAction
 */
export const generateWebsiteSchema = () => {
  const BASE_URL = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cânticos CCB',
    url: BASE_URL,
    inLanguage: 'pt-BR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
};

/**
 * Schema para Breadcrumb
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  const BASE_URL = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`
    }))
  };
};

/**
 * Schema para Hino
 */
export const generateMusicRecordingSchema = (song: {
  name: string;
  url: string;
  artist: string;
  artistUrl: string;
  album?: string;
  albumUrl?: string;
  duration?: string; // Formato: PT3M45S (3 minutos e 45 segundos)
  genre?: string;
  datePublished?: string;
  image?: string;
  description?: string;
  audioUrl?: string;
}) => {
  const BASE_URL = getBaseUrl();
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: song.name,
    url: `${BASE_URL}${song.url}`,
    inLanguage: 'pt-BR',
    isFamilyFriendly: true,
    publisher: {
      '@type': 'Organization',
      name: 'Cânticos CCB',
      url: BASE_URL,
    },
    byArtist: {
      '@type': 'MusicGroup',
      name: song.artist,
      url: `${BASE_URL}${song.artistUrl}`
    }
  };

  if (song.duration) schema.duration = song.duration;
  if (song.genre) schema.genre = song.genre;
  if (song.datePublished) schema.datePublished = song.datePublished;
  if (song.image) schema.image = song.image;
  if (song.description) schema.description = song.description;
  if (song.audioUrl) {
    schema.associatedMedia = {
      '@type': 'AudioObject',
      contentUrl: song.audioUrl.startsWith('http') ? song.audioUrl : `${BASE_URL}${song.audioUrl}`,
      encodingFormat: 'audio/mpeg',
      inLanguage: 'pt-BR',
    };
  }
  
  if (song.album && song.albumUrl) {
    schema.inAlbum = {
      '@type': 'MusicAlbum',
      name: song.album,
      url: `${BASE_URL}${song.albumUrl}`
    };
  }

  return schema;
};

/**
 * Schema para Álbum
 */
export const generateMusicAlbumSchema = (album: {
  name: string;
  url: string;
  artist: string;
  artistUrl: string;
  datePublished?: string;
  genre?: string;
  image?: string;
  description?: string;
  numTracks?: number;
  tracks?: Array<{ name: string; url: string; duration?: string }>;
}) => {
  const BASE_URL = getBaseUrl();
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.name,
    url: `${BASE_URL}${album.url}`,
    inLanguage: 'pt-BR',
    publisher: {
      '@type': 'Organization',
      name: 'Cânticos CCB',
      url: BASE_URL,
    },
    byArtist: {
      '@type': 'MusicGroup',
      name: album.artist,
      url: `${BASE_URL}${album.artistUrl}`
    }
  };

  if (album.datePublished) schema.datePublished = album.datePublished;
  if (album.genre) schema.genre = album.genre;
  if (album.image) schema.image = album.image;
  if (album.description) schema.description = album.description;
  if (album.numTracks) schema.numTracks = album.numTracks;

  if (album.tracks && album.tracks.length > 0) {
    schema.track = album.tracks.map(track => ({
      '@type': 'MusicRecording',
      name: track.name,
      url: `${BASE_URL}${track.url}`,
      duration: track.duration
    }));
  }

  return schema;
};

/**
 * Schema para Artista/Compositor (Pessoa)
 */
export const generatePersonSchema = (person: {
  name: string;
  url: string;
  image?: string;
  description?: string;
  jobTitle?: string;
  sameAs?: string[]; // Links de redes sociais
  birthDate?: string;
  nationality?: string;
}) => {
  const BASE_URL = getBaseUrl();
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: `${BASE_URL}${person.url}`,
    inLanguage: 'pt-BR',
  };

  if (person.image) schema.image = person.image;
  if (person.description) schema.description = person.description;
  if (person.jobTitle) schema.jobTitle = person.jobTitle;
  if (person.sameAs) schema.sameAs = person.sameAs;
  if (person.birthDate) schema.birthDate = person.birthDate;
  if (person.nationality) schema.nationality = person.nationality;

  return schema;
};

/**
 * Schema para páginas públicas de perfil.
 */
export const generateProfilePageSchema = (profile: {
  name: string;
  url: string;
  image?: string;
  description?: string;
  jobTitle?: string;
}) => {
  const BASE_URL = getBaseUrl();
  const profileUrl = profile.url.startsWith('http') ? profile.url : `${BASE_URL}${profile.url}`;
  const mainEntity: any = {
    '@type': 'Person',
    name: profile.name,
    url: profileUrl,
  };

  if (profile.image) mainEntity.image = profile.image;
  if (profile.description) mainEntity.description = profile.description;
  if (profile.jobTitle) mainEntity.jobTitle = profile.jobTitle;

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: profile.name,
    url: profileUrl,
    mainEntity,
    mainEntityOfPage: profileUrl,
    inLanguage: 'pt-BR',
    description: profile.description,
  };
};

/**
 * Schema para Grupo Musical/Banda
 */
export const generateMusicGroupSchema = (group: {
  name: string;
  url: string;
  image?: string;
  description?: string;
  genre?: string;
  sameAs?: string[];
  foundingDate?: string;
  members?: Array<{ name: string; role?: string }>;
}) => {
  const BASE_URL = getBaseUrl();
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: group.name,
    url: `${BASE_URL}${group.url}`
  };

  if (group.image) schema.image = group.image;
  if (group.description) schema.description = group.description;
  if (group.genre) schema.genre = group.genre;
  if (group.sameAs) schema.sameAs = group.sameAs;
  if (group.foundingDate) schema.foundingDate = group.foundingDate;

  if (group.members && group.members.length > 0) {
    schema.member = group.members.map(member => ({
      '@type': 'Person',
      name: member.name,
      roleName: member.role
    }));
  }

  return schema;
};

/**
 * Schema para Playlist
 */
export const generateMusicPlaylistSchema = (playlist: {
  name: string;
  url: string;
  description?: string;
  creator: string;
  creatorUrl: string;
  creatorType?: 'Person' | 'Organization';
  numTracks?: number;
  image?: string;
  tracks?: Array<{ name: string; url: string }>;
}) => {
  const BASE_URL = getBaseUrl();
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: playlist.name,
    url: `${BASE_URL}${playlist.url}`,
    inLanguage: 'pt-BR',
    creator: {
      '@type': playlist.creatorType || 'Person',
      name: playlist.creator,
      url: `${BASE_URL}${playlist.creatorUrl}`
    }
  };

  if (playlist.description) schema.description = playlist.description;
  if (playlist.numTracks) schema.numTracks = playlist.numTracks;
  if (playlist.image) schema.image = playlist.image;

  if (playlist.tracks && playlist.tracks.length > 0) {
    schema.track = playlist.tracks.map(track => ({
      '@type': 'MusicRecording',
      name: track.name,
      url: `${BASE_URL}${track.url}`
    }));
  }

  return schema;
};

/**
 * Schema para Cifra/Tablatura (CreativeWork)
 */
export const generateCifraSchema = (cifra: {
  name: string;
  url: string;
  artist?: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  musicalKey?: string;
  instrument?: string;
}) => {
  const BASE_URL = getBaseUrl();
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: cifra.name,
    url: cifra.url.startsWith('http') ? cifra.url : `${BASE_URL}${cifra.url}`,
    genre: 'Hinos CCB',
    inLanguage: 'pt-BR',
    publisher: {
      '@type': 'Organization',
      name: 'Cânticos CCB',
      url: BASE_URL,
    },
  };

  if (cifra.artist) {
    schema.author = { '@type': 'Person', name: cifra.artist };
  }
  if (cifra.description) schema.description = cifra.description;
  if (cifra.image) schema.image = cifra.image;
  if (cifra.datePublished) schema.datePublished = cifra.datePublished;
  if (cifra.dateModified) schema.dateModified = cifra.dateModified;
  if (cifra.musicalKey) schema.musicalKey = cifra.musicalKey;
  if (cifra.instrument) schema.keywords = `cifra, ${cifra.instrument}, tablatura, acordes`;

  return schema;
};

/**
 * Schema para ItemList (listagem genérica)
 */
export const generateItemListSchema = (list: {
  name: string;
  description?: string;
  url: string;
  items: Array<{ name: string; url: string; position?: number }>;
}) => {
  const BASE_URL = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: list.name,
    description: list.description,
    url: list.url.startsWith('http') ? list.url : `${BASE_URL}${list.url}`,
    inLanguage: 'pt-BR',
    numberOfItems: list.items.length,
    itemListElement: list.items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position ?? index + 1,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
};

/**
 * Schema para FAQ Page
 */
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

/**
 * Converter segundos para formato ISO 8601 Duration
 * Exemplo: 225 segundos = "PT3M45S"
 */
export const secondsToISO8601Duration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `PT${minutes}M${remainingSeconds}S`;
};

/**
 * Gerar slug amigável para URL
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/--+/g, '-') // Remove hífens duplicados
    .trim();
};
