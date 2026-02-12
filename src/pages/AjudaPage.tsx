import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Mail, MessageCircle, FileText, Shield } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';

const AjudaPage: React.FC = () => {
  const topicos = [
    { icon: MessageCircle, title: 'Perguntas Frequentes', desc: 'Respostas para as dúvidas mais comuns sobre a plataforma.', link: '#faq' },
    { icon: FileText, title: 'Termos de Uso', desc: 'Leia os termos que regem o uso da plataforma.', link: '/termos' },
    { icon: Shield, title: 'Privacidade', desc: 'Saiba como protegemos seus dados pessoais.', link: '/privacidade' },
    { icon: Mail, title: 'Contato', desc: 'Entre em contato conosco para suporte personalizado.', link: '/contato' },
  ];

  const faq = [
    { q: 'Como criar uma conta?', a: 'Clique em "Cadastrar" no menu superior e preencha seus dados. Você também pode se cadastrar usando sua conta Google.' },
    { q: 'Como publicar minhas composições?', a: 'Cadastre-se como compositor através da página "Sou Compositor" e, após aprovação, acesse o painel do compositor para enviar seus hinos.' },
    { q: 'A plataforma é gratuita?', a: 'Sim! A plataforma é gratuita para ouvintes. Compositores também podem publicar gratuitamente.' },
    { q: 'Como reportar conteúdo inadequado?', a: 'Utilize a página de Reivindicação de Conteúdo ou entre em contato conosco pelo formulário de contato.' },
    { q: 'Como funciona o plano Premium?', a: 'O plano Premium oferece benefícios como downloads offline, qualidade superior de áudio e experiência sem interrupções.' },
  ];

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Central de Ajuda - Cânticos CCB"
        description="Central de ajuda da plataforma Cânticos CCB. Encontre respostas para suas dúvidas."
      />

      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Central de Ajuda</h1>
      </div>

      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <HelpCircle className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Como podemos ajudar?</h2>
        <p className="text-text-muted">Encontre respostas rápidas ou entre em contato conosco.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {topicos.map((item, i) => (
          <Link
            key={i}
            to={item.link}
            className="bg-background-secondary rounded-xl p-5 border border-white/5 hover:border-primary-500/30 transition-colors group"
          >
            <item.icon className="w-6 h-6 text-primary-400 mb-3 group-hover:text-primary-300 transition-colors" />
            <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-text-muted text-xs">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div id="faq" className="mb-12">
        <h3 className="text-lg font-bold text-white mb-6">Perguntas Frequentes</h3>
        <div className="space-y-4">
          {faq.map((item, i) => (
            <details key={i} className="bg-background-secondary rounded-xl border border-white/5 group">
              <summary className="px-6 py-4 cursor-pointer text-white font-medium hover:text-primary-400 transition-colors list-none flex items-center justify-between">
                {item.q}
                <span className="text-text-muted group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="px-6 pb-4 text-text-muted text-sm">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AjudaPage;
