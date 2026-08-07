import React from 'react';
import { Music, Heart, Users, Globe, Award, Target } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';
import { generateOrganizationSchema } from '@/utils/schemaGenerator';
const AboutPage: React.FC = () => {
  const schema = generateOrganizationSchema();

  const stats = [
    { icon: Music, label: 'Acervo de hinos, letras e cifras', value: 'Público' },
    { icon: Users, label: 'Conteúdo revisado e organizado', value: 'Moderado' },
    { icon: Globe, label: 'Idioma principal da plataforma', value: 'pt-BR' },
    { icon: Heart, label: 'Projeto sem vínculo institucional', value: 'Independente' }
  ];

  const values = [
    {
      icon: Target,
      title: 'Nossa Missão',
      description: 'Organizar hinos, letras, cifras, álbuns e playlists em páginas públicas fáceis de encontrar, com navegação clara e respeito aos direitos de autores, intérpretes e titulares.'
    },
    {
      icon: Heart,
      title: 'Nossa Visão',
      description: 'Ser uma referência digital de descoberta e estudo musical para quem busca repertório relacionado à Congregação Cristã no Brasil.'
    },
    {
      icon: Award,
      title: 'Nossos Valores',
      description: 'Clareza editorial, respeito à tradição, boa-fé com titulares de direitos, acessibilidade e melhoria contínua da experiência.'
    }
  ];

  const timeline = [
    { year: 'Base', title: 'Organização do acervo', description: 'Estruturação de páginas para hinos, letras, cifras, álbuns, compositores e categorias.' },
    { year: 'SEO', title: 'Páginas canônicas', description: 'Padronização de URLs públicas, metadados, sitemap e dados estruturados para mecanismos de busca.' },
    { year: 'IA', title: 'Descoberta por assistentes', description: 'Preparação de robots, llms.txt e conteúdo rastreável para sistemas de busca e resposta generativa.' },
    { year: 'Hoje', title: 'Melhoria contínua', description: 'Evolução de performance, moderação, qualidade editorial e clareza sobre a natureza independente do projeto.' }
  ];

  return (
    <>
      <SEOHead
        title="Sobre Nós"
        description="Conheça a plataforma Cânticos CCB, um projeto independente para organizar hinos, letras, cifras, álbuns e playlists relacionados à CCB."
        keywords="sobre Cânticos CCB, hinos CCB, cifras CCB, hinário CCB, plataforma independente"
        canonical="/about"
        schemaData={schema}
      />
      
      <div className="min-h-screen bg-background-primary pb-32">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-primary-900/20 to-background-primary py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Sobre Nós
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Projeto independente para organizar e facilitar a descoberta de hinos, letras, cifras e repertórios relacionados à CCB
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-background-secondary rounded-xl p-6 text-center border border-gray-800">
                <Icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-text-muted text-sm">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story */}
      <div className="max-w-4xl mx-auto px-6 mb-20">
        <div className="bg-background-secondary rounded-2xl p-8 md:p-12 border border-gray-800">
          <h2 className="text-3xl font-bold text-white mb-6">Nossa História</h2>
          <div className="space-y-4 text-text-muted leading-relaxed">
            <p>
              O Cânticos CCB organiza conteúdo musical relacionado à Congregação Cristã no Brasil em uma experiência digital pública, com páginas para hinos, letras, cifras, álbuns, compositores, categorias e playlists.
            </p>
            <p>
              A plataforma busca facilitar a descoberta do repertório, criar conexões entre páginas relacionadas e manter metadados claros para usuários, mecanismos de busca e assistentes de IA.
            </p>
            <p>
              O projeto é independente e não possui vínculo, endosso, patrocínio ou relação institucional com a Congregação Cristã no Brasil. Conteúdos enviados pela comunidade passam por organização e podem ser revisados ou removidos mediante solicitação válida de direitos.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Nossos Pilares
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div key={index} className="bg-background-secondary rounded-xl p-8 border border-gray-800 hover:border-primary-500/50 transition-all">
                <Icon className="w-12 h-12 text-primary-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-text-muted">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Nossa Jornada
        </h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-500/30" />
          <div className="space-y-8">
            {timeline.map((item, index) => (
              <div key={index} className="relative pl-20">
                <div className="absolute left-0 w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center font-bold text-black">
                  {item.year}
                </div>
                <div className="bg-background-secondary rounded-xl p-6 border border-gray-800">
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Faça Parte da Nossa História
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Explore o acervo público, encontre hinos por número, título, compositor ou categoria e acompanhe as melhorias da plataforma.
          </p>
          <button className="px-8 py-4 bg-white text-primary-600 font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105">
            Começar Agora
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

export default AboutPage;
