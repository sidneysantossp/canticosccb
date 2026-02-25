import React, { useState, useCallback } from 'react';
import { Archive, Download, Upload, Music, CheckCircle, XCircle, Loader2, AlertTriangle, Link2, List } from 'lucide-react';
import JSZip from 'jszip';
import { supabaseInsert } from '@/lib/supabaseRest';
import { supabase } from '@/lib/supabase-auth';

interface TrackInfo {
  fileName: string;
  title: string;
  file: Blob;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  audioUrl?: string;
  duration?: string;
  error?: string;
}

interface ImportState {
  step: 'idle' | 'resolving' | 'downloading' | 'extracting' | 'preview' | 'importing' | 'done' | 'error';
  progress: number;
  message: string;
  albumTitle: string;
  albumArtist: string;
  tracks: TrackInfo[];
  archiveUrl: string;
  albumId?: string;
  error?: string;
  category: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const DEFAULT_COVER_URL = 'https://rdogsfrplohxnemvtetn.supabase.co/storage/v1/object/public/images/covers/1771984574638_y6tw06.png';

function slugToTitle(slug: string): string {
  return slug
    .replace(/-www\.canticosccb\.com\.br$/, '')
    .replace(/\.zip$/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTrackName(fileName: string): string {
  return fileName
    .replace(/\.mp3$/i, '')
    .replace(/^\d+[\s._-]+/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const AdminArchiveImport: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [state, setState] = useState<ImportState>({
    step: 'idle',
    progress: 0,
    message: '',
    albumTitle: '',
    albumArtist: '',
    tracks: [],
    archiveUrl: '',
    category: 'Hinos Avulsos',
  });

  const resolveArchiveUrl = useCallback(async (inputUrl: string): Promise<string> => {
    // If it's already a full archive.org URL with timestamp, ensure if_ format
    const timestampMatch = inputUrl.match(/web\.archive\.org\/web\/(\d+)(if_)?\//);
    if (timestampMatch) {
      // Ensure we use if_ to get raw file (no Wayback toolbar)
      if (!timestampMatch[2]) {
        return inputUrl.replace(
          `/web/${timestampMatch[1]}/`,
          `/web/${timestampMatch[1]}if_/`
        );
      }
      return inputUrl;
    }

    // Extract the original URL from wildcard format
    let originalUrl = inputUrl;
    if (inputUrl.includes('web.archive.org/web/*/')) {
      originalUrl = inputUrl.split('web.archive.org/web/*/')[1];
    }
    if (!originalUrl.startsWith('http')) {
      originalUrl = `http://www.canticosccb.com.br/zip/${originalUrl}`;
    }
    if (!originalUrl.endsWith('.zip')) {
      originalUrl += '-www.canticosccb.com.br.zip';
    }

    // Use CDX API to find the latest snapshot
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(originalUrl)}&output=json&limit=-1&fl=timestamp,original,statuscode,mimetype`;
    const resp = await fetch(cdxUrl);
    if (!resp.ok) throw new Error(`CDX API retornou ${resp.status}`);
    const data = await resp.json();

    if (!data || data.length < 2) {
      throw new Error('URL não encontrada no Web Archive. Verifique se a URL está correta.');
    }

    // Find the best snapshot (prefer 200 status, latest timestamp)
    const snapshots = data.slice(1); // skip header row
    const good = snapshots.filter((s: string[]) => s[2] === '200') ;
    const best = good.length > 0 ? good[good.length - 1] : snapshots[snapshots.length - 1];
    const [timestamp, original] = best;
    return `https://web.archive.org/web/${timestamp}if_/${original}`;
  }, []);

  const downloadZip = useCallback(async (archiveUrl: string): Promise<Blob> => {
    console.log('[archive-import] Downloading:', archiveUrl);
    const errors: string[] = [];

    // 1. Try via proxy first (CORS blocks direct browser downloads from archive.org)
    try {
      const proxyUrl = `/api/archive-proxy?url=${encodeURIComponent(archiveUrl)}`;
      console.log('[archive-import] Trying proxy...');
      const proxyResp = await fetch(proxyUrl);
      if (proxyResp.ok) {
        const blob = await proxyResp.blob();
        if (blob.size > 1000) {
          // Verify ZIP magic bytes
          const header = await blob.slice(0, 4).arrayBuffer();
          const magic = new Uint8Array(header);
          if (magic[0] === 0x50 && magic[1] === 0x4B) {
            console.log('[archive-import] Proxy download OK, size:', blob.size);
            return blob;
          }
          errors.push('Proxy retornou arquivo que não é ZIP');
        } else {
          errors.push(`Proxy retornou arquivo muito pequeno (${blob.size} bytes)`);
        }
      } else {
        const errBody = await proxyResp.text().catch(() => '');
        errors.push(`Proxy retornou ${proxyResp.status}: ${errBody.slice(0, 200)}`);
      }
    } catch (e: any) {
      console.warn('[archive-import] Proxy failed:', e);
      errors.push(`Proxy falhou: ${e?.message || 'erro de rede'}`);
    }

    // 2. Fallback: try direct download (may work if CORS is allowed)
    try {
      console.log('[archive-import] Trying direct download...');
      const response = await fetch(archiveUrl, { redirect: 'follow' });
      if (response.ok) {
        const blob = await response.blob();
        const header = await blob.slice(0, 4).arrayBuffer();
        const magic = new Uint8Array(header);
        if (magic[0] === 0x50 && magic[1] === 0x4B) {
          console.log('[archive-import] Direct download OK, size:', blob.size);
          return blob;
        }
        errors.push('Download direto retornou arquivo que não é ZIP');
      } else {
        errors.push(`Download direto retornou ${response.status}`);
      }
    } catch (e: any) {
      console.warn('[archive-import] Direct download failed:', e);
      errors.push(`Download direto bloqueado (CORS): ${e?.message || ''}`);
    }

    console.error('[archive-import] All download methods failed:', errors);
    throw new Error(
      'Não foi possível baixar o ZIP.\n' +
      errors.join('\n') +
      '\n\nVerifique se o site está deployado no Vercel (o proxy não funciona localmente).'
    );
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!urlInput.trim()) return;

    setState(prev => ({ ...prev, step: 'resolving', message: 'Resolvendo URL no Web Archive...', progress: 5, error: undefined }));

    try {
      const archiveUrl = await resolveArchiveUrl(urlInput.trim());
      console.log('[archive-import] Resolved URL:', archiveUrl);

      // Extract album info from URL slug
      const slugMatch = archiveUrl.match(/\/zip\/([^/]+?)(?:-www\.canticosccb\.com\.br)?\.zip/i);
      const slug = slugMatch ? slugMatch[1] : 'album-desconhecido';
      const albumTitle = slugToTitle(slug);

      setState(prev => ({
        ...prev,
        step: 'downloading',
        message: `Baixando ZIP do Web Archive... (pode levar alguns minutos)`,
        progress: 10,
        archiveUrl,
        albumTitle,
        albumArtist: albumTitle,
      }));

      // Download ZIP (direct or via proxy fallback)
      const zipBlob = await downloadZip(archiveUrl);

      setState(prev => ({ ...prev, step: 'extracting', message: 'Extraindo arquivos MP3...', progress: 50 }));

      // Extract ZIP
      const zip = await JSZip.loadAsync(zipBlob);
      const mp3Files: TrackInfo[] = [];

      const entries = Object.entries(zip.files).filter(
        ([name, file]) => !file.dir && /\.mp3$/i.test(name)
      ).sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }));

      for (let i = 0; i < entries.length; i++) {
        const [name, file] = entries[i];
        const blob = await file.async('blob');
        const fileName = name.split('/').pop() || name;

        mp3Files.push({
          fileName,
          title: cleanTrackName(fileName),
          file: blob,
          size: blob.size,
          status: 'pending',
        });

        setState(prev => ({
          ...prev,
          progress: 50 + Math.round((i / entries.length) * 30),
          message: `Extraindo: ${fileName} (${i + 1}/${entries.length})`,
        }));
      }

      if (mp3Files.length === 0) {
        throw new Error('Nenhum arquivo MP3 encontrado no ZIP. O arquivo pode estar corrompido ou em formato diferente.');
      }

      setState(prev => ({
        ...prev,
        step: 'preview',
        progress: 80,
        message: `${mp3Files.length} faixas encontradas. Revise e clique em Importar.`,
        tracks: mp3Files,
      }));
    } catch (error: any) {
      console.error('[archive-import] Error:', error?.message || error);
      setState(prev => ({
        ...prev,
        step: 'error',
        message: '',
        error: error?.message || String(error) || 'Erro desconhecido ao processar o arquivo',
      }));
    }
  }, [urlInput, resolveArchiveUrl, downloadZip]);

  const handleImport = useCallback(async () => {
    setState(prev => ({ ...prev, step: 'importing', progress: 0, message: 'Criando álbum...' }));

    try {
      // Get auth token
      let accessToken = SUPABASE_ANON_KEY;
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) accessToken = data.session.access_token;
      } catch { /* use anon */ }

      // 1. Create album
      const albumData = {
        title: state.albumTitle,
        artist: state.albumArtist,
        genre: state.category,
        is_published: true,
        active: true,
        total_tracks: state.tracks.length,
        release_year: 2014,
        release_date: '2014-01-01',
        cover_url: DEFAULT_COVER_URL,
        description: `Álbum recuperado do acervo original canticosccb.com.br via Web Archive`,
      };

      const albumResult = await supabaseInsert<{ id: string }>('albums', albumData);
      if (!albumResult || !albumResult.id) {
        throw new Error('Falha ao criar álbum no banco de dados');
      }

      const albumId = albumResult.id;
      setState(prev => ({ ...prev, albumId, message: `Álbum criado. Enviando faixas...` }));

      // 2. Upload each track and create hino record
      const updatedTracks = [...state.tracks];

      for (let i = 0; i < updatedTracks.length; i++) {
        const track = updatedTracks[i];
        updatedTracks[i] = { ...track, status: 'uploading' };
        setState(prev => ({
          ...prev,
          tracks: [...updatedTracks],
          progress: Math.round((i / updatedTracks.length) * 100),
          message: `Enviando: ${track.title} (${i + 1}/${updatedTracks.length})`,
        }));

        try {
          // Upload MP3 to Supabase Storage
          const ext = track.fileName.split('.').pop() || 'mp3';
          const storagePath = `hinos/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          const uploadUrl = `${SUPABASE_URL}/storage/v1/object/images/${storagePath}`;

          const uploadResp = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'audio/mpeg',
              'x-upsert': 'true',
            },
            body: track.file,
          });

          if (!uploadResp.ok) {
            const errText = await uploadResp.text().catch(() => '');
            throw new Error(`Upload falhou: ${uploadResp.status} - ${errText}`);
          }

          const audioUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;

          // Get audio duration
          let duration = '0:00';
          try {
            const audio = document.createElement('audio');
            audio.preload = 'metadata';
            const objectUrl = URL.createObjectURL(track.file);
            audio.src = objectUrl;
            await new Promise<void>((resolve, reject) => {
              audio.onloadedmetadata = () => resolve();
              audio.onerror = () => reject(new Error('duration'));
              setTimeout(() => resolve(), 3000);
            });
            const secs = Math.round(audio.duration || 0);
            URL.revokeObjectURL(objectUrl);
            const mm = Math.floor(secs / 60).toString().padStart(1, '0');
            const ss = Math.floor(secs % 60).toString().padStart(2, '0');
            duration = `${mm}:${ss}`;
          } catch { /* keep 0:00 */ }

          // Create hino record
          const hinoData = {
            titulo: track.title,
            categoria: state.category,
            compositor_nome: state.albumArtist,
            audio_url: audioUrl,
            cover_url: DEFAULT_COVER_URL,
            duracao: duration,
            status: 'published',
            ativo: true,
          };

          const hinoResult = await supabaseInsert<{ id: string }>('hinos', hinoData);
          const hinoId = hinoResult?.id;

          // Link hino to album
          if (hinoId) {
            await supabaseInsert('album_hinos', {
              album_id: albumId,
              hino_id: hinoId,
              position: i + 1,
              track_number: i + 1,
            });
          }

          updatedTracks[i] = { ...track, status: 'done', audioUrl, duration };
        } catch (error: any) {
          console.error(`[archive-import] Track ${i} error:`, error);
          updatedTracks[i] = { ...track, status: 'error', error: error.message };
        }

        setState(prev => ({ ...prev, tracks: [...updatedTracks] }));
      }

      // 3. Update album total_tracks
      const doneCount = updatedTracks.filter(t => t.status === 'done').length;

      setState(prev => ({
        ...prev,
        step: 'done',
        progress: 100,
        message: `Importação concluída! ${doneCount}/${updatedTracks.length} faixas importadas.`,
        tracks: [...updatedTracks],
      }));
    } catch (error: any) {
      console.error('[archive-import] Import error:', error);
      setState(prev => ({
        ...prev,
        step: 'error',
        error: error.message || 'Erro na importação',
      }));
    }
  }, [state]);

  const doneCount = state.tracks.filter(t => t.status === 'done').length;
  const errorCount = state.tracks.filter(t => t.status === 'error').length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Archive className="w-8 h-8 text-primary-400" />
          Importar do Web Archive
        </h1>
        <p className="text-gray-400">
          Recupere álbuns do acervo original canticosccb.com.br via Wayback Machine
        </p>
      </div>

      {/* URL Input */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <label className="block text-white font-medium mb-2">URL do Web Archive</label>
        <p className="text-gray-400 text-sm mb-4">
          Cole a URL do ZIP no formato: <code className="text-primary-400">https://web.archive.org/web/*/http://www.canticosccb.com.br/zip/nome-do-album-www.canticosccb.com.br.zip</code>
        </p>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://web.archive.org/web/.../nome-do-album.zip"
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              disabled={state.step !== 'idle' && state.step !== 'error' && state.step !== 'done'}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!urlInput.trim() || (state.step !== 'idle' && state.step !== 'error' && state.step !== 'done')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            Analisar
          </button>
        </div>
      </div>

      {/* Progress */}
      {(state.step === 'resolving' || state.step === 'downloading' || state.step === 'extracting' || state.step === 'importing') && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
            <span className="text-white font-medium">{state.message}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">{state.progress}%</p>
        </div>
      )}

      {/* Error */}
      {state.step === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Erro na importação</p>
              <p className="text-red-300 text-sm mt-1">{state.error}</p>
              <button
                onClick={() => setState(prev => ({ ...prev, step: 'idle', error: undefined }))}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview / Edit */}
      {(state.step === 'preview' || state.step === 'importing' || state.step === 'done') && (
        <>
          {/* Album Info */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <Music className="w-5 h-5 text-primary-400" />
              Dados do Álbum
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Título do Álbum</label>
                <input
                  type="text"
                  value={state.albumTitle}
                  onChange={(e) => setState(prev => ({ ...prev, albumTitle: e.target.value }))}
                  disabled={state.step !== 'preview'}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Artista / Compositor</label>
                <input
                  type="text"
                  value={state.albumArtist}
                  onChange={(e) => setState(prev => ({ ...prev, albumArtist: e.target.value }))}
                  disabled={state.step !== 'preview'}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Categoria</label>
                <select
                  value={state.category}
                  onChange={(e) => setState(prev => ({ ...prev, category: e.target.value }))}
                  disabled={state.step !== 'preview'}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 outline-none disabled:opacity-60"
                >
                  <option value="Hinos Avulsos">Hinos Avulsos</option>
                  <option value="Hinos Cantados">Hinos Cantados</option>
                  <option value="Hinos Tocados">Hinos Tocados</option>
                </select>
              </div>
              <div className="flex items-end">
                <p className="text-gray-400 text-sm">
                  {state.tracks.length} faixas • {formatFileSize(state.tracks.reduce((sum, t) => sum + t.size, 0))} total
                </p>
              </div>
            </div>
          </div>

          {/* Track List */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <List className="w-5 h-5 text-primary-400" />
              Faixas ({state.tracks.length})
              {state.step === 'done' && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  {doneCount} importadas, {errorCount} erros
                </span>
              )}
            </h2>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {state.tracks.map((track, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    track.status === 'done' ? 'bg-green-500/5 border-green-500/20' :
                    track.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                    track.status === 'uploading' ? 'bg-blue-500/5 border-blue-500/20' :
                    'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <span className="text-gray-500 text-sm w-8 text-right">{i + 1}.</span>

                  {track.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                  {track.status === 'error' && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  {track.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />}
                  {track.status === 'pending' && <Music className="w-4 h-4 text-gray-500 flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    {state.step === 'preview' ? (
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => {
                          const updated = [...state.tracks];
                          updated[i] = { ...track, title: e.target.value };
                          setState(prev => ({ ...prev, tracks: updated }));
                        }}
                        className="w-full bg-transparent border-b border-gray-700 text-white text-sm py-1 focus:border-primary-500 outline-none"
                      />
                    ) : (
                      <p className="text-white text-sm truncate">{track.title}</p>
                    )}
                    {track.error && <p className="text-red-400 text-xs mt-1">{track.error}</p>}
                    {track.duration && track.duration !== '0:00' && (
                      <p className="text-gray-500 text-xs">{track.duration}</p>
                    )}
                  </div>

                  <span className="text-gray-500 text-xs flex-shrink-0">{formatFileSize(track.size)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Import Button */}
          {state.step === 'preview' && (
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Importar {state.tracks.length} Faixas para o Supabase
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, step: 'idle', tracks: [], albumTitle: '', albumArtist: '' }))}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Done */}
          {state.step === 'done' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium">{state.message}</p>
                  {state.albumId && (
                    <p className="text-green-300 text-sm mt-1">
                      ID do álbum: <code className="bg-green-500/20 px-2 py-0.5 rounded">{state.albumId}</code>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setUrlInput('');
                      setState({
                        step: 'idle', progress: 0, message: '', albumTitle: '', albumArtist: '',
                        tracks: [], archiveUrl: '', category: 'Hinos Avulsos',
                      });
                    }}
                    className="mt-3 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm transition-colors"
                  >
                    Importar outro álbum
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Help */}
      {state.step === 'idle' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Como usar
          </h3>
          <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
            <li>Acesse <a href="https://web.archive.org/web/*/http://www.canticosccb.com.br/zip/*" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">a lista de ZIPs no Web Archive</a></li>
            <li>Copie a URL de um dos ZIPs listados</li>
            <li>Cole a URL acima e clique em <strong className="text-white">Analisar</strong></li>
            <li>Revise o nome do álbum, artista e nomes das faixas</li>
            <li>Clique em <strong className="text-white">Importar</strong> para enviar tudo ao Supabase</li>
          </ol>
          <p className="text-gray-500 text-xs mt-4">
            Os arquivos MP3 serão enviados ao Supabase Storage e os registros criados nas tabelas albums, hinos e album_hinos.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminArchiveImport;
