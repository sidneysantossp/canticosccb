import React from 'react';
import SEOHead from '@/components/SEO/SEOHead';

const CookiesPolicyPage: React.FC = () => {
  const updatedAt = 'Outubro/2025';
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Política de Cookies"
        description="Informações sobre o uso de cookies e tecnologias similares na plataforma Cânticos CCB."
        canonical="/cookies"
      />

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Política de Cookies</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: {updatedAt}</p>

      <div className="space-y-8 text-gray-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. O que são cookies?</h2>
          <p>
            Cookies são pequenos arquivos armazenados no seu dispositivo que permitem funcionalidades essenciais, medições e personalização da experiência. Também utilizamos tecnologias similares (localStorage, pixels e SDKs) para finalidades análogas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Tipos de cookies que podemos utilizar</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li><strong>Essenciais</strong>: necessários para login, segurança e funcionamento do site.</li>
            <li><strong>Desempenho/Analytics</strong>: ajudam a entender o uso para melhorar a experiência.</li>
            <li><strong>Funcionais</strong>: lembram preferências, como idioma e temas.</li>
            <li><strong>Marketing</strong>: quando aplicável, para medir campanhas e recomendações.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Gerenciamento de cookies</h2>
          <p>
            Você pode controlar cookies pelo navegador, inclusive bloquear ou apagar. Alguns cookies são essenciais; bloqueá-los pode afetar funcionalidades. Quando aplicável, exibiremos um banner de consentimento com preferências configuráveis.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Mais informações</h2>
          <p>
            Para saber como tratamos dados pessoais, consulte a nossa <a href="/privacidade" className="text-primary-400 hover:underline">Política de Privacidade</a> e a página <a href="/lgpd" className="text-primary-400 hover:underline">LGPD</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CookiesPolicyPage;
