import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const CHUNK_LOAD_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /chunkloaderror/i,
  /loading chunk [\w-]+ failed/i,
  /error loading dynamically imported module/i,
];

const RECOVERY_KEY_PREFIX = 'chunk-reload-recovery:';
const RECOVERY_RELEASE_MS = 5000;

function getChunkRecoveryKey(pathname: string): string {
  return `${RECOVERY_KEY_PREFIX}${pathname}`;
}

function extractErrorMessage(reason: unknown): string {
  if (typeof reason === 'string') {
    return reason;
  }

  if (reason instanceof Error) {
    return `${reason.name}: ${reason.message}`;
  }

  if (reason && typeof reason === 'object') {
    const maybeMessage = 'message' in reason ? (reason as { message?: unknown }).message : null;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return '';
}

export function isChunkLoadFailure(reason: unknown): boolean {
  const message = extractErrorMessage(reason);
  return CHUNK_LOAD_PATTERNS.some((pattern) => pattern.test(message));
}

export function tryRecoverFromChunkLoadFailure(reason: unknown): boolean {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }

  if (!isChunkLoadFailure(reason)) {
    return false;
  }

  const pathKey = getChunkRecoveryKey(`${window.location.pathname}${window.location.search}`);

  try {
    if (sessionStorage.getItem(pathKey) === '1') {
      return false;
    }

    sessionStorage.setItem(pathKey, '1');
  } catch {
    return false;
  }

  window.location.reload();
  return true;
}

export function lazyWithChunkRecovery<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      if (tryRecoverFromChunkLoadFailure(error)) {
        return new Promise<never>(() => {});
      }

      throw error;
    }
  });
}

export function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return;
  }

  const pathKey = getChunkRecoveryKey(`${window.location.pathname}${window.location.search}`);

  const releaseRecoveryLock = () => {
    window.setTimeout(() => {
      try {
        sessionStorage.removeItem(pathKey);
      } catch {}
    }, RECOVERY_RELEASE_MS);
  };

  releaseRecoveryLock();

  window.addEventListener('unhandledrejection', (event) => {
    if (tryRecoverFromChunkLoadFailure(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (tryRecoverFromChunkLoadFailure(event.error || event.message)) {
      event.preventDefault?.();
    }
  }, true);
}
