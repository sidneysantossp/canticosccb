import { useState } from 'react';
import { AlertTriangle, FileAudio, Link2, Loader2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase-auth';

type MediaFile = { name: string; extension: string; mimeType: string; replayUrl: string; container?: string };

export default function AdminArchiveRecovery() {
  const [sourceUrl, setSourceUrl] = useState('');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [resultSource, setResultSource] = useState('');

  const discover = async () => {
    setError('');
    setWarning('');
    setFiles([]);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/archive-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ sourceUrl }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Não foi possível pesquisar a origem.');
      setFiles(payload.files || []);
      setResultSource(payload.sourceUrl || '');
      setWarning(payload.warning || '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível pesquisar a origem.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="p-6 space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-white">Recuperação de mídias</h1>
      <p className="mt-2 text-gray-400">Localize arquivos do acervo histórico antes de vinculá-los ou importá-los.</p>
    </div>
    <div className="max-w-4xl rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <label className="mb-2 block text-sm font-medium text-gray-200">URL arquivada</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Link2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-500" /><input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://web.archive.org/web/..." className="w-full rounded-lg border border-gray-700 bg-gray-950 py-3 pl-10 pr-4 text-white outline-none focus:border-green-500" /></div>
        <button onClick={() => void discover()} disabled={loading || !sourceUrl.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar arquivos</></button>
      </div>
      <p className="mt-3 text-sm text-gray-500">Cole a URL completa ou apenas <code>web.archive.org/web/*/http://www.canticosccb.com.br</code>. A pesquisa apenas lista arquivos encontrados; ela não baixa, publica nem altera registros.</p>
    </div>
    {error && <div className="flex max-w-4xl gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
    {warning && <div className="flex max-w-4xl gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-100"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{warning}</div>}
    {resultSource && <section className="max-w-5xl rounded-xl border border-gray-800 bg-gray-900/50"><div className="flex items-center justify-between border-b border-gray-800 p-5"><div><h2 className="font-semibold text-white">Arquivos localizados</h2><p className="mt-1 text-sm text-gray-500">{files.length} arquivos encontrados para a origem analisada.</p></div><FileAudio className="h-5 w-5 text-green-400" /></div><div className="max-h-[520px] overflow-auto">{files.length ? files.map((file) => <a key={`${file.replayUrl}:${file.name}`} href={file.replayUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-gray-800 px-5 py-3 text-sm hover:bg-gray-800/60"><FileAudio className="h-4 w-4 shrink-0 text-green-400" /><span className="min-w-0 flex-1 truncate text-gray-100"><span className="block truncate">{file.name}</span>{file.container && <span className="mt-0.5 block truncate text-xs text-gray-500">{file.container}</span>}</span><span className="rounded bg-gray-800 px-2 py-1 text-xs uppercase text-gray-400">{file.extension}</span></a>) : <p className="p-6 text-sm text-gray-500">Nenhum arquivo de mídia foi localizado nesta origem.</p>}</div></section>}
  </div>;
}
