import React, { useState } from 'react';
import { Palette, Eye } from 'lucide-react';

interface GradientColorPickerProps {
  value: string;
  onChange: (gradient: string) => void;
  className?: string;
}

interface GradientConfig {
  startColor: string;
  endColor: string;
  opacity: number;
  direction: 'to-br' | 'to-r' | 'to-b' | 'to-bl' | 'to-l' | 'to-t' | 'to-tr' | 'to-tl';
}

const GradientColorPicker: React.FC<GradientColorPickerProps> = ({
  value,
  onChange,
  className = ""
}) => {
  // Cores predefinidas populares
  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
    '#374151', '#111827', '#7c2d12', '#92400e', '#365314', '#14532d',
    '#164e63', '#1e3a8a', '#312e81', '#581c87', '#86198f', '#9f1239'
  ];

  // Direções de gradiente
  const directions = [
    { value: 'to-br', label: '↘️ Diagonal (padrão)', description: 'Superior esquerdo → Inferior direito' },
    { value: 'to-r', label: '→ Horizontal', description: 'Esquerda → Direita' },
    { value: 'to-b', label: '↓ Vertical', description: 'Superior → Inferior' },
    { value: 'to-bl', label: '↙️ Diagonal', description: 'Superior direito → Inferior esquerdo' },
    { value: 'to-l', label: '← Horizontal', description: 'Direita → Esquerda' },
    { value: 'to-t', label: '↑ Vertical', description: 'Inferior → Superior' },
    { value: 'to-tr', label: '↗️ Diagonal', description: 'Inferior esquerdo → Superior direito' },
    { value: 'to-tl', label: '↖️ Diagonal', description: 'Inferior direito → Superior esquerdo' }
  ];

  // Parse do valor atual ou valores padrão
  const parseGradient = (gradientString: string): GradientConfig => {
    // Exemplo: "from-blue-500/80 via-purple-600/70 to-pink-700/90"
    // Ou formato customizado: "from-[#ff0000]/80 to-[#0000ff]/60"
    
    const defaultConfig: GradientConfig = {
      startColor: '#3b82f6',
      endColor: '#8b5cf6',
      opacity: 80,
      direction: 'to-br'
    };

    if (!gradientString) return defaultConfig;

    try {
      // Extrair direção
      const directionMatch = gradientString.match(/(to-\w+)/);
      if (directionMatch) {
        defaultConfig.direction = directionMatch[1] as any;
      }

      // Extrair cores e opacidade
      const fromMatch = gradientString.match(/from-\[([#\w]+)\]\/(\d+)|from-(\w+)-(\d+)\/(\d+)/);
      const toMatch = gradientString.match(/to-\[([#\w]+)\]\/(\d+)|to-(\w+)-(\d+)\/(\d+)/);

      if (fromMatch) {
        defaultConfig.startColor = fromMatch[1] || `var(--${fromMatch[3]}-${fromMatch[4]})`;
        defaultConfig.opacity = parseInt(fromMatch[2] || fromMatch[5] || '80');
      }

      if (toMatch) {
        defaultConfig.endColor = toMatch[1] || `var(--${toMatch[3]}-${toMatch[4]})`;
      }

      return defaultConfig;
    } catch {
      return defaultConfig;
    }
  };

  const [config, setConfig] = useState<GradientConfig>(parseGradient(value));

  const updateGradient = (newConfig: Partial<GradientConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    
    // Gerar string do gradiente
    const gradientString = `bg-gradient-${updated.direction} from-[${updated.startColor}]/${updated.opacity} to-[${updated.endColor}]/${updated.opacity}`;
    onChange(gradientString);
  };

  const generatePreview = () => {
    return {
      background: `linear-gradient(${config.direction.replace('to-', '')}, ${config.startColor}${Math.round(config.opacity * 2.55).toString(16).padStart(2, '0')}, ${config.endColor}${Math.round(config.opacity * 2.55).toString(16).padStart(2, '0')})`
    };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Preview do Gradiente
        </label>
        <div 
          className="w-full h-20 rounded-lg border border-gray-600 relative overflow-hidden"
          style={generatePreview()}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/30 rounded px-3 py-1 flex items-center gap-2">
              <Eye className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direção do Gradiente */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Direção do Gradiente
        </label>
        <select
          value={config.direction}
          onChange={(e) => updateGradient({ direction: e.target.value as any })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-600"
        >
          {directions.map((dir) => (
            <option key={dir.value} value={dir.value}>
              {dir.label} - {dir.description}
            </option>
          ))}
        </select>
      </div>

      {/* Cores */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cor Inicial */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Cor Inicial
          </label>
          <div className="space-y-2">
            <input
              type="color"
              value={config.startColor}
              onChange={(e) => updateGradient({ startColor: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer"
            />
            <input
              type="text"
              value={config.startColor}
              onChange={(e) => updateGradient({ startColor: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-primary-600"
              placeholder="#ff0000"
            />
          </div>
        </div>

        {/* Cor Final */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Cor Final
          </label>
          <div className="space-y-2">
            <input
              type="color"
              value={config.endColor}
              onChange={(e) => updateGradient({ endColor: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer"
            />
            <input
              type="text"
              value={config.endColor}
              onChange={(e) => updateGradient({ endColor: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-primary-600"
              placeholder="#0000ff"
            />
          </div>
        </div>
      </div>

      {/* Transparência */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">
            Transparência: {config.opacity}%
          </label>
          <div 
            className="w-8 h-8 rounded border-2 border-gray-600"
            style={{
              background: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                           linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                           linear-gradient(45deg, transparent 75%, #ccc 75%), 
                           linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }}
          >
            <div 
              className="w-full h-full rounded"
              style={{
                background: `${config.startColor}${Math.round(config.opacity * 2.55).toString(16).padStart(2, '0')}`
              }}
            />
          </div>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={config.opacity}
            onChange={(e) => updateGradient({ opacity: parseInt(e.target.value) })}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{
              background: `linear-gradient(to right, 
                rgba(156, 163, 175, 0.3) 0%, 
                rgba(156, 163, 175, 1) 100%)`
            }}
          />
          <style dangerouslySetInnerHTML={{
            __html: `
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid #6366f1;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #ffffff;
                border: 2px solid #6366f1;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                border: none;
              }
              
              input[type="range"]::-webkit-slider-track {
                height: 12px;
                border-radius: 6px;
              }
              
              input[type="range"]::-moz-range-track {
                height: 12px;
                border-radius: 6px;
                background: transparent;
                border: none;
              }
            `
          }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Transparente</span>
          <span>Opaco</span>
        </div>
      </div>

      {/* Cores Predefinidas */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Cores Predefinidas
        </label>
        <div className="grid grid-cols-10 gap-1">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => updateGradient({ startColor: color })}
              onContextMenu={(e) => {
                e.preventDefault();
                updateGradient({ endColor: color });
              }}
              className="w-8 h-8 rounded border-2 border-gray-600 hover:border-white transition-colors"
              style={{ backgroundColor: color }}
              title={`Clique: cor inicial | Clique direito: cor final\n${color}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Clique esquerdo: definir como cor inicial | Clique direito: definir como cor final
        </p>
      </div>

      {/* Presets de Gradiente */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Gradientes Predefinidos
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: 'Azul → Roxo', start: '#3b82f6', end: '#8b5cf6' },
            { name: 'Verde → Azul', start: '#10b981', end: '#06b6d4' },
            { name: 'Rosa → Laranja', start: '#ec4899', end: '#f97316' },
            { name: 'Roxo → Rosa', start: '#8b5cf6', end: '#ec4899' },
            { name: 'Amarelo → Vermelho', start: '#eab308', end: '#ef4444' },
            { name: 'Escuro → Preto', start: '#374151', end: '#111827' }
          ].map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => updateGradient({ startColor: preset.start, endColor: preset.end })}
              className="h-12 rounded-lg border border-gray-600 hover:border-gray-400 transition-colors relative overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${preset.start}, ${preset.end})`
              }}
            >
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="text-white text-xs font-medium">{preset.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradientColorPicker;
