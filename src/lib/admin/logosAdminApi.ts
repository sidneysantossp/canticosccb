// Mock API for Logos Management
// Replace with real Supabase Storage API when backend is ready

export type LogoType = 'favicon' | 'primary' | 'secondary' | 'dark' | 'light' | 'icon' | 'watermark';

export interface Logo {
  id: string;
  type: LogoType;
  name: string;
  url: string;
  width: number;
  height: number;
  file_size?: number;
  updated_at: string;
}

// Mock logos data
const mockLogos: Logo[] = [
  {
    id: '1',
    type: 'favicon',
    name: 'Favicon',
    url: 'https://via.placeholder.com/64x64/dc2626/ffffff?text=CCB',
    width: 64,
    height: 64,
    file_size: 4096,
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    type: 'primary',
    name: 'Logo Principal (Claro)',
    url: 'https://canticosccb.com.br/logo-canticos-ccb.png',
    width: 300,
    height: 80,
    file_size: 15360,
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    type: 'dark',
    name: 'Logo Escuro',
    url: 'https://via.placeholder.com/300x80/1f2937/ffffff?text=Logo+Escuro',
    width: 300,
    height: 80,
    file_size: 12288,
    updated_at: new Date().toISOString()
  }
];

export const getAllLogos = async (): Promise<Logo[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockLogos];
};

export const updateLogo = async (logoType: LogoType, data: { url: string; width: number; height: number }): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Updating logo:', logoType, data);
  return { success: true };
};

export const uploadLogoImage = async (file: File, logoType: LogoType): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  // In production, this would upload to Supabase Storage
  return URL.createObjectURL(file);
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível carregar a imagem'));
    };
    
    img.src = objectUrl;
  });
};
