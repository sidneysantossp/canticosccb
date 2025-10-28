import React from 'react';
import SEOHead from '@/components/SEO/SEOHead';

const TermsOfUsePage: React.FC = () => {
  const updatedAt = 'Outubro/2025';
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Termos de Uso"
        description="Termos de uso da plataforma Cânticos CCB, incluindo regras de publicação, responsabilidade por conteúdo de terceiros e procedimentos de notificação e retirada."
        canonical="/termos"
      />

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Termos de Uso</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: {updatedAt}</p>

      <div className="space-y-8 text-gray-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Aceitação</h2>
          <p>
            Ao acessar ou utilizar a plataforma Cânticos CCB, você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Caso não concorde, não utilize a plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Natureza do serviço</h2>
          <p>
            A plataforma facilita a descoberta, organização e audição de hinos, composições e interpretações publicadas pela comunidade. É um serviço independente, sem vínculo com a Congregação Cristã no Brasil.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Conteúdos de usuários</h2>
          <p>
            Você é o único responsável pelos conteúdos que publicar. Não publique materiais que infrinjam direitos autorais, marcários, de personalidade ou outros direitos de terceiros. Ao publicar, você declara que possui as autorizações necessárias e concede à plataforma licença não exclusiva, gratuita e mundial para exibição, hospedagem e distribuição técnica do conteúdo, enquanto mantido ativo por você.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Direitos autorais e marcas</h2>
          <p>
            A plataforma respeita a Lei de Direitos Autorais (Lei nº 9.610/1998) e a Lei da Propriedade Industrial (Lei nº 9.279/1996). Conteúdos denunciados por violação poderão ser removidos ou ocultados preventivamente. O uso nominativo/descritivo de termos relacionados à comunidade religiosa não implica associação institucional.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Notificação e retirada</h2>
          <p>
            Caso entenda que algum conteúdo viola seus direitos, envie notificação nos termos de nossa política de Notice and Takedown, indicada no <a className="text-primary-400 hover:underline" href="/disclaimer">Disclaimer Jurídico</a>. Poderemos solicitar comprovações e dados complementares. Confirmada a violação, removeremos o conteúdo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Limitação de responsabilidade</h2>
          <p>
            Nos termos do Marco Civil da Internet (Lei nº 12.965/2014), não somos responsáveis preventivamente por conteúdo de terceiros. Responderemos quando, após ordem judicial específica ou notificação válida, não adotarmos as providências cabíveis.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Encerramento e suspensão</h2>
          <p>
            Podemos suspender ou encerrar contas que violem estes Termos, a lei aplicável ou direitos de terceiros, a nosso critério, observada a proporcionalidade e devido processo interno.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Alterações</h2>
          <p>
            Poderemos atualizar estes Termos para refletir mudanças legais, regulatórias ou operacionais. Recomenda-se verificar periodicamente esta página.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
