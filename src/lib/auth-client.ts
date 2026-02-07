/**
 * DEPRECATED - Este arquivo foi substituído por supabase-auth.ts
 * Mantido para compatibilidade com imports existentes
 */
export * from './supabase-auth';
export { default } from './supabase-auth';

import { supabase } from './supabase-auth';

// Funções de compatibilidade que faltavam
export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  return !!data && !error;
}

export async function changePassword(data: { email: string; senha_atual: string; senha_nova: string }): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase.auth.updateUser({
    password: data.senha_nova
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { success: true, message: 'Senha alterada com sucesso' };
}
