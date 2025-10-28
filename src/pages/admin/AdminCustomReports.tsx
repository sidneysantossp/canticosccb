import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, BarChart3, PieChart, TrendingUp, Users, Music, Play, Heart, Eye, AlertTriangle } from 'lucide-react';
import { 
  generateReportData, 
  exportToCSV, 
  exportToExcel, 
  exportToPDF,
  ReportData 
} from '@/lib/admin/customReportsApi';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'table' | 'chart' | 'summary';
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    category?: string;
    status?: string;
    userType?: string;
  };
  columns: string[];
  chartType?: 'line' | 'bar' | 'pie';
}

const AdminCustomReports: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [lastGeneratedReport, setLastGeneratedReport] = useState<ReportData | null>(null);

  useEffect(() => {
    // Simulate loading templates from API
    const timer = setTimeout(() => {
      try {
        // In production, load from API: const templates = await getReportTemplates();
        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar relatórios customizados');
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: '',
    name: '',
    description: '',
    type: 'table',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    filters: {},
    columns: [],
    chartType: 'bar'
  });

  const reportTemplates = [
    {
      id: 'songs-performance',
      name: 'Performance de Músicas',
      description: 'Relatório detalhado de plays, likes e compartilhamentos por música',
      icon: Music,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      id: 'user-engagement',
      name: 'Engajamento de Usuários',
      description: 'Análise de atividade e comportamento dos usuários',
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      id: 'content-analytics',
      name: 'Analytics de Conteúdo',
      description: 'Estatísticas de visualizações e interações por categoria',
      icon: BarChart3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      id: 'growth-metrics',
      name: 'Métricas de Crescimento',
      description: 'Acompanhamento de crescimento de usuários e conteúdo',
      icon: TrendingUp,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      id: 'playlist-stats',
      name: 'Estatísticas de Playlists',
      description: 'Análise de criação e uso de playlists pelos usuários',
      icon: Play,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20'
    },
    {
      id: 'favorites-analysis',
      name: 'Análise de Favoritos',
      description: 'Relatório de músicas mais favoritadas e tendências',
      icon: Heart,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20'
    }
  ];

  const availableColumns = {
    songs: ['Título', 'Compositor', 'Categoria', 'Plays', 'Likes', 'Data de Criação'],
    users: ['Nome', 'Email', 'Plano', 'Data de Cadastro', 'Último Acesso', 'Status'],
    playlists: ['Nome', 'Proprietário', 'Músicas', 'Seguidores', 'Visibilidade', 'Data de Criação'],
    analytics: ['Data', 'Plays', 'Usuários Únicos', 'Novas Contas', 'Tempo Médio']
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      setReportConfig({
        ...reportConfig,
        name: template.name,
        description: template.description,
        columns: availableColumns.songs // Default columns
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!reportConfig.name.trim()) {
      return;
    }

    if (!selectedTemplate) {
      return;
    }

    try {
      setIsGenerating(true);
      
      const config = {
        name: reportConfig.name,
        description: reportConfig.description,
        type: reportConfig.type,
        dateRange: reportConfig.dateRange,
        template: selectedTemplate,
        chartType: reportConfig.chartType
      };

      const reportData = await generateReportData(config);
      setLastGeneratedReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    if (!lastGeneratedReport) {
      return;
    }

    const filename = `${reportConfig.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    try {
      switch (format) {
        case 'csv':
          exportToCSV(lastGeneratedReport, filename);
          break;
        case 'excel':
          exportToExcel(lastGeneratedReport, filename);
          break;
        case 'pdf':
          exportToPDF(lastGeneratedReport, filename);
          break;
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando relatórios customizados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-200 mb-2">Erro ao carregar relatórios</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Relatórios Customizados</h1>
        <p className="text-gray-400">Crie relatórios personalizados com os dados que você precisa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates de Relatório
            </h3>

            <div className="space-y-3">
              {reportTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? 'border-primary-600 bg-primary-600/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${template.bgColor}`}>
                        <Icon className={`w-5 h-5 ${template.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{template.name}</h4>
                        <p className="text-gray-400 text-xs mt-1">{template.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Configuração do Relatório
            </h3>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome do Relatório *
                  </label>
                  <input
                    type="text"
                    value={reportConfig.name}
                    onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600"
                    placeholder="Ex: Relatório Mensal de Performance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={reportConfig.description}
                    onChange={(e) => setReportConfig({ ...reportConfig, description: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-600 h-20"
                    placeholder="Descreva o objetivo deste relatório..."
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Período de Dados
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Data Inicial</label>
                    <input
                      type="date"
                      value={reportConfig.dateRange.start}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        dateRange: { ...reportConfig.dateRange, start: e.target.value }
                      })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Data Final</label>
                    <input
                      type="date"
                      value={reportConfig.dateRange.end}
                      onChange={(e) => setReportConfig({
                        ...reportConfig,
                        dateRange: { ...reportConfig.dateRange, end: e.target.value }
                      })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-600"
                    />
                  </div>
                </div>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Tipo de Relatório
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setReportConfig({ ...reportConfig, type: 'table' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      reportConfig.type === 'table'
                        ? 'border-primary-600 bg-primary-600/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Tabela</p>
                  </button>
                  <button
                    onClick={() => setReportConfig({ ...reportConfig, type: 'chart' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      reportConfig.type === 'chart'
                        ? 'border-primary-600 bg-primary-600/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <BarChart3 className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Gráfico</p>
                  </button>
                  <button
                    onClick={() => setReportConfig({ ...reportConfig, type: 'summary' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      reportConfig.type === 'summary'
                        ? 'border-primary-600 bg-primary-600/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Eye className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">Resumo</p>
                  </button>
                </div>
              </div>

              {/* Chart Type (if chart selected) */}
              {reportConfig.type === 'chart' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Tipo de Gráfico
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setReportConfig({ ...reportConfig, chartType: 'bar' })}
                      className={`p-3 rounded-lg border transition-all ${
                        reportConfig.chartType === 'bar'
                          ? 'border-primary-600 bg-primary-600/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-white text-xs">Barras</p>
                    </button>
                    <button
                      onClick={() => setReportConfig({ ...reportConfig, chartType: 'line' })}
                      className={`p-3 rounded-lg border transition-all ${
                        reportConfig.chartType === 'line'
                          ? 'border-primary-600 bg-primary-600/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <TrendingUp className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-white text-xs">Linha</p>
                    </button>
                    <button
                      onClick={() => setReportConfig({ ...reportConfig, chartType: 'pie' })}
                      className={`p-3 rounded-lg border transition-all ${
                        reportConfig.chartType === 'pie'
                          ? 'border-primary-600 bg-primary-600/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <PieChart className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-white text-xs">Pizza</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-800">
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <BarChart3 className="w-5 h-5" />
                  Gerar Relatório
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    title="Exportar CSV"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    title="Exportar Excel"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    title="Exportar PDF"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {lastGeneratedReport && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-lg">Preview do Relatório</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                PDF
              </button>
            </div>
          </div>

          {/* Summary */}
          {lastGeneratedReport.summary && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total de registros:</span>
                  <span className="text-white ml-2 font-medium">{lastGeneratedReport.summary.totalRecords}</span>
                </div>
                <div>
                  <span className="text-gray-400">Período:</span>
                  <span className="text-white ml-2 font-medium">{lastGeneratedReport.summary.dateRange}</span>
                </div>
                <div>
                  <span className="text-gray-400">Gerado em:</span>
                  <span className="text-white ml-2 font-medium">{lastGeneratedReport.summary.generatedAt}</span>
                </div>
              </div>
            </div>
          )}

          {/* Table Preview */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {lastGeneratedReport.headers.map((header, index) => (
                    <th key={index} className="text-left py-2 px-3 text-gray-300 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lastGeneratedReport.rows.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-800 hover:bg-gray-800/30">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="py-2 px-3 text-gray-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {lastGeneratedReport.rows.length > 10 && (
              <p className="text-gray-400 text-center py-3 text-sm">
                Mostrando 10 de {lastGeneratedReport.rows.length} registros
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Relatórios Recentes</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Performance Semanal</h4>
              <span className="text-xs text-gray-400">Há 2 horas</span>
            </div>
            <p className="text-gray-400 text-sm mb-3">Relatório de plays e engajamento da última semana</p>
            <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
              Baixar →
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Usuários Ativos</h4>
              <span className="text-xs text-gray-400">Ontem</span>
            </div>
            <p className="text-gray-400 text-sm mb-3">Análise de atividade dos usuários no último mês</p>
            <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
              Baixar →
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Top Músicas</h4>
              <span className="text-xs text-gray-400">3 dias atrás</span>
            </div>
            <p className="text-gray-400 text-sm mb-3">Ranking das 50 músicas mais tocadas</p>
            <button className="text-primary-400 hover:text-primary-300 text-sm font-medium">
              Baixar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomReports;
