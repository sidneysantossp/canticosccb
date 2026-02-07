import { supabase } from '@/lib/supabase-auth';
import { registerPlay as registerPlaySupabase } from '@/lib/supabaseApi';

/**
 * Registrar play usando Supabase (substitui endpoint PHP).
 * Aceita id do hino como string/UUID e usuário opcional.
 */
export async function registerPlay(hinoId: string | number, usuarioId?: string | number, durationSeconds?: number) {
  try {
    const resolvedHinoId = String(hinoId);

    // Obter usuário autenticado, se não foi passado
    let userId: string | undefined = usuarioId ? String(usuarioId) : undefined;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        userId = user.id;
      }
    }

    const ok = await registerPlaySupabase({
      hymn_id: resolvedHinoId,
      user_id: userId,
      duration_seconds: durationSeconds,
      completed: true,
    });

    return ok;
  } catch (e) {
    console.warn('registerPlay error', e);
    return false;
  }
}
