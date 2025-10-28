import React from 'react';
import SEOHead from '@/components/SEO/SEOHead';

const DisclaimerPage: React.FC = () => {
  const updatedAt = 'Outubro/2025';
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <SEOHead
        title="Disclaimer Jurídico"
        description="Esclarecimentos legais sobre a natureza independente da plataforma Cânticos CCB, diretrizes de direitos autorais e procedimentos de reivindicação de conteúdo."
        canonical="/disclaimer"
      />

      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Disclaimer Jurídico</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: {updatedAt}</p>

      <div className="space-y-8 text-gray-200 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Natureza independente da plataforma</h2>
          <p>
            A plataforma Cânticos CCB é um projeto independente e não possui qualquer vínculo, parceria, endosso, patrocínio ou relação institucional com a Congregação Cristã no Brasil (“CCB”).
            O uso das letras “CCB” no domínio e na denominação do projeto é de caráter referencial e descritivo, refletindo a forma como os membros da comunidade se referem a hinos e conteúdos relacionados à congregação.
            Não visamos nos passar por, substituir ou competir com quaisquer canais oficiais ou institucionais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Sobre marcas e sinais distintivos</h2>
          <p>
            Respeitamos direitos marcários e sinais distintivos nos termos da Lei da Propriedade Industrial (Lei nº 9.279/1996). O uso nominativo/descritivo de termos que identificam fenômenos, comunidades ou práticas religiosas não implica apropriação indevida de marca, tampouco confere associação institucional. Comprometemo-nos a atender prontamente comunicações formais que indiquem risco de confusão, concorrência desleal ou uso indevido, avaliando caso a caso para adequações proporcionais.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Conteúdos enviados pela comunidade</h2>
          <p>
            A maior parte do acervo é composta por conteúdos gerados pelos próprios usuários (UGC), tais como hinos autorais, interpretações e composições.
            Todo conteúdo deve respeitar a Lei de Direitos Autorais (Lei nº 9.610/1998) e demais normas aplicáveis.
            Adotamos um processo de verificação para perfis de compositores e medidas internas de moderação para reduzir violações.
            Quando aplicável, realizamos remoções proporcionais e diligentes, observando o Marco Civil da Internet (Lei nº 12.965/2014) e seu regime de responsabilização por conteúdo de terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Política de integridade e boa-fé</h2>
          <p>
            Não publicamos, promovemos ou incentivamos a divulgação de conteúdos que violem direitos autorais, conexos ou marcários de terceiros, incluindo da Congregação Cristã no Brasil. Nosso objetivo é facilitar a organização, descoberta e audição de hinos autorais e interpretações compartilhadas pela comunidade, sempre com respeito aos direitos de titulares e intérpretes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Procedimento de reivindicação de conteúdo</h2>
          <p className="mb-3">
            Caso você seja titular de direitos ou representante autorizado e entenda que determinado conteúdo viola direitos autorais, conexos, marcários ou de personalidade, disponibilizamos um fluxo de notificação e retirada ("notice and takedown"). Para isso, encaminhe uma solicitação contendo, preferencialmente:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li><strong>Identificação do conteúdo</strong> (URL(s) específica(s) e descrição suficiente);</li>
            <li><strong>Identificação do titular</strong> e comprovação de representação, quando aplicável;</li>
            <li><strong>Fundamentação</strong> (ex.: violação a direitos autorais – Lei 9.610/98 – indicando a obra e o direito atingido; violação marcária – Lei 9.279/96; ou outra base legal aplicável);</li>
            <li><strong>Declaração de boa-fé</strong> de que as informações são verdadeiras e de que você é o titular ou está autorizado a agir em seu nome;</li>
            <li><strong>Dados de contato</strong> para retorno (e-mail e telefone).</li>
          </ul>
          <p className="mt-3">
            Recebida a notificação válida, poderemos <strong>ocultar preventivamente</strong> o conteúdo enquanto avaliamos o mérito, solicitando complementos quando necessário. Caso confirmada a violação, procederemos à <strong>remoção</strong> ou outra medida adequada. Se houver controvérsia plausível apresentada pelo usuário remetente, poderemos restabelecer o conteúdo mediante justificativa, sem prejuízo de medidas judiciais pelas partes.
          </p>
          <p className="mt-3">
            Canais de contato para reivindicações: <a className="text-primary-400 hover:underline" href="/contato">/contato</a> ou e-mail indicado nessa página.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Boas práticas para compositores e intérpretes</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Publique apenas conteúdos dos quais você seja autor/titular ou tenha autorização válida.</li>
            <li>Utilize metadados claros: autor, intérprete, data e, quando aplicável, licença ou cessão.</li>
            <li>Atenda prontamente solicitações de comprovação de autoria e de ajuste/remoção.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Limitação de responsabilidade</h2>
          <p>
            Nos termos do Marco Civil da Internet e legislação correlata, não somos responsáveis preventivamente por conteúdos de terceiros. Respondemos quando, após ordem judicial específica ou notificação válida nos termos de nossa política, não tomarmos as medidas cabíveis. A plataforma é fornecida "no estado em que se encontra" e não garante disponibilidade ininterrupta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Atualizações</h2>
          <p>
            Este disclaimer pode ser atualizado para refletir mudanças legais, regulatórias ou operacionais relevantes. Recomendamos a verificação periódica desta página.
          </p>
        </section>
      </div>
    </div>
  );
};

export default DisclaimerPage;
