import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GiBanjo, GiGuitar, GiPianoKeys } from 'react-icons/gi';
import type { IconType } from 'react-icons';
import SEOHead from '@/components/SEO/SEOHead';
import { fetchMergedPublicCifrasList, type PublicCifraPageData } from '@/lib/cifras-v2';
import type { Cifra } from '@/api/cifras';

type DisplayCifra = Cifra | PublicCifraPageData;

const instruments: Array<{ key: string; title: string; description: string; Icon: IconType }> = [
  { key: 'violao', title: 'Violão', description: 'Cifras e acordes para violão', Icon: GiGuitar },
  { key: 'ukulele', title: 'Ukulele', description: 'Cifras adaptadas para ukulele', Icon: GiBanjo },
  { key: 'teclado', title: 'Teclado', description: 'Cifras para teclado e piano', Icon: GiPianoKeys },
];

const CifrasLandingPage: React.FC = () => {
  const [items, setItems] = useState<DisplayCifra[]>([]);

  useEffect(() => {
    void fetchMergedPublicCifrasList().then(setItems).catch(() => setItems([]));
  }, []);

  const counts = useMemo(() => Object.fromEntries(instruments.map(({ key }) => [key, items.filter((item) => item.instrument === key).length])), [items]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:py-16">
      <SEOHead
        title="Cifras CCB por instrumento"
        description="Escolha violão, ukulele ou teclado para estudar cifras de hinos CCB organizadas por instrumento."
        canonical="/cifras"
      />
      <header className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-400">Cifras CCB</p>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">Escolha seu instrumento</h1>
        <p className="mt-4 text-base leading-7 text-gray-400">Encontre as cifras organizadas para o instrumento que você toca.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Instrumentos disponíveis">
        {instruments.map(({ key, title, description, Icon }) => (
          <Link key={key} to={`/cifras/${key}`} className="group rounded-2xl border border-gray-700/70 bg-gray-800/40 p-6 transition hover:border-primary-400/70 hover:bg-primary-500/10">
            <Icon className="h-10 w-10 text-primary-400" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-bold text-white group-hover:text-primary-300">{title}</h2>
            <p className="mt-2 text-sm text-gray-400">{description}</p>
            <p className="mt-5 text-sm font-semibold text-primary-300">{counts[key] ?? 0} cifras disponíveis</p>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default CifrasLandingPage;
