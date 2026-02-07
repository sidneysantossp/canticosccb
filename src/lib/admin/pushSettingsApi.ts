import { supabaseRPC, isSupabaseConfigured } from '../supabaseRest';

export async function sendTestPush(payload: { title: string; message: string; url?: string; topic?: string }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  try {
    return await supabaseRPC('send_test_push', payload);
  } catch (error: any) {
    throw new Error(error.message || 'Falha no envio de teste');
  }
}

export async function sendCampaign(payload: { title: string; message: string; url?: string; link?: string; includeNewFollowers: boolean; includeMilestones: boolean; targetType?: 'all' | 'users' | 'user' | 'composers' | 'composer'; targetId?: number }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  console.log('[sendCampaign] Enviando campanha via Supabase:', payload);
  
  try {
    const data = await supabaseRPC('send_notification_campaign', {
      p_title: payload.title,
      p_message: payload.message,
      p_link: payload.url || payload.link || null,
      p_target_type: payload.targetType || 'all',
      p_target_id: payload.targetId
    });
    
    console.log('[sendCampaign] Resposta:', data);
    return data;
  } catch (error: any) {
    console.error('[sendCampaign] Erro:', error);
    throw new Error(error.message || 'Falha no envio da campanha');
  }
}
