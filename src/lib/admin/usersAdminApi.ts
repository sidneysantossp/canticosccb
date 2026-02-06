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

// Mock data removed - using Supabase real data

export const getAllUsers = async (page: number = 1, limit: number = 20, filters: UsersFilters = {}): Promise<{ data: User[]; count: number; totalPages: number }> => {
  try {
    console.log('🔍 [getAllUsers] Fetching users with filters:', filters);
    const { supabaseFetch } = await import('@/lib/supabaseRest');
    
    const queryFilters: Record<string, string> = {
      select: '*',
      order: 'created_at.desc'
    };
    
    // Apply search filter
    if (filters.search) {
      queryFilters.or = `(name.ilike.%${filters.search}%,email.ilike.%${filters.search}%)`;
    }
    
    // Apply role filter
    if (filters.role && filters.role !== 'all') {
      if (filters.role === 'admin') {
        queryFilters.is_admin = 'eq.true';
      } else {
        queryFilters.is_admin = 'eq.false';
      }
    }
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'blocked') {
        queryFilters.is_blocked = 'eq.true';
      } else {
        queryFilters.is_blocked = 'eq.false';
      }
    }
    
    // Apply plan filter
    if (filters.plan && filters.plan !== 'all') {
      queryFilters.plan = `eq.${filters.plan}`;
    }
    
    // Fetch all matching users for count
    const allUsers = await supabaseFetch<any>('users', queryFilters);
    const totalCount = allUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Apply pagination
    queryFilters.limit = String(limit);
    queryFilters.offset = String((page - 1) * limit);
    
    const rows = await supabaseFetch<any>('users', queryFilters);
    
    // Map to User interface
    const users: User[] = rows.map(userData => ({
      id: String(userData.id),
      email: userData.email,
      name: userData.name || null,
      username: userData.name?.toLowerCase().replace(/\s+/g, '') || null,
      avatar_url: userData.avatar_url || null,
      plan: (userData.plan as any) || 'free',
      role: userData.is_admin ? 'admin' : 'user',
      status: userData.is_blocked ? 'banned' : (userData.status === 'inactive' ? 'inactive' : 'active'),
      is_admin: userData.is_admin === true,
      is_blocked: userData.is_blocked === true,
      email_verified: userData.email_verified || true,
      created_at: userData.created_at || new Date().toISOString(),
      last_login: null
    }));
    
    console.log(`✅ [getAllUsers] Found ${users.length} users (total: ${totalCount})`);
    
    return {
      data: users,
      count: totalCount,
      totalPages
    };
  } catch (error: any) {
    console.error('❌ [getAllUsers] Error:', error);
    return {
      data: [],
      count: 0,
      totalPages: 0
    };
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    console.log('🔍 [getUserById] Fetching user ID:', id);
    const { supabaseFetch } = await import('@/lib/supabaseRest');
    
    const rows = await supabaseFetch<any>('users', {
      id: `eq.${id}`,
      select: '*',
      limit: '1'
    });
    
    if (rows.length === 0) {
      console.warn('⚠️ [getUserById] User not found');
      return null;
    }
    
    const userData = rows[0];
    console.log('✅ [getUserById] User found:', userData);
    
    // Mapear dados do Supabase para interface User
    const user: User = {
      id: String(userData.id),
      email: userData.email,
      name: userData.name || null,
      username: userData.name?.toLowerCase().replace(/\s+/g, '') || null,
      avatar_url: userData.avatar_url || null,
      plan: (userData.plan as any) || 'free',
      role: userData.is_admin ? 'admin' : 'user',
      status: userData.is_blocked ? 'banned' : (userData.status === 'inactive' ? 'inactive' : 'active'),
      is_admin: userData.is_admin === true,
      is_blocked: userData.is_blocked === true,
      email_verified: userData.email_verified || true,
      created_at: userData.created_at || new Date().toISOString(),
      last_login: null
    };
    
    return user;
  } catch (error: any) {
    console.error('❌ [getUserById] Error:', error);
    return null;
  }
};

export const createUser = async (data: Partial<User> & { password?: string }): Promise<{ success: boolean; user?: User }> => {
  try {
    console.log('🔍 [createUser] Creating user with data:', data);
    
    // Criar registro diretamente na tabela users
    const { supabaseInsert } = await import('@/lib/supabaseRest');
    
    const userData = {
      name: data.name || '',
      email: data.email!,
      avatar_url: data.avatar_url || null,
      is_admin: data.is_admin || false,
      is_composer: false,
      is_blocked: data.is_blocked || false,
      status: data.is_blocked ? 'inactive' : 'active',
      plan: data.plan || 'free',
      email_verified: data.email_verified || false,
    };
    
    console.log('📦 [createUser] Inserting user data:', userData);
    
    const result = await supabaseInsert('users', userData) as any;
    console.log('✅ [createUser] User record created:', result);
    
    const newUser: User = {
      id: String(result.id || result[0]?.id || Date.now()),
      email: data.email!,
      name: data.name || null,
      username: data.username || null,
      avatar_url: data.avatar_url || null,
      plan: (data.plan as any) || 'free',
      role: data.is_admin ? 'admin' : 'user',
      status: data.is_blocked ? 'banned' : 'active',
      is_admin: data.is_admin || false,
      is_blocked: data.is_blocked || false,
      email_verified: data.email_verified || false,
      created_at: new Date().toISOString(),
      last_login: null
    };
    
    console.log('✅ [createUser] Success! User:', newUser);
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error('❌ [createUser] Error:', error);
    throw new Error(error.message || 'Erro ao criar usuário');
  }
};

export const updateUser = async (id: string, data: Partial<User>): Promise<{ success: boolean }> => {
  try {
    console.log('🔍 [updateUser] Updating user ID:', id, 'with data:', data);
    const { supabaseUpdate } = await import('@/lib/supabaseRest');
    
    // Mapear dados da interface User para campos do Supabase
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.is_admin !== undefined) updateData.is_admin = data.is_admin;
    if (data.is_blocked !== undefined) {
      updateData.is_blocked = data.is_blocked;
      updateData.status = data.is_blocked ? 'inactive' : 'active';
    }
    
    console.log('📦 [updateUser] Mapped update data:', updateData);
    
    await supabaseUpdate('users', { id: `eq.${id}` }, updateData);
    console.log('✅ [updateUser] User updated successfully');
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ [updateUser] Error:', error);
    return { success: false };
  }
};

export const deleteUser = async (id: string): Promise<{ success: boolean }> => {
  try {
    console.log('🔍 [deleteUser] Deleting user ID:', id);
    const { supabaseDelete } = await import('@/lib/supabaseRest');
    
    await supabaseDelete('users', { id: `eq.${id}` });
    console.log('✅ [deleteUser] User deleted successfully');
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ [deleteUser] Error:', error);
    return { success: false };
  }
};

export const toggleUserBlock = async (id: string): Promise<{ success: boolean }> => {
  try {
    const user = await getUserById(id);
    if (!user) return { success: false };
    
    return updateUser(id, { is_blocked: !user.is_blocked });
  } catch (error) {
    console.error('❌ [toggleUserBlock] Error:', error);
    return { success: false };
  }
};

export const blockUser = async (id: string): Promise<{ success: boolean }> => {
  return updateUser(id, { is_blocked: true });
};

export const unblockUser = async (id: string): Promise<{ success: boolean }> => {
  return updateUser(id, { is_blocked: false });
};

export const toggleUserAdmin = async (id: string): Promise<{ success: boolean }> => {
  try {
    const user = await getUserById(id);
    if (!user) return { success: false };
    
    return updateUser(id, { is_admin: !user.is_admin });
  } catch (error) {
    console.error('❌ [toggleUserAdmin] Error:', error);
    return { success: false };
  }
};

export const getUserStats = async (): Promise<{ total: number; active: number; blocked: number; admins: number; premium: number; emailVerified: number; newUsers: number }> => {
  try {
    const { supabaseFetch } = await import('@/lib/supabaseRest');
    const allUsers = await supabaseFetch<any>('users', { select: '*' });
    
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    return {
      total: allUsers.length,
      active: allUsers.filter((u: any) => !u.is_blocked && u.status !== 'inactive').length,
      blocked: allUsers.filter((u: any) => u.is_blocked === true).length,
      admins: allUsers.filter((u: any) => u.is_admin === true).length,
      premium: allUsers.filter((u: any) => u.plan === 'premium' || u.plan === 'pro').length,
      emailVerified: allUsers.filter((u: any) => u.email_verified).length,
      newUsers: allUsers.filter((u: any) => new Date(u.created_at).getTime() > thirtyDaysAgo).length
    };
  } catch (error) {
    console.error('❌ [getUserStats] Error:', error);
    return { total: 0, active: 0, blocked: 0, admins: 0, premium: 0, emailVerified: 0, newUsers: 0 };
  }
};

// Additional functions for AdminSettingsUsers
export const getUsers = async (filters: { search?: string; role?: string; status?: string; emailVerified?: string } = {}): Promise<{ users: User[] }> => {
  const result = await getAllUsers(1, 1000, {
    search: filters.search,
    role: filters.role as any,
    status: filters.status as any
  });
  return { users: result.data };
};

export const deleteUsers = async (ids: string[]): Promise<{ success: boolean }> => {
  try {
    const { supabaseDelete } = await import('@/lib/supabaseRest');
    
    for (const id of ids) {
      await supabaseDelete('users', { id: `eq.${id}` });
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ [deleteUsers] Error:', error);
    return { success: false };
  }
};

export const updateUsersStatus = async (ids: string[], status: 'active' | 'inactive' | 'banned'): Promise<{ success: boolean }> => {
  try {
    const { supabaseUpdate } = await import('@/lib/supabaseRest');
    
    for (const id of ids) {
      await supabaseUpdate('users', { id: `eq.${id}` }, {
        is_blocked: status === 'banned',
        status: status === 'banned' ? 'inactive' : 'active'
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ [updateUsersStatus] Error:', error);
    return { success: false };
  }
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
