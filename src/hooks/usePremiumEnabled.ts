/**
 * O produto não opera mais assinatura premium no frontend público.
 * Mantemos o hook para compatibilidade, sempre retornando falso.
 */
export function usePremiumEnabled(): boolean {
  return false;
}
