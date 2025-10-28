import React, { useMemo, useState } from 'react';
import SEOHead from '@/components/SEO/SEOHead';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useCopyrightClaimsStore from '@/stores/copyrightClaimsStore';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';

const ContentClaimPage: React.FC = () => {
  const updatedAt = 'Outubro/2025';
  const { createClaim } = useCopyrightClaimsStore();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [claimType, setClaimType] = useState<'composer' | 'author' | 'both'>('author');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = useMemo(() => {
    try { if (!url) return false; new URL(url); return true; } catch { return false; }
  }, [url]);

  const canSubmit = name.trim() && /.+@.+\..+/.test(email) && isValidUrl && description.trim();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const arr = Array.from(e.target.files).slice(0, 5);
    setFiles(arr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Mapeia para o fluxo existente (dados mínimos quando não há música aberta)
      const created = createClaim({
        songId: 0,
        songTitle: 'Conteúdo informado via URL pública',
        songArtist: 'Desconhecido',
        songCoverUrl: '/logo-canticos-ccb.png',
        composerId: 'public_user',
        composerName: name.trim(),
        composerEmail: email.trim(),
        claimType,
        description: `${description}\n\nURL do conteúdo: ${url}`,
        proofDocuments: files.map(f => f.name),
        priority: 'medium'
      } as any);
      setProtocol(created.id);
      setSubmitting(false);
    } catch (err) {
      setSubmitting(false);
      setError('Não foi possível enviar sua reivindicação agora. Tente novamente em instantes.');
    }
  };

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Reivindicação de Conteúdo"
        description="Procedimento de notice-and-takedown e contranotificação para titulares de direitos na plataforma Cânticos CCB."
        canonical="/reivindicacao-de-conteudo"
      />

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Reivindicação de Conteúdo</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: {updatedAt}</p>

      <div className="space-y-8 text-gray-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Escopo</h2>
          <p>
            Este procedimento destina-se a titulares de direitos autorais, conexos, marcários ou de personalidade que identifiquem conteúdo potencialmente infringente publicado por usuários na plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Notificação (Notice)</h2>
          <p className="mb-3">Envie uma notificação contendo, preferencialmente:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Identificação do conteúdo (URL(s) específica(s) e descrição suficiente);</li>
            <li>Identificação do titular e comprovação de representação, quando aplicável;</li>
            <li>Fundamentação legal (ex.: Lei 9.610/98, Lei 9.279/96), com indicação da obra/sinal e direito atingido;</li>
            <li>Declaração de boa-fé de que as informações são verdadeiras;</li>
            <li>Dados de contato para retorno (e-mail e telefone).</li>
          </ul>
          <p className="mt-3">Canal: <a href="/contato" className="text-primary-400 hover:underline">/contato</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Análise e providências</h2>
          <p>
            Recebida a notificação válida, poderemos ocultar preventivamente o conteúdo enquanto avaliamos o mérito. Confirmada a violação, o conteúdo será removido ou ajustado. Poderemos solicitar documentos complementares.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Contranotificação</h2>
          <p>
            O usuário responsável poderá apresentar contranotificação fundamentada, anexando autorizações/licenças quando aplicável. Diante de controvérsia plausível, o conteúdo poderá ser restabelecido até decisão judicial ou acordo entre as partes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Responsabilidades</h2>
          <p>
            Nos termos do Marco Civil da Internet, a plataforma não responde preventivamente por conteúdos de terceiros, seguindo o regime de notificação específica e medidas proporcionais.
          </p>
        </section>

        {/* Formulário público (somente usuários autenticados podem enviar) */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Abrir uma reivindicação agora</h2>
          {!user ? (
            <div className="bg-blue-900/20 border border-blue-900/30 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Entre para enviar uma reivindicação</h3>
              <p className="text-sm text-gray-300 mb-4">Para evitar spam e garantir segurança jurídica, apenas usuários registrados podem enviar solicitações.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/login" className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-black font-semibold">Entrar</Link>
                <Link to="/register" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium">Criar conta</Link>
              </div>
            </div>
          ) : !protocol ? (
            <form onSubmit={handleSubmit} className="bg-background-secondary border border-gray-700 rounded-xl p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-amber-300 bg-amber-900/20 border border-amber-900/30 rounded p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Seu nome</label>
                  <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg bg-black/30 border border-gray-700 px-3 py-2 text-white outline-none focus:border-primary-500" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Seu e-mail</label>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg bg-black/30 border border-gray-700 px-3 py-2 text-white outline-none focus:border-primary-500" required />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">URL do conteúdo (hino/álbum/página)</label>
                <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className={`w-full rounded-lg bg-black/30 border px-3 py-2 text-white outline-none focus:border-primary-500 ${url && !isValidUrl ? 'border-red-600' : 'border-gray-700'}`} required />
                {url && !isValidUrl && <p className="text-xs text-red-400 mt-1">Informe uma URL válida.</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Natureza da reivindicação</label>
                <div className="flex gap-3 text-sm">
                  {(['author','composer','both'] as const).map(t => (
                    <label key={t} className={`px-3 py-2 rounded-lg border cursor-pointer ${claimType===t?'border-primary-500 text-white bg-primary-500/10':'border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                      <input type="radio" name="claimType" value={t} className="hidden" checked={claimType===t} onChange={()=>setClaimType(t)} />
                      {t==='author'?'Autor/Intérprete':t==='composer'?'Compositor':'Ambos'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição detalhada</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={5} className="w-full rounded-lg bg-black/30 border border-gray-700 px-3 py-2 text-white outline-none focus:border-primary-500" placeholder="Explique a situação, indique a obra, fundamento legal e o que solicita (remoção, ajuste, etc.)" required />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Anexos (opcional, até 5 arquivos)</label>
                <input type="file" multiple onChange={onFileChange} className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20" />
                {files.length>0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                    {files.map((f,i)=>(
                      <span key={i} className="px-2 py-1 rounded bg-white/10 border border-white/10 inline-flex items-center gap-1">
                        <Upload className="w-3 h-3" /> {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">Ao enviar, você declara agir de boa-fé e ser titular ou representante autorizado.</p>
                <button disabled={submitting || !canSubmit} className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-medium">
                  {submitting ? 'Enviando...' : 'Enviar Reivindicação'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-green-900/20 border border-green-900/30 rounded-xl p-6 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold">Reivindicação enviada com sucesso</h3>
                <p className="text-sm text-gray-300 mt-1">Protocolo: <span className="font-mono text-green-300">{protocol}</span></p>
                <p className="text-sm text-gray-300 mt-3">Acompanhe respostas no e-mail informado. Se você estiver no player de um hino específico, também pode usar o botão de reivindicação para anexar mais detalhes.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ContentClaimPage;
