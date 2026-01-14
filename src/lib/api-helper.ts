/**
 * DEPRECATED - Funções auxiliares de API
 * Agora usa Supabase diretamente
 */

// URL base não é mais necessária pois usamos Supabase
export function getApiUrl(endpoint: string): string {
  console.warn('[api-helper] getApiUrl está deprecated - use supabase-api.ts');
  return endpoint;
}

// Função de fetch genérica para compatibilidade
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  console.warn('[api-helper] apiFetch está deprecated - use supabase-api.ts');
  // Retorna uma resposta vazia para evitar erros
  return new Response(JSON.stringify({ error: 'API PHP removida, use Supabase' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default { getApiUrl, apiFetch };
