import { supabaseFetch, isSupabaseConfigured } from '@/lib/supabaseRest';

export type ComposerCatalogSong = {
  id: string;
  title: string;
  number: number | null;
  coverUrl?: string;
  composerName: string;
  category?: string;
  plays: number;
  likes: number;
  status: 'published' | 'pending' | 'draft';
  createdAt: string;
  updatedAt?: string;
  albumIds: string[];
  albumTitles: string[];
  trendScore: number;
  trendReason: string;
};

export type ComposerRecentActivity = {
  id: string;
  type: 'song_created' | 'song_updated' | 'album_created' | 'album_updated' | 'follower';
  title: string;
  description: string;
  message: string;
  timestamp: string;
  href?: string;
};

export type ComposerHistorySummary = {
  totalEvents: number;
  songsAddedLast30Days: number;
  updatesLast30Days: number;
  newFollowersLast30Days: number;
  albumsCreatedLast30Days: number;
};

type SongRow = {
  id?: string | number;
  titulo?: string;
  numero?: number | null;
  cover_url?: string | null;
  compositor_nome?: string | null;
  categoria?: string | null;
  plays?: number | null;
  status?: string | null;
  ativo?: number | boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AlbumRow = {
  id?: string | number;
  title?: string | null;
  cover_url?: string | null;
  is_published?: boolean | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AlbumHinoRow = {
  album_id?: string | number | null;
  hino_id?: string | number | null;
};

type FavoriteRow = {
  hino_id?: string | number | null;
};

type FollowRow = {
  id?: string | number;
  user_id?: string | number | null;
  created_at?: string | null;
};

type UserRow = {
  id?: string | number;
  name?: string | null;
  email?: string | null;
};

type ComposerCatalogSnapshot = {
  songs: ComposerCatalogSong[];
  activities: ComposerRecentActivity[];
  summary: ComposerHistorySummary;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * DAY_IN_MS;

function normalizeStatus(row: SongRow): 'published' | 'pending' | 'draft' {
  if (row.status === 'pending') return 'pending';
  if (row.status === 'draft') return 'draft';
  if (row.status === 'published') return 'published';
  if (row.ativo === 1 || row.ativo === true) return 'published';
  return 'draft';
}

function toIsoDate(value?: string | null): string {
  if (!value) return new Date(0).toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function daysSince(value?: string | null): number {
  const parsed = new Date(value || 0).getTime();
  if (!parsed) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - parsed) / DAY_IN_MS));
}

function isMeaningfulUpdate(createdAt?: string | null, updatedAt?: string | null) {
  if (!createdAt || !updatedAt) return false;
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  if (!created || !updated) return false;
  return updated - created > 5 * 60 * 1000;
}

function formatRelativeDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'agora';

  const diffDays = Math.floor((Date.now() - parsed.getTime()) / DAY_IN_MS);
  if (diffDays <= 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
  return `${Math.floor(diffDays / 365)} anos atrás`;
}

function chunkIds(values: string[], size = 100) {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function scoreSongTrend(song: Pick<ComposerCatalogSong, 'plays' | 'likes' | 'createdAt' | 'updatedAt'>) {
  const createdDays = daysSince(song.createdAt);
  const updatedDays = daysSince(song.updatedAt || song.createdAt);

  const recencyBoost = createdDays <= 7
    ? 80
    : createdDays <= 30
      ? 45
      : createdDays <= 90
        ? 20
        : 0;

  const updateBoost = updatedDays <= 7
    ? 28
    : updatedDays <= 30
      ? 12
      : 0;

  const score = (song.plays || 0) + ((song.likes || 0) * 24) + recencyBoost + updateBoost;

  let reason = 'catálogo consolidado';
  if (song.likes > 0 && song.plays > 0) {
    reason = 'plays e curtidas';
  } else if (recencyBoost > 0) {
    reason = 'lançamento recente';
  } else if (updateBoost > 0) {
    reason = 'atualização recente';
  } else if (song.plays > 0) {
    reason = 'plays acumulados';
  }

  return { score, reason };
}

async function fetchFavoritesBySongIds(songIds: string[]) {
  if (songIds.length === 0) return [] as FavoriteRow[];

  const chunks = chunkIds(songIds);
  const results = await Promise.all(
    chunks.map((ids) =>
      supabaseFetch<FavoriteRow>('favorites', {
        hino_id: `in.(${ids.join(',')})`,
        select: 'hino_id',
      }).catch(() => [] as FavoriteRow[])
    )
  );

  return results.flat();
}

async function fetchAlbumRelationsBySongIds(songIds: string[]) {
  if (songIds.length === 0) return [] as AlbumHinoRow[];

  const chunks = chunkIds(songIds);
  const results = await Promise.all(
    chunks.map((ids) =>
      supabaseFetch<AlbumHinoRow>('album_hinos', {
        hino_id: `in.(${ids.join(',')})`,
        select: 'album_id,hino_id',
        limit: '5000',
      }).catch(() => [] as AlbumHinoRow[])
    )
  );

  return results.flat();
}

async function fetchUsersByIds(userIds: string[]) {
  if (userIds.length === 0) return [] as UserRow[];

  const chunks = chunkIds(userIds);
  const results = await Promise.all(
    chunks.map((ids) =>
      supabaseFetch<UserRow>('users', {
        id: `in.(${ids.join(',')})`,
        select: 'id,name,email',
      }).catch(() => [] as UserRow[])
    )
  );

  return results.flat();
}

async function getComposerCatalogSnapshot(composerId: string | number): Promise<ComposerCatalogSnapshot> {
  const empty: ComposerCatalogSnapshot = {
    songs: [],
    activities: [],
    summary: {
      totalEvents: 0,
      songsAddedLast30Days: 0,
      updatesLast30Days: 0,
      newFollowersLast30Days: 0,
      albumsCreatedLast30Days: 0,
    },
  };

  if (!isSupabaseConfigured || !composerId) return empty;

  try {
    const [songsRows, albumRows, followRows] = await Promise.all([
      supabaseFetch<SongRow>('hinos', {
        compositor_id: `eq.${composerId}`,
        select: 'id,titulo,numero,cover_url,compositor_nome,categoria,plays,status,ativo,created_at,updated_at',
        order: 'created_at.desc',
        limit: '1000',
      }).catch(() => [] as SongRow[]),
      supabaseFetch<AlbumRow>('albums', {
        composer_id: `eq.${composerId}`,
        select: 'id,title,cover_url,is_published,active,created_at,updated_at',
        order: 'created_at.desc',
        limit: '500',
      }).catch(() => [] as AlbumRow[]),
      supabaseFetch<FollowRow>('user_follows', {
        composer_id: `eq.${composerId}`,
        select: 'id,user_id,created_at',
        order: 'created_at.desc',
        limit: '200',
      }).catch(() => [] as FollowRow[]),
    ]);

    const songIds = songsRows.map((row) => String(row.id)).filter(Boolean);
    const [favoriteRows, albumHinoRows, followerUsers] = await Promise.all([
      fetchFavoritesBySongIds(songIds),
      fetchAlbumRelationsBySongIds(songIds),
      fetchUsersByIds(
        followRows
          .map((row) => String(row.user_id || ''))
          .filter(Boolean)
      ),
    ]);

    const likesBySongId = favoriteRows.reduce<Record<string, number>>((acc, row) => {
      const songId = String(row.hino_id || '');
      if (!songId) return acc;
      acc[songId] = (acc[songId] || 0) + 1;
      return acc;
    }, {});

    const albumTitlesById = albumRows.reduce<Record<string, string>>((acc, row) => {
      const albumId = String(row.id || '');
      if (!albumId) return acc;
      acc[albumId] = String(row.title || 'Álbum');
      return acc;
    }, {});

    const albumIdsBySongId = albumHinoRows.reduce<Record<string, string[]>>((acc, row) => {
      const songId = String(row.hino_id || '');
      const albumId = String(row.album_id || '');
      if (!songId || !albumId) return acc;
      if (!acc[songId]) acc[songId] = [];
      if (!acc[songId].includes(albumId)) acc[songId].push(albumId);
      return acc;
    }, {});

    const songs: ComposerCatalogSong[] = songsRows.map((row) => {
      const songId = String(row.id || '');
      const albumIds = albumIdsBySongId[songId] || [];
      const baseSong = {
        id: songId,
        title: String(row.titulo || 'Hino sem título'),
        number: typeof row.numero === 'number' ? row.numero : row.numero ? Number(row.numero) : null,
        coverUrl: row.cover_url || undefined,
        composerName: String(row.compositor_nome || 'Compositor'),
        category: row.categoria || undefined,
        plays: Number(row.plays || 0),
        likes: likesBySongId[songId] || 0,
        status: normalizeStatus(row),
        createdAt: toIsoDate(row.created_at),
        updatedAt: row.updated_at ? toIsoDate(row.updated_at) : undefined,
        albumIds,
        albumTitles: albumIds.map((albumId) => albumTitlesById[albumId]).filter(Boolean),
      };
      const { score, reason } = scoreSongTrend(baseSong);

      return {
        ...baseSong,
        trendScore: score,
        trendReason: reason,
      };
    });

    const followerUsersById = followerUsers.reduce<Record<string, UserRow>>((acc, row) => {
      const userId = String(row.id || '');
      if (userId) acc[userId] = row;
      return acc;
    }, {});

    const songActivities = songs.flatMap<ComposerRecentActivity>((song) => {
      const items: ComposerRecentActivity[] = [
        {
          id: `song-created-${song.id}`,
          type: 'song_created',
          title: song.title,
          description: 'Hino adicionado ao catálogo',
          message: `Hino "${song.title}" entrou no catálogo ${formatRelativeDate(song.createdAt)}.`,
          timestamp: song.createdAt,
          href: `/composer/songs/${song.id}/edit`,
        },
      ];

      if (isMeaningfulUpdate(song.createdAt, song.updatedAt)) {
        items.push({
          id: `song-updated-${song.id}`,
          type: 'song_updated',
          title: song.title,
          description: 'Hino atualizado',
          message: `Hino "${song.title}" recebeu atualização ${formatRelativeDate(song.updatedAt || song.createdAt)}.`,
          timestamp: song.updatedAt || song.createdAt,
          href: `/composer/songs/${song.id}/edit`,
        });
      }

      return items;
    });

    const albumActivities = albumRows.flatMap<ComposerRecentActivity>((album) => {
      const albumId = String(album.id || '');
      const albumTitle = String(album.title || 'Álbum');
      const createdAt = toIsoDate(album.created_at);
      const updatedAt = album.updated_at ? toIsoDate(album.updated_at) : undefined;

      const items: ComposerRecentActivity[] = [
        {
          id: `album-created-${albumId}`,
          type: 'album_created',
          title: albumTitle,
          description: 'Álbum criado',
          message: `Álbum "${albumTitle}" foi criado ${formatRelativeDate(createdAt)}.`,
          timestamp: createdAt,
          href: `/composer/albums/edit/${albumId}`,
        },
      ];

      if (isMeaningfulUpdate(createdAt, updatedAt)) {
        items.push({
          id: `album-updated-${albumId}`,
          type: 'album_updated',
          title: albumTitle,
          description: 'Álbum atualizado',
          message: `Álbum "${albumTitle}" foi atualizado ${formatRelativeDate(updatedAt || createdAt)}.`,
          timestamp: updatedAt || createdAt,
          href: `/composer/albums/edit/${albumId}`,
        });
      }

      return items;
    });

    const followerActivities = followRows.map<ComposerRecentActivity>((row) => {
      const userId = String(row.user_id || '');
      const user = followerUsersById[userId];
      const followerName = user?.name || user?.email || 'Novo seguidor';
      const createdAt = toIsoDate(row.created_at);

      return {
        id: `follower-${row.id || userId || createdAt}`,
        type: 'follower',
        title: followerName,
        description: 'Novo seguidor',
        message: `${followerName} começou a seguir seu perfil ${formatRelativeDate(createdAt)}.`,
        timestamp: createdAt,
        href: '/composer/followers',
      };
    });

    const activities = [...followerActivities, ...songActivities, ...albumActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const now = Date.now();
    const songsAddedLast30Days = songs.filter((song) => now - new Date(song.createdAt).getTime() <= THIRTY_DAYS_MS).length;
    const updatesLast30Days = [
      ...songs.filter((song) => isMeaningfulUpdate(song.createdAt, song.updatedAt)),
      ...albumRows.filter((album) => isMeaningfulUpdate(album.created_at, album.updated_at)),
    ].filter((item: any) => now - new Date(item.updatedAt || item.updated_at || 0).getTime() <= THIRTY_DAYS_MS).length;
    const newFollowersLast30Days = followRows.filter((row) => now - new Date(row.created_at || 0).getTime() <= THIRTY_DAYS_MS).length;
    const albumsCreatedLast30Days = albumRows.filter((album) => now - new Date(album.created_at || 0).getTime() <= THIRTY_DAYS_MS).length;

    return {
      songs,
      activities,
      summary: {
        totalEvents: activities.length,
        songsAddedLast30Days,
        updatesLast30Days,
        newFollowersLast30Days,
        albumsCreatedLast30Days,
      },
    };
  } catch (error) {
    console.error('Error building composer catalog snapshot:', error);
    return empty;
  }
}

export async function getComposerLikedSongsByComposerId(composerId: string | number, limit = 25) {
  const snapshot = await getComposerCatalogSnapshot(composerId);
  return snapshot.songs
    .sort((a, b) => {
      if (b.likes !== a.likes) return b.likes - a.likes;
      if (b.plays !== a.plays) return b.plays - a.plays;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit);
}

export async function getComposerTrendingSongsByComposerId(composerId: string | number, limit = 25) {
  const snapshot = await getComposerCatalogSnapshot(composerId);
  return snapshot.songs
    .sort((a, b) => {
      if (b.trendScore !== a.trendScore) return b.trendScore - a.trendScore;
      if (b.likes !== a.likes) return b.likes - a.likes;
      return b.plays - a.plays;
    })
    .slice(0, limit);
}

export async function getComposerRecentActivityByComposerId(composerId: string | number, limit = 20) {
  const snapshot = await getComposerCatalogSnapshot(composerId);
  return snapshot.activities.slice(0, limit);
}

export async function getComposerHistorySummaryByComposerId(composerId: string | number) {
  const snapshot = await getComposerCatalogSnapshot(composerId);
  return snapshot.summary;
}
