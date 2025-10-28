import React, { useState, useEffect } from 'react';
import { Link, Check, X, AlertCircle } from 'lucide-react';
import { generateSlug, isValidSlug } from '@/lib/utils/slugUtils';

interface SlugInputProps {
  value: string;
  onChange: (slug: string) => void;
  baseTitle?: string;
  prefix?: string;
  label?: string;
  helpText?: string;
  onValidate?: (slug: string) => Promise<boolean>;
  required?: boolean;
}

const SlugInput: React.FC<SlugInputProps> = ({
  value,
  onChange,
  baseTitle = '',
  prefix = '/',
  label = 'URL Amigável (Slug)',
  helpText,
  onValidate,
  required = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');

  // Auto-gerar slug baseado no título
  useEffect(() => {
    if (baseTitle && !isEditing && !value) {
      const newSlug = generateSlug(baseTitle);
      onChange(newSlug);
    }
  }, [baseTitle, isEditing, value, onChange]);

  // Validar slug
  useEffect(() => {
    if (!value) {
      setError(required ? 'Slug é obrigatório' : '');
      setIsAvailable(null);
      return;
    }

    if (!isValidSlug(value)) {
      setError('Slug inválido. Use apenas letras minúsculas, números e hífens.');
      setIsAvailable(false);
      return;
    }

    setError('');

    // Verificar disponibilidade se função fornecida
    if (onValidate) {
      setIsChecking(true);
      const timeoutId = setTimeout(async () => {
        try {
          const available = await onValidate(value);
          setIsAvailable(available);
          if (!available) {
            setError('Este slug já está em uso');
          }
        } catch (err) {
          console.error('Error validating slug:', err);
        } finally {
          setIsChecking(false);
        }
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [value, required, onValidate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    const newSlug = generateSlug(e.target.value);
    onChange(newSlug);
  };

  const fullUrl = `https://canticosccb.com.br${prefix}${value}`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="space-y-2">
        {/* Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden focus-within:border-primary-600 transition-colors">
            <span className="px-3 py-2 text-gray-500 bg-gray-900 border-r border-gray-700 text-sm">
              {prefix}
            </span>
            <input
              type="text"
              value={value}
              onChange={handleChange}
              className="flex-1 px-3 py-2 bg-gray-800 text-white focus:outline-none"
              placeholder="meu-slug-aqui"
              required={required}
            />
          </div>

          {/* Status Icons */}
          <div className="flex items-center gap-1">
            {isChecking && (
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            )}
            {!isChecking && isAvailable === true && (
              <Check className="w-5 h-5 text-green-400" />
            )}
            {!isChecking && isAvailable === false && (
              <X className="w-5 h-5 text-red-400" />
            )}
            {!isChecking && error && !isAvailable && (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {/* Preview */}
        <div className="flex items-start gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <Link className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">URL Final:</p>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 hover:text-primary-300 break-all"
            >
              {fullUrl}
            </a>
          </div>
        </div>

        {/* Help Text */}
        {helpText && (
          <p className="text-gray-500 text-xs">{helpText}</p>
        )}

        {/* Tips */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-400 text-xs">
            <strong>Dicas:</strong> Use slugs descritivos e curtos. Evite palavras genéricas como "página", "item", etc.
            O slug será usado na URL e afeta o SEO do conteúdo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlugInput;
