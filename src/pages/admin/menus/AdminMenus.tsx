import React from 'react';
import { Menu, Plus, Edit, Trash2, GripVertical } from 'lucide-react';

const AdminMenus: React.FC = () => {
  const menuItems = [
    { id: 1, label: 'Home', path: '/', order: 1, visible: true },
    { id: 2, label: 'Biblioteca', path: '/library', order: 2, visible: true },
    { id: 3, label: 'Buscar', path: '/search', order: 3, visible: true },
    { id: 4, label: 'Premium', path: '/premium', order: 4, visible: true },
    { id: 5, label: 'Sobre', path: '/about', order: 5, visible: true }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Menus</h1>
          <p className="text-gray-400">Configure os menus da plataforma</p>
        </div>
        <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Item
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Menu Principal</h2>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <button className="cursor-move">
                <GripVertical className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex-1">
                <p className="text-white font-medium">{item.label}</p>
                <p className="text-gray-400 text-sm">{item.path}</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.visible}
                  className="w-4 h-4"
                />
                <span className="text-gray-400 text-sm">Visível</span>
              </label>

              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-700 rounded-lg">
                  <Edit className="w-4 h-4 text-blue-400" />
                </button>
                <button className="p-2 hover:bg-gray-700 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMenus;
