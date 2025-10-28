// Utilitário temporário para salvar gradientes de banners no localStorage
// até que a coluna gradient_overlay seja adicionada na tabela

const GRADIENT_STORAGE_KEY = 'banner-gradients';

interface BannerGradient {
  bannerId: string;
  gradient: string;
  updatedAt: string;
}

export const saveBannerGradient = (bannerId: string, gradient: string) => {
  try {
    const stored = localStorage.getItem(GRADIENT_STORAGE_KEY);
    const gradients: BannerGradient[] = stored ? JSON.parse(stored) : [];
    
    // Remover gradiente existente para este banner
    const filtered = gradients.filter(g => g.bannerId !== bannerId);
    
    // Adicionar novo gradiente
    filtered.push({
      bannerId,
      gradient,
      updatedAt: new Date().toISOString()
    });
    
    localStorage.setItem(GRADIENT_STORAGE_KEY, JSON.stringify(filtered));
    console.log('✅ Gradiente salvo no localStorage:', { bannerId, gradient });
  } catch (error) {
    console.error('❌ Erro ao salvar gradiente:', error);
  }
};

export const getBannerGradient = (bannerId: string): string | null => {
  try {
    const stored = localStorage.getItem(GRADIENT_STORAGE_KEY);
    if (!stored) return null;
    
    const gradients: BannerGradient[] = JSON.parse(stored);
    const found = gradients.find(g => g.bannerId === bannerId);
    
    return found ? found.gradient : null;
  } catch (error) {
    console.error('❌ Erro ao ler gradiente:', error);
    return null;
  }
};

export const getAllBannerGradients = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(GRADIENT_STORAGE_KEY);
    if (!stored) return {};
    
    const gradients: BannerGradient[] = JSON.parse(stored);
    const result: Record<string, string> = {};
    
    gradients.forEach(g => {
      result[g.bannerId] = g.gradient;
    });
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao ler todos os gradientes:', error);
    return {};
  }
};

export const removeBannerGradient = (bannerId: string) => {
  try {
    const stored = localStorage.getItem(GRADIENT_STORAGE_KEY);
    if (!stored) return;
    
    const gradients: BannerGradient[] = JSON.parse(stored);
    const filtered = gradients.filter(g => g.bannerId !== bannerId);
    
    localStorage.setItem(GRADIENT_STORAGE_KEY, JSON.stringify(filtered));
    console.log('✅ Gradiente removido:', bannerId);
  } catch (error) {
    console.error('❌ Erro ao remover gradiente:', error);
  }
};
