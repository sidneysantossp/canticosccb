import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema } from '@/utils/schemaGenerator';

const InstrumentaisPage: React.FC = () => (
  <div className="min-h-screen bg-background-primary">
    <SEOHead
      title="Instrumentais CCB | Hinos Instrumentais"
      description="Hub de hinos instrumentais CCB para explorar repertório tocado e continuar sua experiência musical."
      keywords="hinos instrumentais ccb, hinos tocados ccb"
      canonical="/instrumentais"
      schemaData={[
        generateBreadcrumbSchema([
          { name: 'Início', url: '/' },
          { name: 'Instrumentais', url: '/instrumentais' },
        ]),
      ]}
    />

    <section className="-mx-4 min-h-[calc(100vh-5rem)] bg-gradient-to-b from-primary-600/35 via-primary-950/25 to-background-primary px-4 py-16 sm:-mx-6 sm:px-6 sm:py-20">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-6xl items-start">
        <div>
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-white/80 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-200">Playlist pública</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-white md:text-5xl">Instrumentais CCB</h1>
          <p className="mt-3 max-w-3xl text-base text-white/85 md:text-lg">
            Hub público para buscas por hinos instrumentais, hinos tocados e repertório musical.
          </p>
        </div>
      </div>
    </section>
  </div>
);

export default InstrumentaisPage;
