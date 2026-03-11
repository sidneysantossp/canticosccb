import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, DownloadCloud, Disc3, Music4 } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateBreadcrumbSchema, generateFAQSchema } from '@/utils/schemaGenerator';

type DownloadTopic = 'hinos' | 'albuns';

const PAGE_CONFIG: Record<DownloadTopic, {
  path: string;
  title: string;
  heading: string;
  description: string;
  intro: string;
  keywords: string;
  relatedLinks: Array<{ label: string; href: string }>;
  faq: Array<{ question: string; answer: string }>;
}> = {
  hinos: {
    path: '/baixar-hinos-ccb',
    title: 'Baixar Hinos CCB | Como Ouvir Hinos da CCB Online',
    heading: 'Baixar Hinos CCB',
    description: 'Guia para quem procura baixar hinos CCB. Veja como ouvir hinos online, encontrar letras, cifras, álbuns e repertório relacionado.',
    intro: 'Esta página atende a busca por baixar hinos CCB de forma honesta: o foco da plataforma é ouvir online, navegar pelo repertório, acessar letras do hinário e encontrar cifras e álbuns relacionados.',
    keywords: 'baixar hinos ccb, download hinos ccb, ouvir hinos ccb online, letras hinos ccb, cifras ccb',
    relatedLinks: [
      { label: 'Ver Hinário 5', href: '/hinario' },
      { label: 'Ouvir hinos cantados', href: '/hinos-cantados-ccb' },
      { label: 'Ouvir hinos avulsos', href: '/hinos-avulsos-ccb' },
      { label: 'Explorar cifras', href: '/cifras' },
    ],
    faq: [
      {
        question: 'Posso baixar hinos da CCB nesta plataforma?',
        answer: 'A plataforma prioriza ouvir hinos online, navegar pelo repertório, acessar letras e cifras. Quando houver recursos específicos de biblioteca ou acesso futuro, eles serão informados dentro do próprio site.',
      },
      {
        question: 'Onde encontro letra e cifra dos hinos da CCB?',
        answer: 'Você pode usar o Hinário para as letras, as páginas individuais de hino para navegação musical e a área de cifras para acordes por instrumento.',
      },
    ],
  },
  albuns: {
    path: '/baixar-albuns-ccb',
    title: 'Baixar Albuns CCB | Como Ouvir Albuns e Coletaneas CCB',
    heading: 'Baixar Albuns CCB',
    description: 'Guia para quem procura baixar álbuns CCB. Veja como ouvir álbuns, playlists, repertório relacionado e navegar pelas coleções publicadas.',
    intro: 'Esta página atende a busca por baixar álbuns CCB com foco em acesso honesto: aqui você encontra caminhos para ouvir álbuns, explorar playlists e navegar por coletâneas e repertório relacionado.',
    keywords: 'baixar albuns ccb, baixar cds ccb, ouvir albuns ccb, playlists ccb, coletaneas ccb',
    relatedLinks: [
      { label: 'Ver álbuns CCB', href: '/albuns' },
      { label: 'Explorar playlists', href: '/playlists' },
      { label: 'Ouvir hinos tocados', href: '/hinos-tocados-ccb' },
      { label: 'Buscar repertório', href: '/search' },
    ],
    faq: [
      {
        question: 'Posso baixar cds ou álbuns da CCB aqui?',
        answer: 'O foco atual é disponibilizar navegação, escuta online e descoberta de repertório. A página reúne caminhos para álbuns, playlists e coleções já publicadas.',
      },
      {
        question: 'Onde encontro coleções e playlists da CCB?',
        answer: 'Você pode navegar pela página de álbuns e pela área de playlists para encontrar coletâneas, repertórios temáticos e seleções editoriais.',
      },
    ],
  },
};

interface DownloadIntentPageProps {
  topic: DownloadTopic;
}

const DownloadIntentPage: React.FC<DownloadIntentPageProps> = ({ topic }) => {
  const config = PAGE_CONFIG[topic];
  const accentIcon = topic === 'hinos' ? Music4 : Disc3;
  const AccentIcon = accentIcon;

  return (
    <div className="min-h-screen bg-background-primary">
      <SEOHead
        title={config.title}
        description={config.description}
        keywords={config.keywords}
        canonical={config.path}
        schemaData={[
          generateBreadcrumbSchema([
            { name: 'Inicio', url: '/' },
            { name: config.heading, url: config.path },
          ]),
          generateFAQSchema(config.faq),
        ]}
      />

      <div className="bg-gradient-to-b from-primary-700/20 to-transparent pt-20 pb-8 px-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <DownloadCloud className="w-7 h-7 text-primary-300" />
            </div>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{config.heading}</h1>
              <p className="text-white/85 text-base md:text-lg mt-3">{config.intro}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">O que fazer nesta plataforma</h2>
              <p className="text-text-muted mt-1">Página informativa para capturar a busca e levar o usuário ao conteúdo real.</p>
            </div>
            <AccentIcon className="w-6 h-6 text-primary-400" />
          </div>

          <div className="space-y-4 text-text-muted">
            <p>
              Se a sua intenção é encontrar {topic === 'hinos' ? 'hinos' : 'álbuns'} da CCB para ouvir, estudar ou navegar,
              o melhor caminho aqui é usar as páginas canônicas do repertório: hinos individuais, Hinário, cifras, álbuns e playlists.
            </p>
            <p>
              Isso melhora a experiência do usuário, evita páginas enganosas e conecta a busca por download ao conteúdo realmente disponível na plataforma.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {config.relatedLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white hover:border-primary-500/30 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Como usar esta busca a nosso favor</h2>
            <ul className="space-y-3 text-sm text-text-muted">
              <li>Capturar intenção informacional sem prometer algo que o site não entrega.</li>
              <li>Redirecionar a visita para páginas canônicas e indexáveis do repertório.</li>
              <li>Fortalecer a malha interna entre hinos, álbuns, playlists e cifras.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-background-secondary p-6">
            <h2 className="text-xl font-semibold text-white mb-3">Perguntas frequentes</h2>
            <div className="space-y-4">
              {config.faq.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-white font-medium">{faq.question}</h3>
                  <p className="text-text-muted text-sm mt-1">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DownloadIntentPage;
