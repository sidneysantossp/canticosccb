import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, User, Mail, Phone, MapPin, Calendar, Crown } from 'lucide-react';

const AdminUserForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    birthdate: '',
    address: '',
    city: '',
    state: '',
    country: 'Brasil',
    plan: 'free',
    status: 'active',
    emailVerified: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Salvando usuário:', formData);
    navigate('/admin/users');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Adicionar Novo Usuário</h1>
        <p className="text-gray-400">Preencha as informações do usuário</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Nome Completo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Data de Nascimento</label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Informações de Contato
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                required
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">Senha *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              required
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço
          </h2>
          
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Endereço Completo</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Cidade</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Estado</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">País</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Configurações da Conta</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Plano</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label className="text-white text-sm font-medium mb-2 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
              >
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
                <option value="banned">Banido</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.emailVerified}
              onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
              className="w-5 h-5"
            />
            <span className="text-white">Email verificado</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar Usuário
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserForm;
