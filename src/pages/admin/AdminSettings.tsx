import React, { useState, useEffect } from 'react';
import { Save, Globe, Mail, Phone, Facebook, Instagram, Youtube, Twitter, FileText } from 'lucide-react';
import {
  getSiteSettings,
  updateSiteSettings,
  SiteSettings,
  UpdateSettingsData
} from '@/lib/admin/settingsAdminApi';
 

const AdminSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  const [formData, setFormData] = useState({
    site_name: '',
    site_description: '',
    contact_email: '',
    contact_phone: '',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    social_twitter: '',
    terms_of_use: '',
    privacy_policy: '',
    about_us: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await getSiteSettings();
      if (data) {
        setSettings(data);
        setFormData({
          site_name: data.site_name || '',
          site_description: data.site_description || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          social_facebook: data.social_facebook || '',
          social_instagram: data.social_instagram || '',
          social_youtube: data.social_youtube || '',
          social_twitter: data.social_twitter || '',
          terms_of_use: data.terms_of_use || '',
          privacy_policy: data.privacy_policy || '',
          about_us: data.about_us || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.site_name.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      const settingsData: UpdateSettingsData = {
        site_name: formData.site_name.trim(),
        site_description: formData.site_description.trim() || undefined,
        contact_email: formData.contact_email.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        social_facebook: formData.social_facebook.trim() || undefined,
        social_instagram: formData.social_instagram.trim() || undefined,
        social_youtube: formData.social_youtube.trim() || undefined,
        social_twitter: formData.social_twitter.trim() || undefined,
        terms_of_use: formData.terms_of_use.trim() || undefined,
        privacy_policy: formData.privacy_policy.trim() || undefined,
        about_us: formData.about_us.trim() || undefined
      };

      await updateSiteSettings(settingsData);
      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };
  // Removed page-level loading to render instantly

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configurações Gerais</h1>
        <p className="text-gray-400">Gerencie as configurações globais da plataforma</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site Info */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold text-white">Informações do Site</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Site *
              </label>
              <input
                type="text"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="Cânticos CCB"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição do Site
              </label>
              <textarea
                value={formData.site_description}
                onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                rows={3}
                placeholder="Plataforma de hinos da CCB..."
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold text-white">Informações de Contato</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email de Contato
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="contato@canticosccb.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone de Contato
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Facebook className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold text-white">Redes Sociais</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </div>
              </label>
              <input
                type="url"
                value={formData.social_facebook}
                onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </div>
              </label>
              <input
                type="url"
                value={formData.social_instagram}
                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </div>
              </label>
              <input
                type="url"
                value={formData.social_youtube}
                onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="https://youtube.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter
                </div>
              </label>
              <input
                type="url"
                value={formData.social_twitter}
                onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                placeholder="https://twitter.com/..."
              />
            </div>
          </div>
        </div>

        {/* Legal Info */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold text-white">Informações Legais</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sobre Nós
              </label>
              <textarea
                value={formData.about_us}
                onChange={(e) => setFormData({ ...formData, about_us: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                rows={4}
                placeholder="Informações sobre a plataforma..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Termos de Uso
              </label>
              <textarea
                value={formData.terms_of_use}
                onChange={(e) => setFormData({ ...formData, terms_of_use: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                rows={6}
                placeholder="Termos e condições de uso..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Política de Privacidade
              </label>
              <textarea
                value={formData.privacy_policy}
                onChange={(e) => setFormData({ ...formData, privacy_policy: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none"
                rows={6}
                placeholder="Política de privacidade e proteção de dados..."
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
