import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, Megaphone, Layout, Image as ImageIcon } from 'lucide-react';
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerActive,
  uploadBannerImage,
  BannerType,
  Banner,
  CreateBannerData
} from '@/lib/admin/bannersAdminApi';
import BannersStatsCards from '@/pages/admin/components/banners/BannersStatsCards';
import BannerListItem from '@/pages/admin/components/banners/BannerListItem';
import BannerEditModal from '@/pages/admin/components/banners/BannerEditModal';

const AdminBanners: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BannerType>('hero');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<CreateBannerData>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    type: 'hero',
    position: 1,
    is_active: true,
    gradient_overlay: 'bg-gradient-to-br from-[#3b82f6]/80 to-[#8b5cf6]/80'
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewType, setPreviewType] = useState<'image' | 'video' | 'audio'>('image');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setIsLoading(true);
      const data = await getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        description: banner.description || '',
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        type: banner.type,
        position: banner.position,
        is_active: banner.is_active,
        gradient_overlay: banner.gradient_overlay || 'bg-gradient-to-br from-[#3b82f6]/80 to-[#8b5cf6]/80'
      });
      // Prepara preview a partir da URL existente
      const url = banner.image_url || '';
      setPreviewUrl(url);
      const lower = url.toLowerCase();
      if (/(\.mp4|\.webm|\.mov)$/.test(lower)) setPreviewType('video');
      else if (/(\.mp3|\.wav|\.flac|\.aac|\.m4a|\.ogg)$/.test(lower)) setPreviewType('audio');
      else setPreviewType('image');
    } else {
      setEditingBanner(null);
      const nextPosition = banners.filter(b => b.type === activeTab).length + 1;
      setFormData({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        type: activeTab,
        position: nextPosition,
        is_active: true,
        gradient_overlay: 'bg-gradient-to-br from-[#3b82f6]/80 to-[#8b5cf6]/80'
      });
      setPreviewUrl('');
      setPreviewType('image');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      type: 'hero',
      position: 1,
      is_active: true
    });
    if (previewUrl && previewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }
    setPreviewUrl('');
    setPreviewType('image');
  };

  const handleMediaUpload = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return;
    }

    const maxSize = isVideo ? 50 : 10; // 50MB para vídeo, 10MB para imagem
    if (file.size > maxSize * 1024 * 1024) {
      return;
    }

    try {
      setIsUploading(true);
      // Atualiza preview imediatamente com URL local
      if (previewUrl && previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(previewUrl); } catch {}
      }
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setPreviewType(isVideo ? 'video' : (isImage ? 'image' : 'audio'));

      const mediaUrl = await uploadBannerImage(file);
      setFormData({ ...formData, image_url: mediaUrl });
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }
    setPreviewUrl('');
    setPreviewType('image');
    setFormData({ ...formData, image_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image_url) {
      return;
    }

    try {
      setIsSaving(true);
      
      // Agora podemos enviar o gradient_overlay diretamente para o banco
      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
      } else {
        await createBanner(formData);
      }
      await loadBanners();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving banner:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleBannerActive(id, !currentStatus);
      await loadBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Deletar "${title}"?`)) return;

    try {
      await deleteBanner(id);
      await loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const filteredBanners = banners.filter(b => b.type === activeTab);

  const tabs = [
    { id: 'hero' as BannerType, label: 'Hero/Carousel', icon: Layers, description: 'Banners principais da home (rotativo, full-width)' },
    { id: 'promotional' as BannerType, label: 'Promocionais', icon: Megaphone, description: 'Banners de call-to-action e campanhas' },
    { id: 'contextual' as BannerType, label: 'Contextuais', icon: Layout, description: 'Banners de seções e páginas específicas' }
  ];

  // Removed page-level loading to render instantly

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Banners</h1>
          <p className="text-gray-400">Gerencie todos os banners da plataforma</p>
        </div>
        <Link
          to="/admin/banners/criar"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Banner
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-1">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = banners.filter(b => b.type === tab.id).length;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-white/20' : 'bg-gray-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          <strong>{tabs.find(t => t.id === activeTab)?.label}:</strong> {tabs.find(t => t.id === activeTab)?.description}
        </p>
      </div>

      {/* Stats */}
      <BannersStatsCards
        total={filteredBanners.length}
        active={filteredBanners.filter(b => b.is_active).length}
        inactive={filteredBanners.filter(b => !b.is_active).length}
      />

      {/* Banners List */}
      <div className="space-y-4">
        {filteredBanners
          .sort((a, b) => a.position - b.position)
          .map((banner) => (
            <BannerListItem
              key={banner.id}
              banner={banner}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
        ))}
      </div>

      {/* Empty State */}
      {filteredBanners.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">Nenhum banner nesta categoria</p>
          <p className="text-gray-500 text-sm mb-4">
            Crie seu primeiro banner do tipo "{tabs.find(t => t.id === activeTab)?.label}"
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Criar Banner
          </button>
        </div>
      )}

      {/* Modal CRUD */}
      <BannerEditModal
        show={isModalOpen}
        editingBanner={editingBanner}
        formData={formData}
        setFormData={setFormData}
        isSaving={isSaving}
        isUploading={isUploading}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onMediaUpload={handleMediaUpload}
        previewUrl={previewUrl}
        previewType={previewType}
        onRemoveMedia={handleRemoveMedia}
      />
    </div>
  );
};

export default AdminBanners;
