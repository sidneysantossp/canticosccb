const AUTH_RETURN_TO_STORAGE_KEY = 'canticosccb:auth-return-to';

const AUTH_ROUTES = new Set([
  '/login',
  '/register',
  '/cadastro',
  '/auth/callback',
  '/forgot-password',
  '/reset-password',
]);

export function normalizeAuthReturnTo(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return null;

  try {
    const parsed = new URL(candidate, 'https://www.canticosccb.com.br');
    if (parsed.origin !== 'https://www.canticosccb.com.br') return null;
    if (AUTH_ROUTES.has(parsed.pathname.toLowerCase())) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function rememberAuthReturnTo(value: unknown): string | null {
  const destination = normalizeAuthReturnTo(value);
  if (typeof sessionStorage === 'undefined') return destination;

  if (destination) {
    sessionStorage.setItem(AUTH_RETURN_TO_STORAGE_KEY, destination);
  }

  return destination;
}

export function peekAuthReturnTo(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return normalizeAuthReturnTo(sessionStorage.getItem(AUTH_RETURN_TO_STORAGE_KEY));
}

export function consumeAuthReturnTo(): string | null {
  const destination = peekAuthReturnTo();
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(AUTH_RETURN_TO_STORAGE_KEY);
  }
  return destination;
}
