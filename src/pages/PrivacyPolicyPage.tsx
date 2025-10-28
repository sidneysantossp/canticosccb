import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEOHead from '@/components/SEO/SEOHead';

const PrivacyPolicyPage: React.FC = () => {
  const updatedAt = 'Outubro/2025';
  const navigate = useNavigate();
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Política de Privacidade"
        description="Como coletamos, usamos e protegemos seus dados na plataforma Cânticos CCB, em conformidade com a LGPD."
        canonical="/privacidade"
      />

      {/* Back to Settings */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-background-secondary rounded-full transition-colors"
          aria-label="Voltar para Configurações"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-white">Política de Privacidade</h1>
      </div>
      <p className="text-sm text-gray-400 mb-8">Última atualização: {updatedAt}</p>

      <div className="space-y-8 text-gray-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Controlador e contato</h2>
          <p>
            Esta política descreve como a plataforma Cânticos CCB trata dados pessoais nos termos da Lei Geral de Proteção de Dados – LGPD (Lei nº 13.709/2018). Para dúvidas, utilize a página <a href="/contato" className="text-primary-400 hover:underline">/contato</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Dados coletados</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Dados de cadastro (ex.: nome, e-mail) quando você cria uma conta.</li>
            <li>Dados de uso (ex.: páginas acessadas, buscas, preferências) para melhorar a experiência.</li>
            <li>Conteúdos e metadados enviados por você (ex.: hinos, capas, descrições).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Bases legais e finalidades</h2>
          <p>
            Tratamos dados com base em <strong>execução de contrato</strong> (prestação do serviço), <strong>legítimo interesse</strong> (melhoria, segurança e prevenção a fraudes) e <strong>consentimento</strong> quando aplicável (ex.: newsletters). O usuário pode revogar consentimento a qualquer tempo, sem afetar tratamentos legítimos anteriores.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Compartilhamento</h2>
          <p>
            Podemos compartilhar dados com provedores de infraestrutura, analytics e ferramentas operacionais estritamente necessárias à prestação do serviço, sob contratos e medidas de segurança compatíveis com a LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Segurança e retenção</h2>
          <p>
            Adotamos medidas técnicas e administrativas de segurança proporcionais aos riscos. Os dados são mantidos pelo tempo necessário ao cumprimento das finalidades, de obrigações legais/regulatórias ou até solicitação de exclusão, quando aplicável.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Direitos do titular</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Acesso, correção, portabilidade e exclusão de dados, nos termos da LGPD.</li>
            <li>Informação sobre compartilhamentos, revogação de consentimento e oposição a tratamentos.</li>
            <li>Para exercer direitos, utilize a página <a href="/contato" className="text-primary-400 hover:underline">/contato</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Conteúdos gerados por usuários</h2>
          <p>
            O material publicado por usuários pode conter dados pessoais de terceiros. O remetente é o responsável primário por obter autorizações e pelo cumprimento das leis aplicáveis. Atendemos solicitações de remoção fundamentadas, conforme nossos <a href="/termos" className="text-primary-400 hover:underline">Termos de Uso</a> e <a href="/disclaimer" className="text-primary-400 hover:underline">Disclaimer Jurídico</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Alterações</h2>
          <p>
            Esta política pode ser atualizada para refletir mudanças legais, regulatórias ou operacionais. A versão vigente será sempre publicada nesta página.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
