/**
 * Funções auxiliares de API - Compatibilidade
 * APIs PHP foram removidas, retorna dados vazios para fallback
 */

// URL base não é mais necessária
export function getApiUrl(endpoint: string): string {
  return endpoint;
}

// Função de fetch que retorna resposta vazia (Supabase é a fonte principal agora)
export async function apiFetch(_endpoint: string, _options?: RequestInit): Promise<Response> {
  // Retorna resposta OK com array/objeto vazio para não quebrar o código
  // O Supabase é a fonte principal de dados agora
  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default { getApiUrl, apiFetch };
