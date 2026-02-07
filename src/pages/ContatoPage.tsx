import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';

const ContatoPage: React.FC = () => {
  const [formData, setFormData] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    // Simula envio - integrar com API real
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEnviando(false);
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <SEOHead title="Contato - Cânticos CCB" description="Entre em contato com a equipe Cânticos CCB." />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">Mensagem enviada!</h2>
          <p className="text-text-muted max-w-md mb-6">
            Recebemos sua mensagem e responderemos o mais breve possível.
          </p>
          <Link
            to="/"
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <SEOHead
        title="Contato - Cânticos CCB"
        description="Entre em contato com a equipe Cânticos CCB para suporte, dúvidas ou sugestões."
      />

      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Contato</h1>
      </div>

      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Fale Conosco</h2>
        <p className="text-text-muted">Envie sua mensagem e responderemos o mais breve possível.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-4 py-2.5 bg-background-secondary border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2.5 bg-background-secondary border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="seu@email.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Assunto</label>
          <input
            type="text"
            required
            value={formData.assunto}
            onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
            className="w-full px-4 py-2.5 bg-background-secondary border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="Assunto da mensagem"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Mensagem</label>
          <textarea
            required
            rows={6}
            value={formData.mensagem}
            onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
            className="w-full px-4 py-2.5 bg-background-secondary border border-white/10 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary-500 transition-colors resize-none"
            placeholder="Escreva sua mensagem..."
          />
        </div>
        <div className="text-center pt-2">
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-semibold transition-colors"
          >
            <Send className="w-4 h-4" />
            {enviando ? 'Enviando...' : 'Enviar Mensagem'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContatoPage;
