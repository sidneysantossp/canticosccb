import React from 'react';
import { Music, Heart, Users, Globe, Award, Target } from 'lucide-react';

const AboutPage: React.FC = () => {
  const stats = [
    { icon: Users, label: 'Usuários Ativos', value: '2.5M+' },
    { icon: Music, label: 'Hinos Disponíveis', value: '1.200+' },
    { icon: Globe, label: 'Países', value: '50+' },
    { icon: Heart, label: 'Músicas Curtidas', value: '100M+' }
  ];

  const values = [
    {
      icon: Target,
      title: 'Nossa Missão',
      description: 'Levar a mensagem dos hinos sagrados a todos os corações, preservando a tradição e facilitando o acesso à adoração musical.'
    },
    {
      icon: Heart,
      title: 'Nossa Visão',
      description: 'Ser a plataforma referência para hinos cristãos, unindo tradição e tecnologia para edificar vidas através da música.'
    },
    {
      icon: Award,
      title: 'Nossos Valores',
      description: 'Excelência, respeito à tradição, inovação tecnológica, acessibilidade e compromisso com a comunidade.'
    }
  ];

  const timeline = [
    { year: '2020', title: 'Fundação', description: 'Início do projeto com o objetivo de digitalizar os hinos' },
    { year: '2021', title: 'Lançamento', description: 'Primeira versão da plataforma com 500 hinos' },
    { year: '2022', title: 'Expansão', description: 'Alcançamos 1 milhão de usuários' },
    { year: '2023', title: 'Inovação', description: 'Lançamento do app mobile e recursos premium' },
    { year: '2024', title: 'Presente', description: 'Mais de 2.5 milhões de usuários em 50 países' }
  ];

  return (
    <div className="min-h-screen bg-background-primary pb-32">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary-900/20 to-background-primary py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Sobre Nós
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Conectando corações através da música sagrada desde 2020
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
              O Cânticos CCB nasceu da visão de tornar os hinos sagrados acessíveis a todos, em qualquer lugar e a qualquer momento. Fundado em 2020, começamos com um simples objetivo: preservar e compartilhar a rica tradição musical da Congregação Cristã no Brasil.
            </p>
            <p>
              Ao longo dos anos, evoluímos de uma simples coleção digital para uma plataforma completa de streaming, oferecendo recursos como playlists personalizadas, modo offline, letras sincronizadas e muito mais. Hoje, servimos milhões de usuários ao redor do mundo.
            </p>
            <p>
              Nossa missão vai além da tecnologia. Buscamos criar uma comunidade unida pela fé e pela música, onde cada hino conta uma história e toca corações. Continuamos inovando, mas sempre com respeito à tradição que nos inspira.
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
            Junte-se a milhões de pessoas que compartilham a fé através da música
          </p>
          <button className="px-8 py-4 bg-white text-primary-600 font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105">
            Começar Agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
