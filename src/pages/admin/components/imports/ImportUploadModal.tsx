import React from 'react';
import { Upload } from 'lucide-react';

interface ImportTypeOption {
  value: string;
  label: string;
  icon: string;
}

interface FormDataShape {
  name: string;
  description: string;
  import_type: string;
  has_header: boolean;
  skip_duplicates: boolean;
  update_existing: boolean;
  validate_only: boolean;
}

interface Props {
  show: boolean;
  formData: FormDataShape;
  setFormData: (data: FormDataShape) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  onClose: () => void;
  onUpload: () => void;
  importTypes: ImportTypeOption[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImportUploadModal: React.FC<Props> = ({
  show,
  formData,
  setFormData,
  selectedFile,
  setSelectedFile,
  onClose,
  onUpload,
  importTypes,
  onFileChange,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-xl font-bold text-white">Nova Importação</h3>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Importação *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              placeholder="Digite um nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
              rows={2}
              placeholder="Descrição opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Dados *</label>
            <select
              value={formData.import_type}
              onChange={(e) => setFormData({ ...formData, import_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
            >
              {importTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Arquivo *</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border-2 border-dashed border-gray-700 hover:border-primary-600 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">{selectedFile ? selectedFile.name : 'Selecione um arquivo'}</span>
                <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={onFileChange} className="hidden" />
              </label>
            </div>
            <p className="text-gray-500 text-xs mt-2">Formatos aceitos: CSV, Excel (.xlsx, .xls), JSON</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.has_header}
                onChange={(e) => setFormData({ ...formData, has_header: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-300">Arquivo possui cabeçalho (primeira linha)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.skip_duplicates}
                onChange={(e) => setFormData({ ...formData, skip_duplicates: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-300">Pular registros duplicados</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.update_existing}
                onChange={(e) => setFormData({ ...formData, update_existing: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-300">Atualizar registros existentes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.validate_only}
                onChange={(e) => setFormData({ ...formData, validate_only: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-300">Apenas validar (não importar)</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              setSelectedFile(null);
            }}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onUpload}
            disabled={!selectedFile}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Iniciar Importação
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportUploadModal;
