import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Database, Download, FileAudio, Link2, Loader2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase-auth';

type MediaFile = { name: string; extension: string; mimeType: string; replayUrl: string; container?: string; segmentId?: string; trackNumber?: number; sourceUrl?: string };
type RecoveryImport = { source_key: string; album_id?: string | null; status: 'importing' | 'pending_approval' | 'approved' | 'failed' | 'archived'; media_status: 'catalogued' | 'pending_transfer' | 'transferred' | 'failed'; files_count: number; imported_files_count: number; created_at: string; updated_at: string };
type AlbumGroup = { id: string; title: string; sourceUrl: string; files: MediaFile[] };

const sourceKeyFor = (segmentId: string) => `archive-catalog:${segmentId}`;
const statusLabel: Record<RecoveryImport['status'], string> = { importing: 'Cadastrando', pending_approval: 'Aguardando aprovação', approved: 'Aprovado', failed: 'Falhou', archived: 'Arquivado' };

export default function AdminArchiveRecovery() {
  const [sourceUrl, setSourceUrl] = useState('');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [imports, setImports] = useState<Record<string, RecoveryImport>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const [resultSource, setResultSource] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'downloaded'>('new');
  const [searchLimit, setSearchLimit] = useState(10);

  const albums = useMemo<AlbumGroup[]>(() => {
    const grouped = new Map<string, AlbumGroup>();
    for (const file of files) {
      if (!file.segmentId) continue;
      const current = grouped.get(file.segmentId) || { id: file.segmentId, title: file.container || file.segmentId, sourceUrl: file.sourceUrl || file.replayUrl, files: [] };
      current.files.push(file);
      grouped.set(file.segmentId, current);
    }
    return [...grouped.values()];
  }, [files]);

  const visibleAlbums = useMemo(() => {
    const filtered = albums.filter((album) => {
    const imported = Boolean(imports[sourceKeyFor(album.id)]);
    return activeTab === 'downloaded' ? imported : !imported;
    });
    // Durante a atualização dos status, os arquivos podem chegar antes do
    // mapa de importações. Não esconda os resultados já encontrados.
    return activeTab === 'downloaded' && filtered.length === 0 && albums.length > 0 ? albums : filtered;
  }, [albums, imports, activeTab]);

  const getSessionToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Sessão administrativa necessária.');
    return session.access_token;
  };

  const loadImportStatus = async (token: string) => {
    const response = await fetch('/api/archive-import', { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || 'Não foi possível consultar o histórico de importações.');
    const next = Object.fromEntries(((payload.imports || []) as RecoveryImport[]).map((item) => [item.source_key, item]));
    setImports(next);
    return next as Record<string, RecoveryImport>;
  };

  const discover = async () => {
    setError(''); setWarning(''); setSuccess(''); setFiles([]); setSelected(new Set()); setLoading(true);
    try {
      const token = await getSessionToken();
      let knownImports: Record<string, RecoveryImport> = {};
      let statusWarning = '';
      try { knownImports = await loadImportStatus(token); } catch (cause) { statusWarning = cause instanceof Error ? cause.message : 'O histórico de importações não pôde ser consultado.'; }
      setResultSource(sourceUrl);
      const response = await fetch('/api/archive-discovery', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sourceUrl, stream: true, maxFiles: searchLimit }) });
      if (!response.ok || !response.body) { const payload = await response.json().catch(() => ({})); throw new Error(payload?.error || 'Não foi possível pesquisar a origem.'); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let discoveredFiles: MediaFile[] = [];
      const consume = (line: string) => { if (!line.trim()) return; const event = JSON.parse(line); if (event.type === 'file') { discoveredFiles = [...discoveredFiles, event.file as MediaFile]; setFiles(discoveredFiles); } else if (event.type === 'warning') setWarning([event.warning, statusWarning].filter(Boolean).join(' ')); else if (event.type === 'error') throw new Error(event.error); else if (event.type === 'done') setResultSource(event.sourceUrl || sourceUrl); };
      while (true) { const { value, done } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; lines.forEach(consume); if (done) break; }
      if (buffer.trim()) consume(buffer); setResultSource((current) => current || sourceUrl); setWarning(statusWarning);
      const available = [...new Set(discoveredFiles.map((file) => file.segmentId).filter(Boolean) as string[])].filter((id) => !knownImports[sourceKeyFor(id)]);
      setSelected(new Set(available.slice(0, 20)));
      setActiveTab(available.length ? 'new' : 'downloaded');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível pesquisar a origem.'); } finally { setLoading(false); }
  };

  const toggleAlbum = (segmentId: string) => {
    if (imports[sourceKeyFor(segmentId)]) return;
    setSelected((current) => { const next = new Set(current); if (next.has(segmentId)) next.delete(segmentId); else if (next.size < 20) next.add(segmentId); return next; });
  };

  const exportCatalog = () => {
    const manifest = { exportedAt: new Date().toISOString(), sourceUrl: resultSource, albums: albums.map((album) => ({ sourceKey: sourceKeyFor(album.id), title: album.title, sourceUrl: album.sourceUrl, status: imports[sourceKeyFor(album.id)]?.status || 'not_registered', tracks: album.files.map((file, index) => ({ position: index + 1, number: file.trackNumber || null, name: file.name, extension: file.extension })) })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `catalogo-recuperacao-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
  };

  const stageSelectedAlbums = async () => {
    if (selected.size === 0) return;
    setError(''); setSuccess(''); setImporting(true);
    try {
      const token = await getSessionToken();
      const knownImports = await loadImportStatus(token);
      const segmentIds = [...selected].filter((id) => !knownImports[sourceKeyFor(id)]);
      if (segmentIds.length === 0) { setSelected(new Set()); setSuccess('Os álbuns selecionados já estavam cadastrados; nenhum registro foi duplicado.'); return; }
      const localSegmentIds = segmentIds.filter((id) => !id.startsWith('archive:'));
      const externalAlbums = segmentIds.filter((id) => id.startsWith('archive:')).map((id) => {
        const album = albums.find((item) => item.id === id);
        return album ? {
          sourceKey: album.id,
          title: album.title,
          sourceUrl: album.sourceUrl,
          tracks: album.files.map((file, index) => ({ title: file.name, number: file.trackNumber || index + 1 })),
        } : null;
      }).filter(Boolean);
      const response = await fetch('/api/archive-import', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ segmentIds: localSegmentIds, albums: externalAlbums }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Não foi possível cadastrar os álbuns.');
      const completed = (payload.results || []).filter((item: { success?: boolean }) => item.success).length;
      await loadImportStatus(token); setSelected(new Set()); setSuccess(`${completed} álbum(ns) cadastrado(s) como rascunho e enviado(s) para aprovação.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível cadastrar os álbuns.'); } finally { setImporting(false); }
  };

  return <div className="space-y-6 p-6">
    <div><h1 className="text-3xl font-bold text-white">Recuperação de mídias</h1><p className="mt-2 text-gray-400">Localize, exporte e envie álbuns recuperados para a fila de aprovação.</p></div>
    <div className="max-w-5xl rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <label className="mb-2 block text-sm font-medium text-gray-200">URL de origem ou arquivada</label>
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Link2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" /><input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://exemplo.com/pasta ou web.archive.org/web/..." className="w-full rounded-lg border border-gray-700 bg-gray-950 py-3 pl-10 pr-4 text-white outline-none focus:border-green-500" /></div><select value={searchLimit} onChange={(event) => setSearchLimit(Number(event.target.value))} className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-3 text-sm text-white"><option value={10}>10 arquivos</option><option value={25}>25 arquivos</option><option value={50}>50 arquivos</option><option value={100}>100 arquivos</option></select><button onClick={() => void discover()} disabled={loading || !sourceUrl.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar arquivos</button></div>
      <p className="mt-3 text-sm text-gray-500">Antes de cada busca, a ferramenta consulta o histórico e bloqueia álbuns já cadastrados. O cadastro cria rascunhos; nada é publicado automaticamente.</p>
    </div>
    {error && <div className="flex max-w-5xl gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
    {warning && <div className="flex max-w-5xl gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{warning}</div>}
    {success && <div className="flex max-w-5xl gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-100"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />{success}</div>}
    {resultSource && <section className="max-w-6xl overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
      <div className="flex flex-col gap-4 border-b border-gray-800 p-5 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-semibold text-white">Álbuns localizados</h2><p className="mt-1 text-sm text-gray-500">{visibleAlbums.length} álbuns nesta aba · {files.length} arquivos encontrados.</p><div className="mt-4 flex gap-2"><button onClick={() => setActiveTab('new')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${activeTab === 'new' ? 'bg-green-600 text-white' : 'border border-gray-700 text-gray-400'}`}>NOVOS ({albums.filter((a) => !imports[sourceKeyFor(a.id)]).length})</button><button onClick={() => setActiveTab('downloaded')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${activeTab === 'downloaded' ? 'bg-green-600 text-white' : 'border border-gray-700 text-gray-400'}`}>BAIXADOS ({albums.filter((a) => imports[sourceKeyFor(a.id)]).length})</button></div></div><div className="flex flex-wrap gap-2"><button onClick={exportCatalog} disabled={!albums.length} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-200 hover:border-green-500 hover:text-green-400 disabled:opacity-50"><Download className="h-4 w-4" /> Exportar catálogo</button><button onClick={() => void stageSelectedAlbums()} disabled={importing || selected.size === 0 || activeTab === 'downloaded'} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Cadastrar selecionados ({selected.size})</button></div></div>
      {visibleAlbums.length ? <div className="grid gap-3 p-5 md:grid-cols-2">{visibleAlbums.map((album) => { const imported = imports[sourceKeyFor(album.id)]; return <button key={album.id} type="button" onClick={() => toggleAlbum(album.id)} disabled={Boolean(imported)} className={`rounded-xl border p-4 text-left transition ${imported ? 'cursor-default border-gray-800 bg-gray-950/30' : selected.has(album.id) ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-950/50 hover:border-gray-500'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-white">{album.title}</p><p className="mt-1 text-sm text-gray-500">{album.files.length} faixa(s)</p></div>{imported ? <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${imported.status === 'approved' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-300'}`}>{statusLabel[imported.status]}</span> : <span className={`h-5 w-5 shrink-0 rounded border ${selected.has(album.id) ? 'border-green-400 bg-green-500' : 'border-gray-600'}`} />}</div>{imported && <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500"><Clock3 className="h-3.5 w-3.5" /> Cadastro existente — não será repetido.</p>}</button>; })}</div> : <p className="p-6 text-sm text-gray-500">Nenhum álbum nesta aba.</p>}
      <details className="border-t border-gray-800"><summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-300">Ver todos os arquivos encontrados</summary><div className="max-h-[460px] overflow-auto border-t border-gray-800">{files.map((file) => <a key={`${file.replayUrl}:${file.name}`} href={file.replayUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-gray-800 px-5 py-3 text-sm hover:bg-gray-800/60"><FileAudio className="h-4 w-4 shrink-0 text-green-400" /><span className="min-w-0 flex-1 truncate text-gray-100"><span className="block truncate">{file.name}</span>{file.container && <span className="mt-0.5 block truncate text-xs text-gray-500">{file.container}</span>}</span><span className="rounded bg-gray-800 px-2 py-1 text-xs uppercase text-gray-400">{file.extension}</span></a>)}</div></details>
    </section>}
  </div>;
}
