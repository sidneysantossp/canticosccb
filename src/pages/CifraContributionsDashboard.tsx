import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, RefreshCw } from 'lucide-react';
import { listMyCifraContributions, type CifraContribution } from '@/lib/cifraContributionsApi';

const statusLabel: Record<string, string> = { pending: 'Aguardando aprovação', in_review: 'Em revisão', changes_requested: 'Revisão solicitada', approved: 'Aprovada', published: 'Publicada', rejected: 'Rejeitada' };

const CifraContributionsDashboard: React.FC = () => {
  const [rows, setRows] = useState<CifraContribution[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listMyCifraContributions().then(setRows).finally(() => setLoading(false)); }, []);
  const groups = [
    { title: 'Aguardando aprovação', values: rows.filter(row => ['pending', 'in_review'].includes(row.status)) },
    { title: 'Aprovadas e publicadas', values: rows.filter(row => ['approved', 'published'].includes(row.status)) },
    { title: 'Rejeitadas ou para revisão', values: rows.filter(row => ['rejected', 'changes_requested'].includes(row.status)) },
  ];
  return <main className="mx-auto max-w-5xl px-4 py-8 pb-24"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold text-white">Minhas cifras enviadas</h1><p className="mt-2 text-gray-400">Acompanhe as cifras e tonalidades que você enviou.</p></div><Link to="/contribuir-cifra" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-3 font-semibold text-black"><FilePlus2 className="h-4 w-4" /> Nova cifra</Link></div>{loading ? <div className="mt-10 flex items-center gap-2 text-gray-400"><RefreshCw className="h-4 w-4 animate-spin" /> A carregar…</div> : <div className="mt-8 space-y-8">{groups.map(group => <section key={group.title}><h2 className="mb-3 text-lg font-semibold text-white">{group.title} <span className="text-sm text-gray-500">({group.values.length})</span></h2>{group.values.length === 0 ? <p className="rounded-2xl border border-white/10 p-5 text-gray-500">Nenhuma submissão nesta categoria.</p> : <div className="space-y-3">{group.values.map(row => <article key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{row.title || 'Cifra sem título'}</h3><p className="mt-1 text-sm text-gray-400">{row.instrument} · Tom {row.original_key} · {row.contribution_type === 'correction' ? 'Correção' : 'Nova versão'}</p></div><span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs text-primary-200">{statusLabel[row.status] || row.status}</span></div>{row.reviewer_notes && <p className="mt-3 rounded-xl bg-black/20 p-3 text-sm text-gray-300">Nota do revisor: {row.reviewer_notes}</p>}</article>)}</div>}</section>)}</div>}</main>;
};
export default CifraContributionsDashboard;
