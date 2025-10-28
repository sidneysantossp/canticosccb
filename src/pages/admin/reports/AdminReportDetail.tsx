import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag, User, Music, CheckCircle, XCircle, Ban, Trash2 } from 'lucide-react';

const AdminReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [action, setAction] = useState('');

  const report = {
    id: 1,
    type: 'song',
    targetTitle: 'Hino Impróprio',
    targetId: 123,
    reporterName: 'João Silva',
    reporterEmail: 'joao@email.com',
    reason: 'Conteúdo Impróprio',
    description: 'Este hino contém conteúdo que não é apropriado para a plataforma. A letra possui palavras ofensivas e não condiz com os valores da CCB.',
    status: 'open',
    priority: 'high',
    date: '2024-01-20 14:30',
    evidence: ['screenshot1.jpg', 'screenshot2.jpg'],
    targetAuthor: 'Compositor X',
    reportHistory: 2
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/reports')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white">Detalhes da Denúncia</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/50 border border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Flag className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{report.targetTitle}</h2>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                    Prioridade Alta
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Tipo: {report.type} • ID: {report.targetId}</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">Motivo da Denúncia</h3>
              <p className="text-red-400 font-medium mb-2">{report.reason}</p>
              <p className="text-gray-300 text-sm">{report.description}</p>
            </div>

            {report.evidence.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Evidências</h3>
                <div className="grid grid-cols-2 gap-3">
                  {report.evidence.map((file, index) => (
                    <div key={index} className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-sm">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Ações Disponíveis</h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="remove_content"
                    checked={action === 'remove_content'}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-white font-medium">Remover Conteúdo</p>
                    <p className="text-gray-400 text-sm">Remove o hino da plataforma</p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="warn_user"
                    checked={action === 'warn_user'}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-white font-medium">Advertir Usuário</p>
                    <p className="text-gray-400 text-sm">Envia advertência ao autor</p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="suspend"
                    checked={action === 'suspend'}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-white font-medium">Suspender Conta</p>
                    <p className="text-gray-400 text-sm">Suspende temporariamente a conta</p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="ban"
                    checked={action === 'ban'}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-white font-medium">Banir Permanentemente</p>
                    <p className="text-gray-400 text-sm">Remove definitivamente da plataforma</p>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value="dismiss"
                    checked={action === 'dismiss'}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-white font-medium">Arquivar (Denúncia Falsa)</p>
                    <p className="text-gray-400 text-sm">Marca como denúncia sem fundamento</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                disabled={!action}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg"
              >
                Aplicar Ação
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Denunciante</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Nome</p>
                <p className="text-white">{report.reporterName}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Email</p>
                <p className="text-white">{report.reporterEmail}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Data da Denúncia</p>
                <p className="text-white">{report.date}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Alvo da Denúncia</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Autor</p>
                <p className="text-white">{report.targetAuthor}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Denúncias Anteriores</p>
                <p className="text-white">{report.reportHistory}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-500 text-sm">
              ⚠️ Esta ação é irreversível. Certifique-se de revisar todas as informações antes de proceder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportDetail;
