import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, AlertCircle, Eye, Lock, UserCheck } from 'lucide-react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="bg-background-secondary border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            to="/composer/onboarding"
            className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Termos e Condições</h1>
              <p className="text-text-muted">Última atualização: 05 de outubro de 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-invert max-w-none">
          
          {/* Introdução */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">1. Introdução</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <p className="text-text-muted leading-relaxed">
                Bem-vindo à plataforma Cânticos CCB. Estes Termos e Condições ("Termos") regem o uso 
                da nossa plataforma de distribuição e streaming de música religiosa. Ao se registrar 
                como compositor ou usuário, você concorda com estes termos integralmente.
              </p>
              <p className="text-text-muted leading-relaxed">
                Por favor, leia atentamente antes de continuar. Se você não concordar com qualquer 
                parte destes termos, não poderá utilizar nossos serviços.
              </p>
            </div>
          </section>

          {/* Uso da Plataforma */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">2. Uso da Plataforma</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-white">2.1 Elegibilidade</h3>
              <p className="text-text-muted leading-relaxed">
                Para utilizar nossa plataforma, você deve:
              </p>
              <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                <li>Ter no mínimo 18 anos de idade</li>
                <li>Fornecer informações verdadeiras e precisas durante o cadastro</li>
                <li>Manter suas credenciais de acesso seguras e confidenciais</li>
                <li>Ser responsável por todas as atividades realizadas em sua conta</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">2.2 Conta de Compositor</h3>
              <p className="text-text-muted leading-relaxed">
                Ao criar uma conta de compositor, você declara que:
              </p>
              <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                <li>É o detentor dos direitos autorais das obras enviadas</li>
                <li>Possui autorização legal para publicar o conteúdo</li>
                <li>O conteúdo não viola direitos de terceiros</li>
                <li>As informações de identificação fornecidas são autênticas</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">2.3 Conduta do Usuário</h3>
              <p className="text-text-muted leading-relaxed">
                Você concorda em NÃO:
              </p>
              <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                <li>Fazer upload de conteúdo ilegal, ofensivo ou inadequado</li>
                <li>Violar direitos autorais ou propriedade intelectual</li>
                <li>Utilizar a plataforma para atividades fraudulentas</li>
                <li>Tentar acessar áreas restritas do sistema</li>
                <li>Distribuir malware ou conteúdo malicioso</li>
              </ul>
            </div>
          </section>

          {/* Direitos Autorais */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">3. Direitos Autorais e Propriedade Intelectual</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold text-white">3.1 Conteúdo do Compositor</h3>
              <p className="text-text-muted leading-relaxed">
                Você mantém todos os direitos autorais sobre suas obras. Ao fazer upload, você nos 
                concede uma licença não exclusiva, mundial e livre de royalties para:
              </p>
              <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                <li>Hospedar, armazenar e distribuir seu conteúdo</li>
                <li>Transmitir suas obras via streaming</li>
                <li>Criar backups e cópias para segurança</li>
                <li>Promover suas obras na plataforma</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6">3.2 Propriedade da Plataforma</h3>
              <p className="text-text-muted leading-relaxed">
                Todo o conteúdo da plataforma (design, código, marca) é de nossa propriedade exclusiva 
                e protegido por leis de propriedade intelectual.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6">3.3 Remoção de Conteúdo</h3>
              <p className="text-text-muted leading-relaxed">
                Reservamo-nos o direito de remover qualquer conteúdo que viole estes termos ou direitos 
                de terceiros, sem aviso prévio.
              </p>
            </div>
          </section>

          {/* Privacidade */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">4. Privacidade e Dados Pessoais</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <p className="text-text-muted leading-relaxed">
                A coleta, uso e proteção de seus dados pessoais são regidos pela nossa Política de 
                Privacidade. Ao aceitar estes termos, você também concorda com:
              </p>
              <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                <li>A coleta de dados necessários para operação da plataforma</li>
                <li>O armazenamento seguro de suas informações</li>
                <li>O uso de cookies e tecnologias de rastreamento</li>
                <li>O compartilhamento limitado com parceiros quando necessário</li>
              </ul>
              <p className="text-text-muted leading-relaxed mt-4">
                Você tem direito de acessar, corrigir ou excluir seus dados pessoais conforme a 
                legislação aplicável (LGPD).
              </p>
            </div>
          </section>

          {/* Verificação de Identidade */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">5. Verificação de Identidade</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <p className="text-text-muted leading-relaxed">
                Para garantir a segurança e autenticidade dos compositores, solicitamos documentos 
                de identificação. Você concorda que:
              </p>
              <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                <li>Os documentos enviados são autênticos e válidos</li>
                <li>Autorizamos a verificação dos documentos</li>
                <li>Os documentos serão armazenados de forma segura e criptografada</li>
                <li>Podemos solicitar documentos adicionais se necessário</li>
              </ul>
            </div>
          </section>

          {/* Limitação de Responsabilidade */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">6. Limitação de Responsabilidade</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <p className="text-text-muted leading-relaxed">
                A plataforma é fornecida "como está". Não nos responsabilizamos por:
              </p>
              <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                <li>Interrupções temporárias do serviço</li>
                <li>Perda de dados não causada por nossa negligência</li>
                <li>Conteúdo publicado por terceiros</li>
                <li>Danos indiretos ou consequenciais</li>
                <li>Decisões comerciais baseadas em dados da plataforma</li>
              </ul>
            </div>
          </section>

          {/* Rescisão */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">7. Rescisão e Suspensão</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <p className="text-text-muted leading-relaxed">
                Podemos suspender ou encerrar sua conta se:
              </p>
              <ul className="list-disc list-inside text-text-muted space-y-2 ml-4">
                <li>Houver violação destes termos</li>
                <li>Detectarmos atividades fraudulentas</li>
                <li>For solicitado por autoridades competentes</li>
                <li>Você solicitar o encerramento</li>
              </ul>
              <p className="text-text-muted leading-relaxed mt-4">
                Você pode encerrar sua conta a qualquer momento através das configurações. Após o 
                encerramento, seus dados serão removidos conforme nossa política de retenção.
              </p>
            </div>
          </section>

          {/* Alterações */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">8. Alterações nos Termos</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <p className="text-text-muted leading-relaxed">
                Reservamos o direito de modificar estes termos a qualquer momento. Alterações 
                significativas serão notificadas por e-mail ou através da plataforma. O uso 
                continuado após alterações constitui aceitação dos novos termos.
              </p>
            </div>
          </section>

          {/* Lei Aplicável */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">9. Lei Aplicável</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <p className="text-text-muted leading-relaxed">
                Estes termos são regidos pelas leis da República Federativa do Brasil. Quaisquer 
                disputas serão resolvidas no foro da comarca de [Cidade], [Estado], Brasil.
              </p>
            </div>
          </section>

          {/* Contato */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white m-0">10. Contato</h2>
            </div>
            <div className="bg-background-secondary rounded-xl p-6 space-y-4">
              <p className="text-text-muted leading-relaxed">
                Para dúvidas sobre estes termos, entre em contato:
              </p>
              <ul className="list-none text-text-muted space-y-2">
                <li><strong className="text-white">Email:</strong> legal@canticosccb.com.br</li>
                <li><strong className="text-white">Telefone:</strong> (11) 0000-0000</li>
                <li><strong className="text-white">Endereço:</strong> [Endereço completo]</li>
              </ul>
            </div>
          </section>

        </div>

        {/* Footer da página */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-center text-text-muted">
            © 2024 Cânticos CCB. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
