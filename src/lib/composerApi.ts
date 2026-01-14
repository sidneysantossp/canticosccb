export interface Composer {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
  ativo?: number;
}

// Mock data for fallback
const mockComposers: Composer[] = [
  { id: '1', name: 'João de Deus', slug: 'joao-de-deus', bio: 'Compositor de cânticos da CCB' },
  { id: '2', name: 'Maria José', slug: 'maria-jose', bio: 'Compositora de hinos' },
  { id: '3', name: 'Carlos Silva', slug: 'carlos-silva', bio: 'Compositor de cânticos especiais' },
  { id: '4', name: 'Ana Santos', slug: 'ana-santos', bio: 'Compositora de louvores' },
  { id: '5', name: 'Pedro Costa', slug: 'pedro-costa', bio: 'Compositor de adoração' }
];

export const getAll = async (...args: any[]) => {
  console.warn('Using mock data for composers');
  return mockComposers;
};

export const getById = async (id: string | number) => {
  console.warn('Using mock data for composer by id');
  return mockComposers.find(c => c.id === String(id)) || null;
};

export const create = async (...args: any[]) => ({ success: true });
export const update = async (...args: any[]) => ({ success: true });
export const deleteItem = async (...args: any[]) => ({ success: true });
