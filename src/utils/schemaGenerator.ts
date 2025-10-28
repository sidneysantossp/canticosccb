/**
 * Utilitários para gerar dados estruturados Schema.org
 * Referência: https://schema.org/
 */

const BASE_URL = import.meta.env.VITE_APP_URL || 'https://canticosccb.com.br';

/**
 * Schema para a organização/website
 */
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cânticos CCB',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Plataforma de música religiosa da Congregação Cristã no Brasil',
    sameAs: [
      'https://www.facebook.com/canticosccb',
      'https://www.instagram.com/canticosccb',
      'https://www.youtube.com/@canticosccb',
      'https://twitter.com/canticosccb'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-11-0000-0000',
      contactType: 'Customer Service',
      availableLanguage: ['Portuguese']
    }
  };
};

/**
 * Schema para Website com SearchAction
 */
export const generateWebsiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cânticos CCB',
    url: BASE_URL,
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
 * Schema para Música
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
}) => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: song.name,
    url: `${BASE_URL}${song.url}`,
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
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.name,
    url: `${BASE_URL}${album.url}`,
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
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: `${BASE_URL}${person.url}`
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
  numTracks?: number;
  image?: string;
  tracks?: Array<{ name: string; url: string }>;
}) => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: playlist.name,
    url: `${BASE_URL}${playlist.url}`,
    creator: {
      '@type': 'Person',
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
