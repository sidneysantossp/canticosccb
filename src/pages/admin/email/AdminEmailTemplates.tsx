import React, { useState } from 'react';
import { Mail, Edit, Eye, Copy } from 'lucide-react';

const AdminEmailTemplates: React.FC = () => {
  const templates = [
    { id: 1, name: 'Bem-vindo', subject: 'Bem-vindo ao Cânticos CCB!', type: 'welcome', lastUpdated: '2024-01-15' },
    { id: 2, name: 'Confirmação de Email', subject: 'Confirme seu email', type: 'confirmation', lastUpdated: '2024-01-10' },
    { id: 3, name: 'Reset de Senha', subject: 'Redefinir sua senha', type: 'password', lastUpdated: '2024-01-05' },
    { id: 4, name: 'Aprovação de Compositor', subject: 'Sua conta foi aprovada!', type: 'approval', lastUpdated: '2024-01-12' },
    { id: 5, name: 'Newsletter Mensal', subject: 'Novidades do mês', type: 'newsletter', lastUpdated: '2024-01-20' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Templates de Email</h1>
        <p className="text-gray-400">Gerencie os templates de email da plataforma</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{template.subject}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Tipo: {template.type}</span>
                    <span>•</span>
                    <span>Atualizado em: {template.lastUpdated}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-blue-400" />
                </button>
                <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                  <Copy className="w-4 h-4 text-green-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminEmailTemplates;
