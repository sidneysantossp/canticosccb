import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Music,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import { compositoresApi, documentReviewsApi } from '@/lib/api-client';
import { supabaseFetch } from '@/lib/supabaseRest';

interface ComposerRecord {
  [key: string]: any;
}

interface DocumentRecord {
  id: string | number;
  document_type?: string;
  document_number?: string;
  expected_name?: string;
  extracted_name?: string;
  image_path?: string;
  signed_url?: string | null;
  status?: string;
  admin_notes?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Não informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
};

const valueOrDash = (value: unknown) => {
  if (value === null || value === undefined || value === '') return 'Não informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
};

const statusLabel = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved' || normalized === 'active' || normalized === 'ativo') return 'Aprovado/ativo';
  if (normalized === 'rejected' || normalized === 'recusado') return 'Rejeitado';
  if (normalized === 'pending' || normalized === 'pendente') return 'Pendente';
  return valueOrDash(status);
};

const documentStatusClass = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved' || normalized === 'aprovado') return 'text-green-300 bg-green-500/10 border-green-500/30';
  if (normalized === 'rejected' || normalized === 'rejeitado') return 'text-red-300 bg-red-500/10 border-red-500/30';
  return 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30';
};

const AdminComposerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [composer, setComposer] = useState<ComposerRecord | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [songs, setSongs] = useState<ComposerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        setError('Compositor não identificado.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [composerResponse, documentsResponse, songsResponse] = await Promise.all([
          compositoresApi.get(id),
          documentReviewsApi.getByCompositor(id),
          supabaseFetch<any>('hinos', {
            compositor_id: `eq.${id}`,
            select: 'id,titulo,status,cover_url,audio_url,plays,plays_count,created_at',
            order: 'created_at.desc',
            limit: '100',
          }),
        ]);

        if (!composerResponse.data) {
          throw new Error(composerResponse.error || 'Compositor não encontrado.');
        }

        if (!cancelled) {
          setComposer(composerResponse.data as ComposerRecord);
          setDocuments(((documentsResponse.data as any)?.documents || []) as DocumentRecord[]);
          setSongs(Array.isArray(songsResponse) ? songsResponse : []);
        }
      } catch (loadError: any) {
        if (!cancelled) setError(loadError?.message || 'Não foi possível carregar os dados do compositor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-gray-300">Carregando dados reais do compositor...</div>;
  }

  if (error || !composer) {
    return (
      <div className="p-8 space-y-4">
        <button onClick={() => navigate('/admin/composers')} className="text-gray-300 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Voltar para compositores
        </button>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">{error || 'Compositor não encontrado.'}</div>
      </div>
    );
  }

  const artisticName = composer.artistic_name || composer.nome_artistico || composer.name || 'Sem nome artístico';
  const realName = composer.name || composer.nome || 'Não informado';
  const verified = composer.verified === true || composer.verificado === true || composer.verificado === 1;
  const avatar = composer.avatar_url || composer.photo_url;
  const totalPlays = songs.reduce((sum, song) => sum + Number(song.plays_count ?? song.plays ?? 0), 0);
  const knownFields: Array<[string, unknown]> = [
    ['ID do compositor', composer.id],
    ['ID do utilizador', composer.user_id || composer.usuario_id],
    ['E-mail', composer.email],
    ['Telefone', composer.phone || composer.telefone],
    ['CPF/documento', composer.cpf || composer.document_number],
    ['Localização', composer.location || composer.localizacao],
    ['Categoria', composer.category || composer.categoria],
    ['Slug', composer.slug],
    ['Criado em', formatDate(composer.created_at)],
    ['Atualizado em', formatDate(composer.updated_at)],
    ['Aprovado em', formatDate(composer.approved_at)],
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/composers')} className="p-2 hover:bg-gray-800 rounded-lg" aria-label="Voltar">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Detalhes do Compositor</h1>
            <p className="text-gray-400">Ficha administrativa e documentação recebida</p>
          </div>
        </div>
        <Link to={`/admin/composers/${id}/edit`} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Editar perfil</Link>
      </div>

      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-wrap items-start gap-5">
          {avatar ? <img src={avatar} alt={artisticName} className="w-28 h-28 rounded-full object-cover" /> : <div className="w-28 h-28 rounded-full bg-gray-800 flex items-center justify-center"><User className="w-12 h-12 text-gray-500" /></div>}
          <div className="flex-1 min-w-[260px]">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{artisticName}</h2>
              {verified ? <span className="inline-flex items-center gap-1 text-green-300"><CheckCircle className="w-5 h-5" /> Verificado</span> : <span className="inline-flex items-center gap-1 text-yellow-300"><Clock className="w-5 h-5" /> Não verificado</span>}
              <span className="px-2 py-1 rounded-full border border-gray-700 text-gray-300 text-xs">{statusLabel(composer.status)}</span>
            </div>
            <p className="text-gray-300 mt-2">Nome completo: {realName}</p>
            <p className="text-gray-400 flex items-center gap-2 mt-2"><Mail className="w-4 h-4" /> {valueOrDash(composer.email)}</p>
            {composer.location && <p className="text-gray-400 flex items-center gap-2 mt-1"><MapPin className="w-4 h-4" /> {composer.location}</p>}
            <p className="text-gray-300 mt-4 whitespace-pre-wrap">{valueOrDash(composer.biography || composer.bio)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Hinos', songs.length, Music],
          ['Plays', totalPlays, Music],
          ['Seguidores', composer.followers_count ?? 0, User],
          ['Documentos', documents.length, FileText],
        ].map(([label, value, Icon]: any) => (
          <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <Icon className="w-7 h-7 text-green-400 mb-2" />
            <p className="text-gray-400 text-xs">{label}</p>
            <p className="text-2xl font-bold text-white">{valueOrDash(value)}</p>
          </div>
        ))}
      </section>

      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Informações completas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {knownFields.map(([label, value]) => <div key={label} className="border-b border-gray-800 pb-3"><p className="text-gray-500 text-xs mb-1">{label}</p><p className="text-gray-200 break-words">{valueOrDash(value)}</p></div>)}
        </div>
      </section>

      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold text-white flex items-center gap-2"><FileText className="w-5 h-5" /> Documentos enviados</h3><span className="text-gray-400 text-sm">{documents.length} documento(s)</span></div>
        {documents.length === 0 ? <p className="text-gray-400">Nenhum documento enviado ou a consulta não tem permissão para os documentos deste compositor.</p> : <div className="space-y-4">{documents.map((document) => <div key={document.id} className="border border-gray-800 rounded-lg p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-white font-semibold">{valueOrDash(document.document_type)}</p><p className="text-gray-400 text-sm">Número: {valueOrDash(document.document_number)}</p><p className="text-gray-400 text-sm">Enviado em: {formatDate(document.created_at)}</p></div><span className={`px-2 py-1 rounded border text-xs ${documentStatusClass(document.status)}`}>{statusLabel(document.status)}</span></div><div className="grid md:grid-cols-2 gap-3 mt-3 text-sm"><p className="text-gray-300">Nome esperado: <span className="text-white">{valueOrDash(document.expected_name)}</span></p><p className="text-gray-300">Nome extraído: <span className="text-white">{valueOrDash(document.extracted_name)}</span></p><p className="text-gray-300">Revisor: <span className="text-white">{valueOrDash(document.reviewed_by)}</span></p><p className="text-gray-300">Revisado em: <span className="text-white">{formatDate(document.reviewed_at)}</span></p></div>{document.admin_notes && <p className="text-gray-300 mt-3">Notas administrativas: <span className="text-white">{document.admin_notes}</span></p>}{document.signed_url ? <div className="mt-4 space-y-3"><a href={document.signed_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200"><ExternalLink className="w-4 h-4" /> Abrir documento/anexo</a><img src={document.signed_url} alt={`Documento ${document.document_type || ''}`} className="max-h-80 max-w-full rounded-lg border border-gray-700 object-contain bg-black/20" /></div> : document.image_path ? <p className="text-yellow-300 text-sm mt-3">O ficheiro existe, mas não foi possível gerar uma URL assinada. Verifique a permissão Storage do Admin.</p> : <p className="text-gray-500 text-sm mt-3">Sem ficheiro associado.</p>}</div>)}</div>}
      </section>

      <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Hinos associados</h3>
        {songs.length === 0 ? <p className="text-gray-400">Nenhum hino associado a este compositor.</p> : <div className="space-y-2">{songs.map((song) => <div key={song.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-800/50 rounded-lg"><div><p className="text-white">{song.titulo || 'Sem título'}</p><p className="text-gray-500 text-xs">{statusLabel(song.status)} · {formatDate(song.created_at)}</p></div><span className="text-gray-400 text-sm">{Number(song.plays_count ?? song.plays ?? 0)} plays</span></div>)}</div>}
      </section>
    </div>
  );
};

export default AdminComposerDetail;

// Evita que imports de ícones sejam removidos em builds muito agressivos quando
// a página é carregada através de uma rota administrativa dinâmica.
void XCircle;
void Calendar;
void Shield;
void ExternalLink;
void CheckCircle;
void Music;
void FileText;
void User;
void Mail;
void MapPin;
void Clock;
