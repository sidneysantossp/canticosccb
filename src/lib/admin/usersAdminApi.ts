// Mock implementation - Replace with real Supabase queries when backend is ready

export interface User {
  id: string;
  email: string;
  name: string | null;
  username?: string | null;
  avatar_url: string | null;
  plan: 'free' | 'premium' | 'pro';
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'inactive' | 'banned';
  is_admin: boolean;
  is_blocked: boolean;
  email_verified: boolean;
  created_at: string;
  last_login: string | null;
}

export interface UsersFilters {
  search?: string;
  role?: 'all' | 'admin' | 'user';
  status?: 'all' | 'active' | 'blocked';
  plan?: 'all' | 'free' | 'premium' | 'pro';
}

// Mock database
let mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@canticosccb.com.br',
    name: 'Administrador',
    username: 'admin',
    avatar_url: null,
    plan: 'pro',
    role: 'admin',
    status: 'active',
    is_admin: true,
    is_blocked: false,
    email_verified: true,
    created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date().toISOString()
  },
  {
    id: '2',
    email: 'usuario1@example.com',
    name: 'João Silva',
    username: 'joaosilva',
    avatar_url: null,
    plan: 'premium',
    role: 'user',
    status: 'active',
    is_admin: false,
    is_blocked: false,
    email_verified: true,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    email: 'usuario2@example.com',
    name: 'Maria Santos',
    username: 'mariasantos',
    avatar_url: null,
    plan: 'free',
    role: 'user',
    status: 'active',
    is_admin: false,
    is_blocked: false,
    email_verified: true,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    email: 'usuario3@example.com',
    name: 'Pedro Oliveira',
    username: 'pedrooliveira',
    avatar_url: null,
    plan: 'free',
    role: 'user',
    status: 'banned',
    is_admin: false,
    is_blocked: true,
    email_verified: true,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    email: 'usuario4@example.com',
    name: 'Ana Costa',
    username: 'anacosta',
    avatar_url: null,
    plan: 'premium',
    role: 'moderator',
    status: 'active',
    is_admin: false,
    is_blocked: false,
    email_verified: false,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '6',
    email: 'usuario5@example.com',
    name: 'Carlos Ferreira',
    username: 'carlosferreira',
    avatar_url: null,
    plan: 'free',
    role: 'user',
    status: 'active',
    is_admin: false,
    is_blocked: false,
    email_verified: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    last_login: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

export const getAllUsers = async (page: number = 1, limit: number = 20, filters: UsersFilters = {}): Promise<{ data: User[]; count: number; totalPages: number }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredUsers = [...mockUsers];
  
  // Apply search filter
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      u.email.toLowerCase().includes(search) ||
      u.name?.toLowerCase().includes(search)
    );
  }
  
  // Apply role filter
  if (filters.role && filters.role !== 'all') {
    if (filters.role === 'admin') {
      filteredUsers = filteredUsers.filter(u => u.is_admin);
    } else {
      filteredUsers = filteredUsers.filter(u => !u.is_admin);
    }
  }
  
  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'blocked') {
      filteredUsers = filteredUsers.filter(u => u.is_blocked);
    } else {
      filteredUsers = filteredUsers.filter(u => !u.is_blocked);
    }
  }
  
  // Apply plan filter
  if (filters.plan && filters.plan !== 'all') {
    filteredUsers = filteredUsers.filter(u => u.plan === filters.plan);
  }
  
  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / limit);
  const start = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(start, start + limit);
  
  return {
    data: paginatedUsers,
    count: totalCount,
    totalPages
  };
};

export const getUserById = async (id: string): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockUsers.find(u => u.id === id) || null;
};

export const createUser = async (data: Partial<User>): Promise<{ success: boolean; user?: User }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newUser: User = {
    id: String(Date.now()),
    email: data.email || '',
    name: data.name || null,
    username: data.username || null,
    avatar_url: data.avatar_url || null,
    plan: data.plan || 'free',
    role: data.role || 'user',
    status: data.status || 'active',
    is_admin: data.is_admin || false,
    is_blocked: false,
    email_verified: data.email_verified || false,
    created_at: new Date().toISOString(),
    last_login: null
  };
  mockUsers.push(newUser);
  return { success: true, user: newUser };
};

export const updateUser = async (id: string, data: Partial<User>): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    mockUsers[index] = {
      ...mockUsers[index],
      ...data
    };
    return { success: true };
  }
  return { success: false };
};

export const deleteUser = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    mockUsers.splice(index, 1);
    return { success: true };
  }
  return { success: false };
};

export const toggleUserBlock = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    mockUsers[index].is_blocked = !mockUsers[index].is_blocked;
    return { success: true };
  }
  return { success: false };
};

export const blockUser = async (id: string): Promise<{ success: boolean }> => {
  return updateUser(id, { is_blocked: true });
};

export const unblockUser = async (id: string): Promise<{ success: boolean }> => {
  return updateUser(id, { is_blocked: false });
};

export const toggleUserAdmin = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    mockUsers[index].is_admin = !mockUsers[index].is_admin;
    return { success: true };
  }
  return { success: false };
};

export const getUserStats = async (): Promise<{ total: number; active: number; blocked: number; admins: number; premium: number; emailVerified: number; newUsers: number }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return {
    total: mockUsers.length,
    active: mockUsers.filter(u => !u.is_blocked).length,
    blocked: mockUsers.filter(u => u.is_blocked).length,
    admins: mockUsers.filter(u => u.is_admin).length,
    premium: mockUsers.filter(u => u.plan === 'premium' || u.plan === 'pro').length,
    emailVerified: mockUsers.filter(u => u.email_verified).length,
    newUsers: mockUsers.filter(u => new Date(u.created_at).getTime() > thirtyDaysAgo).length
  };
};

// Additional functions for AdminSettingsUsers
export const getUsers = async (filters: { search?: string; role?: string; status?: string; emailVerified?: string } = {}): Promise<{ users: User[] }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  let filtered = [...mockUsers];
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(u => 
      u.email.toLowerCase().includes(search) ||
      u.name?.toLowerCase().includes(search)
    );
  }
  
  if (filters.role && filters.role !== 'all') {
    filtered = filtered.filter(u => u.role === filters.role);
  }
  
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(u => u.status === filters.status);
  }
  
  if (filters.emailVerified && filters.emailVerified !== 'all') {
    filtered = filtered.filter(u => u.email_verified === (filters.emailVerified === 'true'));
  }
  
  return { users: filtered };
};

export const deleteUsers = async (ids: string[]): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  mockUsers = mockUsers.filter(u => !ids.includes(u.id));
  return { success: true };
};

export const updateUsersStatus = async (ids: string[], status: 'active' | 'inactive' | 'banned'): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  ids.forEach(id => {
    const user = mockUsers.find(u => u.id === id);
    if (user) {
      user.status = status;
      user.is_blocked = status === 'banned';
    }
  });
  return { success: true };
};

export const sendVerificationEmail = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Sending verification email to user:', id);
  return { success: true };
};

export const resetUserPassword = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Resetting password for user:', id);
  return { success: true };
};
export const getSiteSettings = async (...args: any[]) => ({});
export const updateSiteSettings = async (...args: any[]) => ({ success: true });
export const getComments = async (...args: any[]) => [];
export const deleteComment = async (...args: any[]) => ({ success: true });
export const approveComment = async (...args: any[]) => ({ success: true });
export const getClaims = async (...args: any[]) => [];
export const getCopyrightClaims = async (...args: any[]) => [];
export const updateClaim = async (...args: any[]) => ({ success: true });
export const getRoyalties = async (...args: any[]) => [];
export const processPayment = async (...args: any[]) => ({ success: true });
export const getAllPlaylists = async (...args: any[]) => [];
export const createPlaylist = async (...args: any[]) => ({ success: true });
export const updatePlaylist = async (...args: any[]) => ({ success: true });
export const deletePlaylist = async (...args: any[]) => ({ success: true });
export type SiteSettings = any;
export type Comment = any;
export type Claim = any;
export type CopyrightClaim = any;
export type Royalty = any;
export type Playlist = any;
