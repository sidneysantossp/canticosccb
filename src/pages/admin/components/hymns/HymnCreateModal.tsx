/**
 * Modal de Cadastro de Hino - Integrado com API PHP e MySQL
 */

import React, { useState } from 'react';
import { X, Upload, FileAudio, Image as ImageIcon, Loader, CheckCircle } from 'lucide-react';
import { hinosAPI } from '@/lib/mysql';

interface HymnCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HymnCreateModal: React.FC<HymnCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    numero: '',
    titulo: '',
    compositor: '',
    categoria: '',
    letra: '',
    tags: '',
    ativo: true,
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ audio: 0, cover: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Por favor, selecione um arquivo de áudio válido');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('Arquivo de áudio muito grande. Máximo: 50 MB');
        return;
      }
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione uma imagem válida');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo: 10 MB');
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUploading(true);

    try {
      // 1. Validar campos obrigatórios
      if (!formData.titulo || !audioFile) {
        throw new Error('Título e arquivo de áudio são obrigatórios');
      }

      // 2. Upload de áudio
      console.log('📤 Fazendo upload de áudio...');
      const audioResult = await hinosAPI.uploadAudio(audioFile, (progress) => {
        setUploadProgress(prev => ({ ...prev, audio: progress }));
      });
      console.log('✅ Áudio enviado:', audioResult.url);

      // 3. Upload de capa (se houver)
      let coverUrl = null;
      if (coverFile) {
        console.log('📤 Fazendo upload de capa...');
        const coverResult = await hinosAPI.uploadCover(coverFile, (progress) => {
          setUploadProgress(prev => ({ ...prev, cover: progress }));
        });
        coverUrl = coverResult.url;
        console.log('✅ Capa enviada:', coverUrl);
      }

      // 4. Criar hino no banco de dados
      console.log('💾 Salvando hino no banco de dados...');
      const hinoData = {
        numero: formData.numero ? parseInt(formData.numero) : undefined,
        titulo: formData.titulo,
        compositor: formData.compositor || null,
        categoria: formData.categoria || null,
        audio_url: audioResult.url,
        cover_url: coverUrl,
        letra: formData.letra || null,
        tags: formData.tags || null,
        ativo: formData.ativo,
      };

      const createdHino = await hinosAPI.create(hinoData);
      console.log('✅ Hino cadastrado com sucesso:', createdHino);

      // 5. Mostrar sucesso
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Erro ao cadastrar hino:', err);
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar hino');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      numero: '',
      titulo: '',
      compositor: '',
      categoria: '',
      letra: '',
      tags: '',
      ativo: true,
    });
    setAudioFile(null);
    setCoverFile(null);
    setAudioPreview(null);
    setCoverPreview(null);
    setUploadProgress({ audio: 0, cover: 0 });
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-background-secondary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileAudio className="w-6 h-6 text-primary-500" />
            Cadastrar Novo Hino
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-text-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-400">Hino cadastrado com sucesso!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="m-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Número e Título */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Número
              </label>
              <input
                type="number"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="001"
                min="1"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Título *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nome do hino"
              />
            </div>
          </div>

          {/* Row 2: Compositor e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Compositor
              </label>
              <input
                type="text"
                name="compositor"
                value={formData.compositor}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nome do compositor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Categoria
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione uma categoria</option>
                <option value="Louvor">Louvor</option>
                <option value="Gratidão">Gratidão</option>
                <option value="Oração">Oração</option>
                <option value="Advento">Advento</option>
                <option value="Santa Ceia">Santa Ceia</option>
                <option value="Batismo">Batismo</option>
                <option value="Casamento">Casamento</option>
                <option value="Funeral">Funeral</option>
              </select>
            </div>
          </div>

          {/* Row 3: Upload de Áudio */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Arquivo de Áudio * (.mp3, .wav, .ogg)
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                className="hidden"
                id="audio-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="audio-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <FileAudio className="w-12 h-12 text-primary-500" />
                {audioFile ? (
                  <div>
                    <p className="text-white font-medium">{audioFile.name}</p>
                    <p className="text-text-muted text-sm">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {audioPreview && (
                      <audio controls src={audioPreview} className="mt-3 max-w-full" />
                    )}
                    {isUploading && uploadProgress.audio > 0 && (
                      <div className="mt-3">
                        <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${uploadProgress.audio}%` }}
                          />
                        </div>
                        <p className="text-sm text-text-muted mt-1">{Math.round(uploadProgress.audio)}%</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-white">Clique para selecionar áudio</p>
                    <p className="text-text-muted text-sm">Máximo: 50 MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Row 4: Upload de Capa */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Capa do Hino (opcional)
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
                id="cover-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="cover-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {coverPreview ? (
                  <div>
                    <img
                      src={coverPreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                    <p className="text-white font-medium mt-2">{coverFile?.name}</p>
                    <p className="text-text-muted text-sm">
                      {coverFile && (coverFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {isUploading && uploadProgress.cover > 0 && (
                      <div className="mt-3">
                        <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${uploadProgress.cover}%` }}
                          />
                        </div>
                        <p className="text-sm text-text-muted mt-1">{Math.round(uploadProgress.cover)}%</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-12 h-12 text-primary-500 mx-auto" />
                    <p className="text-white">Clique para selecionar imagem</p>
                    <p className="text-text-muted text-sm">Máximo: 10 MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Row 5: Letra */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Letra do Hino
            </label>
            <textarea
              name="letra"
              value={formData.letra}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Digite a letra completa do hino..."
            />
          </div>

          {/* Row 6: Tags */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-background-tertiary border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="louvor, adoração, gratidão"
            />
          </div>

          {/* Row 7: Ativo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="ativo"
              id="ativo"
              checked={formData.ativo}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-gray-700 bg-background-tertiary text-primary-500 focus:ring-2 focus:ring-primary-500"
            />
            <label htmlFor="ativo" className="text-sm text-text-secondary">
              Hino ativo (visível para usuários)
            </label>
          </div>

          {/* Footer: Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-6 py-2 bg-background-tertiary text-white rounded-lg hover:bg-background-hover transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || !formData.titulo || !audioFile}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Cadastrar Hino
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HymnCreateModal;
