import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, FileText, AlertCircle } from 'lucide-react';

const IMPORT_TYPES = [
  { value: 'hymns', label: 'Hinos', icon: '🎵' },
  { value: 'albums', label: 'Álbuns', icon: '💿' },
  { value: 'playlists', label: 'Playlists', icon: '📋' },
  { value: 'composers', label: 'Compositores', icon: '👤' },
  { value: 'users', label: 'Usuários', icon: '👥' },
  { value: 'lyrics', label: 'Letras', icon: '📝' },
  { value: 'media', label: 'Mídias', icon: '🎬' }
];

const AdminImportForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    import_type: 'hymns',
    has_header: true,
    skip_duplicates: true,
    update_existing: false,
    validate_only: false
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Formato de arquivo inválido. Use CSV, Excel ou JSON.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    // Auto-preencher nome se estiver vazio
    if (!formData.name) {
      setFormData({ ...formData, name: file.name.replace(/\.[^/.]+$/, '') });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Selecione um arquivo para importar');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const importData = new FormData();
      importData.append('file', selectedFile);
      importData.append('name', formData.name.trim());
      importData.append('description', formData.description.trim());
      importData.append('import_type', formData.import_type);
      importData.append('has_header', formData.has_header.toString());
      importData.append('skip_duplicates', formData.skip_duplicates.toString());
      importData.append('update_existing', formData.update_existing.toString());
      importData.append('validate_only', formData.validate_only.toString());

      // TODO: Implementar upload quando backend estiver pronto
      // await uploadImport(importData);

      navigate('/admin/import');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      setError(error?.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin/import"
            className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Nova Importação
            </h1>
            <p className="text-gray-400 mt-1">Importe dados em massa a partir de arquivos</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload de Arquivo */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Arquivo de Importação
            </h2>
            
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-green-600 bg-green-500/10' : 'border-gray-700 hover:border-green-600'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {selectedFile ? (
                  <div>
                    <p className="text-green-400 font-medium mb-2">{selectedFile.name}</p>
                    <p className="text-gray-500 text-sm">{formatFileSize(selectedFile.size)}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="mt-3 text-red-400 hover:text-red-300 text-sm"
                    >
                      Remover arquivo
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 mb-2">
                      Arraste um arquivo ou clique para selecionar
                    </p>
                    <p className="text-gray-500 text-sm">
                      Formatos aceitos: CSV, Excel (.xlsx, .xls), JSON
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Tamanho máximo: 10MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Informações da Importação */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Informações da Importação</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                  placeholder="Nome da importação"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-green-600"
                  placeholder="Descrição opcional..."
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-semibold mb-2">
                  Tipo de Importação *
                </label>
                <select
                  value={formData.import_type}
                  onChange={(e) => setFormData({ ...formData, import_type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600"
                >
                  {IMPORT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Opções de Importação */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Opções de Importação</h2>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Arquivo tem cabeçalho</p>
                  <p className="text-gray-400 text-sm">Primeira linha contém nomes das colunas</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.has_header}
                  onChange={(e) => setFormData({ ...formData, has_header: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Ignorar duplicados</p>
                  <p className="text-gray-400 text-sm">Não importar registros que já existem</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.skip_duplicates}
                  onChange={(e) => setFormData({ ...formData, skip_duplicates: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Atualizar existentes</p>
                  <p className="text-gray-400 text-sm">Atualizar registros que já existem</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.update_existing}
                  onChange={(e) => setFormData({ ...formData, update_existing: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-white font-medium">Apenas validar</p>
                  <p className="text-gray-400 text-sm">Validar dados sem importar (modo teste)</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.validate_only}
                  onChange={(e) => setFormData({ ...formData, validate_only: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 sticky bottom-6 bg-gray-950/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <Link
              to="/admin/import"
              className="flex-1 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-center transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving || !selectedFile}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Iniciar Importação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminImportForm;
