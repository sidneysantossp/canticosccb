import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, FileText, Music } from 'lucide-react';

interface MediaDropzoneProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  onRemove?: () => void;
  currentUrl?: string;
  previewUrl?: string;
  currentType?: 'image' | 'video' | 'audio';
  accept?: string;
  maxSize?: number; // em MB
  className?: string;
  disabled?: boolean;
  isUploading?: boolean;
  allowVideo?: boolean;
  multiple?: boolean;
}

const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  onFileSelect,
  onFilesSelect,
  onRemove,
  currentUrl,
  previewUrl,
  currentType,
  accept = "image/*,video/*",
  maxSize = 10,
  className = "",
  disabled = false,
  isUploading = false,
  allowVideo = true,
  multiple = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (multiple && files.length > 0 && onFilesSelect) {
      const valid = validateFiles(files);
      if (valid.length) onFilesSelect(valid);
      return;
    }
    const file = files[0];
    if (file) handleFileValidation(file);
  }, [disabled]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files ? Array.from(e.target.files) : [];
    if (multiple && fileList.length > 1 && onFilesSelect) {
      const valid = validateFiles(fileList);
      if (valid.length) onFilesSelect(valid);
      return;
    }
    const file = fileList[0];
    if (file) handleFileValidation(file);
  };

  const acceptAllows = (type: string) => {
    const acc = (accept || '').split(',').map(s => s.trim());
    // Allow wildcard groups like image/*, audio/*, video/*
    if (type.startsWith('image/') && acc.some(a => a === 'image/*' || a === '*/*')) return true;
    if (type.startsWith('video/') && acc.some(a => a === 'video/*' || a === '*/*')) return true;
    if (type.startsWith('audio/') && acc.some(a => a === 'audio/*' || a === '*/*')) return true;
    // Exact match
    return acc.includes(type);
  };

  const validateFiles = (files: File[]) => {
    const valid: File[] = [];
    for (const file of files) {
      if (!acceptAllows(file.type)) {
        continue;
      }
      if (!allowVideo && file.type.startsWith('video/')) {
        continue;
      }
      if (file.size > maxSize * 1024 * 1024) {
        continue;
      }
      valid.push(file);
    }
    if (valid.length < files.length) {
      alert('Alguns arquivos foram ignorados por tipo/tamanho inválido.');
    }
    return valid;
  };

  const handleFileValidation = (file: File) => {
    if (!acceptAllows(file.type)) {
      alert('Tipo de arquivo não permitido.');
      return;
    }
    if (!allowVideo && file.type.startsWith('video/')) {
      alert('Vídeos não são permitidos aqui');
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
      return;
    }
    onFileSelect(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const getFileIcon = (url: string, kind: 'image'|'video'|'audio') => {
    if (kind === 'video' || isVideoUrl(url)) return <Video className="w-6 h-6" />;
    if (kind === 'audio' || isAudioUrl(url)) return <Music className="w-6 h-6" />;
    return <Image className="w-6 h-6" />;
  };

  const isVideoUrl = (url: string) => /\.(mp4|webm|mov)$/i.test(url || '');
  const isAudioUrl = (url: string) => /\.(mp3|wav|flac|aac|m4a|ogg)$/i.test(url || '');
  const urlToShow = (previewUrl || currentUrl || '').trim();
  const kind: 'image'|'video'|'audio' = currentType
    ? currentType
    : (isVideoUrl(urlToShow) ? 'video' : (isAudioUrl(urlToShow) ? 'audio' : 'image'));

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preview atual */}
      {urlToShow && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-800">
          {kind === 'video' ? (
            <video
              src={urlToShow}
              className="w-full h-full object-cover"
              controls
              muted
            />
          ) : kind === 'audio' ? (
            <audio src={urlToShow} className="w-full h-full" controls />
          ) : (
            <img
              src={urlToShow}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 rounded-lg">
            {getFileIcon(urlToShow, kind)}
            <span className="text-white text-xs">
              {kind === 'video' ? 'Vídeo' : kind === 'audio' ? 'Áudio' : 'Imagem'}
            </span>
          </div>
        </div>
      )}

      {/* Zona de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragOver 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          multiple={multiple}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white font-medium">Enviando arquivo...</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-400">
                <Upload className="w-8 h-8" />
                <Image className="w-6 h-6" />
                {allowVideo && <Video className="w-6 h-6" />}
                {accept.includes('audio') && <Music className="w-6 h-6" />}
              </div>
              
              <div className="space-y-1">
                <p className="text-white font-medium">
                  {isDragOver 
                    ? 'Solte o arquivo aqui' 
                    : 'Arraste e solte ou clique para selecionar'
                  }
                </p>
                <p className="text-gray-400 text-sm">
                  {[
                    accept.includes('image') ? 'Imagens (JPG, PNG, WebP)' : null,
                    accept.includes('video') ? 'Vídeos (MP4, WebM, MOV)' : null,
                    accept.includes('audio') ? 'Áudios (MP3, WAV, FLAC, AAC, M4A, OGG)' : null,
                  ].filter(Boolean).join(' · ')} até {maxSize}MB {multiple ? '· múltiplos arquivos' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaDropzone;
