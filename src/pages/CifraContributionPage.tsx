import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { submitCifraContribution } from '@/lib/cifraContributionsApi';

const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const CifraContributionPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isCorrection = params.get('type') === 'correction';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [form, setForm] = useState({ title: '', instrument: 'violao', arrangementType: 'completa', difficultyLevel: 'intermediario', tuning: 'standard', capo: '0', originalKey: 'C', preferredKey: '', tempoBpm: '', timeSignature: '4/4', bodyText: '', notes: '' });

  if (!user) {
    return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-2xl font-bold text-white">Inicie sessão para contribuir</h1><Link className="mt-5 inline-block rounded-xl bg-primary-500 px-5 py-3 font-semibold text-black" to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Entrar ou criar conta</Link></div>;
  }

  const update = (field: keyof typeof form, value: string) => setForm(current => ({ ...current, [field]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDuplicate(false); setIsSubmitting(true);
    try {
      const result = await submitCifraContribution({
        songId: params.get('songId'), baseVersionId: params.get('versionId'), contributionType: isCorrection ? 'correction' : 'new_version',
        ...form, capo: Number(form.capo), tempoBpm: form.tempoBpm ? Number(form.tempoBpm) : null,
        preferredKey: form.preferredKey || null,
      });
      if (result.code === 'DUPLICATE') { setDuplicate(true); return; }
      showToast('success', 'Enviado para revisão', 'A contribuição foi registada e será analisada pela equipa.');
      navigate('/profile/cifras?submitted=1');
    } catch (error) {
      console.error(error); showToast('error', 'Não foi possível enviar', 'Verifique os dados e tente novamente.');
    } finally { setIsSubmitting(false); }
  };

  const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-primary-500';
  return <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
    <Link to={-1 as never} className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
    <h1 className="text-3xl font-bold text-white">{isCorrection ? 'Contribua com a correção' : 'Enviar nova cifra ou tonalidade'}</h1>
    <p className="mt-2 text-gray-400">A submissão será analisada antes de ser publicada.</p>
    {duplicate && <div role="alert" className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">Já temos uma cifra/tablatura em revisão idêntica para essa música, instrumento e tonalidade. Por favor, volte em alguns dias e confira se a revisão já está disponível no site.</div>}
    <form onSubmit={submit} className="mt-8 space-y-5">
      <input className={inputClass} required placeholder="Nome da versão" value={form.title} onChange={e => update('title', e.target.value)} />
      <div className="grid gap-5 sm:grid-cols-2"><select className={inputClass} value={form.instrument} onChange={e => update('instrument', e.target.value)}><option value="violao">Violão & Guitarra</option><option value="ukulele">Ukulele</option><option value="teclado">Teclado</option><option value="cavaco">Cavaco</option></select><select className={inputClass} value={form.originalKey} onChange={e => update('originalKey', e.target.value)}>{KEYS.map(key => <option key={key}>{key}</option>)}</select></div>
      <div className="grid gap-5 sm:grid-cols-3"><input className={inputClass} type="number" min="0" max="24" placeholder="Capotraste" value={form.capo} onChange={e => update('capo', e.target.value)} /><input className={inputClass} type="number" min="20" max="300" placeholder="BPM" value={form.tempoBpm} onChange={e => update('tempoBpm', e.target.value)} /><input className={inputClass} placeholder="Afinação" value={form.tuning} onChange={e => update('tuning', e.target.value)} /></div>
      <textarea className={`${inputClass} min-h-[360px] font-mono`} required placeholder="Cole ou escreva a cifra com os acordes" value={form.bodyText} onChange={e => update('bodyText', e.target.value)} />
      <textarea className={`${inputClass} min-h-24`} placeholder="Observações para o revisor (opcional)" value={form.notes} onChange={e => update('notes', e.target.value)} />
      <button disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-bold text-black disabled:opacity-50"><Send className="h-4 w-4" />{isSubmitting ? 'A enviar…' : 'Enviar para revisão'}</button>
    </form>
  </main>;
};

export default CifraContributionPage;
