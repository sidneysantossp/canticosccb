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
            <div className="mb-6">
              <Link to="/" className="flex flex-col items-start lg:flex-row lg:items-center gap-3">
                <img 
                  src="https://canticosccb.com.br/logo-canticos-ccb.png" 
                  alt="Cânticos CCB" 
                  className="w-[200px] h-auto rounded-lg"
                  onError={(e) => {
                    // Fallback para ícone SVG se a imagem não carregar
                    const target = e.currentTarget as HTMLImageElement;
                    const fallback = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-12 h-12 bg-primary-500 rounded-lg items-center justify-center hidden">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              </Link>
            </div>

            <div className="text-sm text-text-muted leading-relaxed">
              <p className="mb-2 italic">
                "Louvai ao SENHOR, todas as nações; louvai-o, todos os povos. 
                Porque a sua benignidade é grande."
              </p>
              <p className="text-xs text-primary-400 font-medium">
                Salmos 117
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
        </div>
      </div>
    </footer>
  );
};

export default Footer;
