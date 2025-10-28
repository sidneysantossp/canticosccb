import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { compositoresApi, uploadApi } from '@/lib/api-client';
import { DocumentReviewSection } from '@/components/DocumentReviewSection';
import { buildAvatarUrl } from '@/lib/media-helper';

const AdminComposerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    nome: '',
    nome_artistico: '',
    biografia: '',
    verificado: false,
    ativo: true
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [compositorEmail, setCompositorEmail] = useState('');
  const [gerenteInfo, setGerenteInfo] = useState<{
    tem_gerente: boolean;
    gerente_nome?: string;
    gerente_email?: string;
  }>({ tem_gerente: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      loadComposer();
    }
  }, [id]);

  const loadComposer = async () => {
    try {
      setIsLoadingData(true);
      setError('');
      const response = await compositoresApi.get(Number(id));
      if (response.data) {
        const compositor = response.data as any; // Type assertion para acessar email
        setFormData({
          nome: compositor.nome,
          nome_artistico: compositor.nome_artistico || '',
          biografia: compositor.biografia || '',
          verificado: !!compositor.verificado,
          ativo: !!compositor.ativo
        });
        if (compositor.avatar_url) setAvatarPreview(compositor.avatar_url);
        // Salvar email do compositor (pode vir do join com usuarios)
        if (compositor.email) {
          setCompositorEmail(compositor.email);
        }
        // Salvar informações do gerente
        console.log('👤 [Compositor] Dados do gerente:', {
          tem_gerente: compositor.tem_gerente,
          gerente_nome: compositor.gerente_nome,
          gerente_email: compositor.gerente_email
        });
        setGerenteInfo({
          tem_gerente: compositor.tem_gerente || false,
          gerente_nome: compositor.gerente_nome,
          gerente_email: compositor.gerente_email
        });
      } else {
        setError(response.error || 'Compositor não encontrado');
      }
    } catch (error: any) {
      console.error('Error loading composer:', error);
      setError(error?.message || 'Erro ao carregar compositor');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const response = await uploadApi.avatar(file);
      if (response.data) {
        return response.data.url;
      }
      console.error('Error uploading avatar:', response.error);
      return null;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.nome.trim()) throw new Error('Nome é obrigatório');

      let avatarUrl = avatarPreview;
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        if (uploaded) avatarUrl = uploaded;
      }

      const composerData = {
        nome: formData.nome.trim(),
        nome_artistico: formData.nome_artistico.trim() || undefined,
        biografia: formData.biografia.trim() || undefined,
        verificado: formData.verificado ? 1 : 0,
        ativo: formData.ativo ? 1 : 0,
        avatar_url: avatarUrl || undefined
      };

      let response;
      if (isEditMode && id) {
        response = await compositoresApi.update(Number(id), composerData);
      } else {
        response = await compositoresApi.create(composerData);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      navigate('/admin/composers');
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando compositor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/composers')} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white">
          {isEditMode ? 'Editar Compositor' : 'Novo Compositor'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Informações</h2>

          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">Nome Completo *</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">Nome Artístico</label>
            <input type="text" name="nome_artistico" value={formData.nome_artistico} onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">Biografia</label>
            <textarea name="biografia" value={formData.biografia} onChange={handleInputChange} rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none" />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-semibold mb-2">Avatar</label>
            <div className="flex items-center gap-4">
              {avatarPreview && (
                <img
                  src={
                    avatarPreview.startsWith('data:')
                      ? avatarPreview
                      : buildAvatarUrl({
                          id: String(id || ''),
                          avatar_url: avatarPreview,
                          name: formData.nome || formData.nome_artistico || 'Compositor'
                        })
                  }
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              <label className="flex-1 flex items-center justify-center gap-2 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 cursor-pointer hover:border-primary-500">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">{avatarFile ? avatarFile.name : 'Selecionar imagem'}</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="verificado" checked={formData.verificado} onChange={handleInputChange}
                className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-primary-500" />
              <span className="text-white font-semibold">Verificado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleInputChange}
                className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-primary-500" />
              <span className="text-white font-semibold">Ativo</span>
            </label>
          </div>
        </div>

        {/* Seção de Documentos para Verificação */}
        {isEditMode && id && (
          <DocumentReviewSection 
            compositorId={Number(id)}
            compositorEmail={compositorEmail}
            compositorName={formData.nome || formData.nome_artistico}
            hasManager={gerenteInfo.tem_gerente}
            managerName={gerenteInfo.gerente_nome}
            managerEmail={gerenteInfo.gerente_email}
            onApprovalChange={loadComposer}
          />
        )}

        <div className="flex gap-4">
          <button type="submit" disabled={isLoading}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            {isEditMode ? 'Salvar' : 'Criar'}
          </button>
          <button type="button" onClick={() => navigate('/admin/composers')}
            className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminComposerForm;
