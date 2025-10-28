import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-background-primary border-t border-white/10 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Logo e Versículo */}
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-6 -ml-2">
              <Link to="/" className="inline-block">
                <img 
                  src="https://canticosccb.com.br/logo-canticos-ccb.png" 
                  alt="Cânticos CCB - Congregação Cristã no Brasil" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    // Fallback para logo local se o link externo falhar
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = '/logo-canticos-ccb.png';
                  }}
                />
              </Link>
            </div>

            <div className="text-sm text-text-muted leading-relaxed">
              <p className="mb-2 italic">
                ¹ "Louvai ao Senhor todas as nações, louvai-o                 todos os povos".
              </p>
              <p className="text-xs text-primary-400 font-medium">
                Salmos 117:1
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3 mt-4">
                <a href="#" aria-label="Instagram" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a href="#" aria-label="Facebook" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Facebook className="w-5 h-5 text-white" />
                </a>
                <a href="#" aria-label="YouTube" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Youtube className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Links - Hinos */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-4">Hinos</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/hinos-cantados" className="text-text-muted hover:text-white transition-colors text-sm">
                  Hinos Cantados
                </Link>
              </li>
              <li>
                <Link to="/hinos-tocados" className="text-text-muted hover:text-white transition-colors text-sm">
                  Hinos Tocados
                </Link>
              </li>
              <li>
                <Link to="/instrumentais" className="text-text-muted hover:text-white transition-colors text-sm">
                  Instrumentais
                </Link>
              </li>
              <li>
                <Link to="/compositores" className="text-text-muted hover:text-white transition-colors text-sm">
                  Compositores
                </Link>
              </li>
            </ul>
          </div>

          {/* Links - Conteúdo */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-4">Conteúdo</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/biblia-narrada" className="text-text-muted hover:text-white transition-colors text-sm">
                  Bíblia Narrada
                </Link>
              </li>
              <li>
                <Link to="/playlists" className="text-text-muted hover:text-white transition-colors text-sm">
                  Playlists
                </Link>
              </li>
              <li>
                <Link to="/radio" className="text-text-muted hover:text-white transition-colors text-sm">
                  Rádio CCB
                </Link>
              </li>
              <li>
                <Link to="/biblioteca" className="text-text-muted hover:text-white transition-colors text-sm">
                  Biblioteca
                </Link>
              </li>
            </ul>
          </div>

          {/* Links - Suporte */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-4">Suporte</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/compositor/cadastro" className="text-text-muted hover:text-white transition-colors text-sm">
                  Sou Compositor
                </Link>
              </li>
              <li>
                <Link to="/ajuda" className="text-text-muted hover:text-white transition-colors text-sm">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-text-muted hover:text-white transition-colors text-sm">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Links - Institucional */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-semibold mb-4">Institucional</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/disclaimer" className="text-text-muted hover:text-white transition-colors text-sm">
                  Disclaimer Jurídico
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-text-muted hover:text-white transition-colors text-sm">
                  Sobre
                </Link>
              </li>
              <li>
                <Link to="/termos" className="text-text-muted hover:text-white transition-colors text-sm">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-text-muted hover:text-white transition-colors text-sm">
                  Políticas de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-text-muted hover:text-white transition-colors text-sm">
                  Política de Cookies
                </Link>
              </li>
              <li>
                <Link to="/reivindicacao-de-conteudo" className="text-text-muted hover:text-white transition-colors text-sm">
                  Reivindicação de Conteúdo
                </Link>
              </li>
              <li>
                <Link to="/lgpd" className="text-text-muted hover:text-white transition-colors text-sm">
                  LGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha divisória e copyright */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-text-muted">
              © {new Date().getFullYear()} Cânticos CCB. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/ajuda" className="text-sm text-text-muted hover:text-white transition-colors">
                Central de Ajuda
              </Link>
              <Link to="/contato" className="text-sm text-text-muted hover:text-white transition-colors">
                Contato
              </Link>
            </div>
          </div>

          {/* Disclaimer curto */}
          <div className="mt-6 text-[13px] leading-relaxed text-text-muted">
            <p>
              O Cânticos CCB é uma plataforma independente, sem vínculo institucional com a Congregação Cristã no Brasil. Não publicamos conteúdos que violem direitos autorais ou marcários. Conteúdos são enviados pela comunidade e passam por verificação quando aplicável. Se você é titular de direitos, utilize os canais informados para solicitar avaliação e retirada.
              Leia o <Link to="/disclaimer" className="text-primary-400 hover:underline">Disclaimer Jurídico</Link>, os <Link to="/termos" className="text-primary-400 hover:underline">Termos de Uso</Link> e a <Link to="/privacidade" className="text-primary-400 hover:underline">Política de Privacidade</Link>.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
