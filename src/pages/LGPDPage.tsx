import React from 'react';
import SEOHead from '@/components/SEO/SEOHead';

const LGPDPage: React.FC = () => {
  const updatedAt = 'Outubro/2025';
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="LGPD - Proteção de Dados"
        description="Informações sobre o tratamento de dados pessoais na plataforma Cânticos CCB, em conformidade com a LGPD."
        canonical="/lgpd"
      />

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">LGPD - Proteção de Dados</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: {updatedAt}</p>

      <div className="space-y-8 text-gray-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Controlador</h2>
          <p>
            Esta página complementa nossa <a href="/privacidade" className="text-primary-400 hover:underline">Política de Privacidade</a> e esclarece como tratamos dados pessoais conforme a Lei nº 13.709/2018 (LGPD).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Bases legais</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Execução de contrato: prestação do serviço de streaming/organização de hinos.</li>
            <li>Legítimo interesse: melhoria contínua, segurança, prevenção a fraudes e estatísticas.</li>
            <li>Consentimento: quando necessário (ex.: comunicações de marketing).</li>
            <li>Cumprimento de obrigação legal e exercício regular de direitos quando aplicável.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Direitos do titular</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Confirmação de tratamento e acesso aos dados.</li>
            <li>Correção, anonimização, portabilidade e eliminação de dados, quando aplicável.</li>
            <li>Informação sobre compartilhamentos e revogação de consentimento.</li>
            <li>Oposição a tratamentos baseados em legítimo interesse, mediante fundamentação.</li>
          </ul>
          <p className="mt-2">
            Para exercer seus direitos, utilize <a href="/contato" className="text-primary-400 hover:underline">/contato</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Cookies e tecnologias similares</h2>
          <p>
            Utilizamos cookies essenciais ao funcionamento da plataforma e, quando aplicável, cookies analíticos e de performance para entender uso e melhorar a experiência. Você pode gerenciar preferências no navegador.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Compartilhamentos</h2>
          <p>
            Dados podem ser compartilhados com provedores de infraestrutura, armazenamento, analytics e envio de e-mails, sob contratos e medidas de segurança compatíveis com a LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Transferências internacionais</h2>
          <p>
            Quando houver transferência internacional, adotaremos salvaguardas adequadas, como cláusulas contratuais padrão ou mecanismos reconhecidos pela autoridade competente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Segurança da informação</h2>
          <p>
            Mantemos medidas técnicas e administrativas para proteger dados contra acessos não autorizados, incidentes e perdas, compatíveis com a natureza das operações e riscos envolvidos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Incidentes e comunicações</h2>
          <p>
            Em caso de incidente com risco relevante, avaliaremos a necessidade de notificar a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados, seguindo as diretrizes regulatórias.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Atualizações</h2>
          <p>
            Esta página poderá ser atualizada para refletir mudanças legais, regulatórias ou operacionais. Consulte-a periodicamente.
          </p>
        </section>
      </div>
    </div>
  );
};

export default LGPDPage;
