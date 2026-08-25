import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Quote, Search, Sparkles, Users } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import BibleSearchBox from '@/components/bible/BibleSearchBox';
import BibleTopNav from '@/components/bible/BibleTopNav';

const sections = {
  busca: { title: 'Busca na Bíblia', description: 'Encontre rapidamente um livro ou capítulo.', icon: Search },
  temas: { title: 'Temas bíblicos', description: 'Descubra passagens organizadas por assunto e intenção de leitura.', icon: Sparkles },
  personagens: { title: 'Personagens bíblicos', description: 'Navegue pelas jornadas e referências dos principais personagens.', icon: Users },
  dicionario: { title: 'Dicionário bíblico', description: 'Consulte termos, lugares e conceitos importantes para sua leitura.', icon: Quote },
} as const;

interface BibleExplorePageProps {
  section: keyof typeof sections;
}

const BibleExplorePage: React.FC<BibleExplorePageProps> = ({ section }) => {
  const current = sections[section];
  const Icon = current.icon;
  const noindex = true;

  return <div className="min-h-screen bg-[#0d0f0e] text-white"><SEOHead exactTitle title={`${current.title} | Bíblia CCB`} description={`${current.description} Use a experiência da Bíblia Online CCB com referência ACF, navegação rápida e leitura otimizada para celular.`} canonical={`/biblia-ccb/${section}`} noindex={noindex} /><BibleTopNav /><main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16"><Link to="/biblia-ccb" className="inline-flex items-center gap-2 text-sm text-primary-300"><ArrowLeft className="h-4 w-4" /> Voltar para a Bíblia</Link><div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-500/30 bg-primary-500/10"><Icon className="h-7 w-7 text-primary-400" /></div><h1 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">{current.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-gray-400">{current.description}</p><div className="mt-9"><BibleSearchBox /></div>{section !== 'busca' ? <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"><BookOpen className="h-6 w-6 text-primary-400" /><h2 className="mt-5 text-xl font-black">Catálogo em preparação editorial</h2><p className="mt-3 leading-7 text-gray-400">Esta área já integra a arquitetura da Bíblia e será preenchida com referências validadas, sem alterar ou inventar o conteúdo das fontes.</p></section> : null}</main></div>;
};

export default BibleExplorePage;
