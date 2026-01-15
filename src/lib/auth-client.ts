/**
 * DEPRECATED - Este arquivo foi substituído por supabase-auth.ts
 * Mantido para compatibilidade com imports existentes
 */
export * from './supabase-auth';
export { default } from './supabase-auth';

// Funções de compatibilidade que faltavam
export async function checkEmailExists(email: string): Promise<boolean> {
  const { supabase } = await import('./supabase-auth');
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single();
  return !!data;
}

export async function changePassword(data: { email: string; senha_atual: string; senha_nova: string }): Promise<{ success: boolean; message: string }> {
  const { supabase } = await import('./supabase-auth');
  const { error } = await supabase.auth.updateUser({
    password: data.senha_nova
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { success: true, message: 'Senha alterada com sucesso' };
}
