import { apiFetch } from '../api-helper';

export async function sendTestPush(payload: { title: string; message: string; url?: string; topic?: string }) {
  const res = await apiFetch('api/push/test.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Falha no envio de teste');
  }
  return res.json();
}

export async function sendCampaign(payload: { title: string; message: string; url?: string; link?: string; includeNewFollowers: boolean; includeMilestones: boolean; targetType?: 'all' | 'users' | 'user' | 'composers' | 'composer'; targetId?: number }) {
  // Enviar notificações in-app ao invés de push FCM
  console.log('[sendCampaign] Enviando para /api/notificacoes/send-campaign.php:', payload);
  
  const res = await apiFetch('api/notificacoes/send-campaign.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      message: payload.message,
      link: payload.url || payload.link || null,
      targetType: payload.targetType || 'all',
      targetId: payload.targetId
    })
  });
  
  console.log('[sendCampaign] Status:', res.status, 'OK:', res.ok);
  
  if (!res.ok) {
    const text = await res.text();
    console.error('[sendCampaign] Erro:', text);
    throw new Error(text || 'Falha no envio da campanha');
  }
  
  const data = await res.json();
  console.log('[sendCampaign] Resposta:', data);
  return data;
}
