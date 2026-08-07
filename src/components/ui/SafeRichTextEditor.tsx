import React from 'react';
import '@/styles/safe-rich-text-editor.css';

interface SafeRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SafeRichTextEditor: React.FC<SafeRichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  style,
}) => (
  <div className={`safe-rich-text-editor ${className}`} style={style}>
    <div className="safe-rich-text-editor__toolbar">
      <span>Editor seguro</span>
      <span>HTML básico e quebras de linha são preservados</span>
    </div>
    <textarea
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      spellCheck
      className="safe-rich-text-editor__input"
    />
  </div>
);

export default SafeRichTextEditor;
