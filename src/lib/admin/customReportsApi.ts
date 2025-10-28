// Mock API for Custom Reports
// Replace with real implementation when backend is ready

export interface ReportData {
  title: string;
  type: 'table' | 'chart' | 'summary';
  dateRange: {
    start: string;
    end: string;
  };
  data: any[];
  summary?: {
    total: number;
    average: number;
    growth: number;
  };
}

export const generateReportData = async (config: any): Promise<ReportData> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock data generation based on template
  const mockData = {
    title: config.name || 'Relatório Customizado',
    type: config.type || 'table',
    dateRange: config.dateRange,
    data: [
      { id: 1, name: 'Hino 1', plays: 4520, downloads: 890, favorites: 1230 },
      { id: 2, name: 'Hino 5', plays: 3890, downloads: 750, favorites: 980 },
      { id: 3, name: 'Hino 10', plays: 3450, downloads: 680, favorites: 850 },
      { id: 4, name: 'Hino 15', plays: 3120, downloads: 620, favorites: 780 },
      { id: 5, name: 'Hino 20', plays: 2890, downloads: 580, favorites: 720 }
    ],
    summary: {
      total: 17870,
      average: 3574,
      growth: 12.5
    }
  };
  
  return mockData;
};

export const exportToCSV = (data: ReportData, filename: string = 'report.csv'): void => {
  const headers = Object.keys(data.data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: ReportData, filename: string = 'report.xlsx'): void => {
  // Mock Excel export (in production, use a library like xlsx)
  console.log('Exporting to Excel:', filename, data);
  alert('Exportação para Excel não implementada. Use CSV por enquanto.');
};

export const exportToPDF = (data: ReportData, filename: string = 'report.pdf'): void => {
  // Mock PDF export (in production, use a library like jsPDF)
  console.log('Exporting to PDF:', filename, data);
  alert('Exportação para PDF não implementada. Use CSV por enquanto.');
};

// Legacy exports for compatibility
export const getAllReports = async () => [];
export const getReportById = async (...args: any[]) => null;
export const createReport = async (...args: any[]) => ({ success: true });
export const updateReport = async (...args: any[]) => ({ success: true });
export const deleteReport = async (...args: any[]) => ({ success: true });
export const runReport = async (...args: any[]) => ({ data: [] });
export type CustomReport = any;
