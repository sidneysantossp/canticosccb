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

  const tryRecover = (reason: unknown): boolean => {
    if (!isChunkLoadFailure(reason)) {
      return false;
    }

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
  };

  releaseRecoveryLock();

  window.addEventListener('unhandledrejection', (event) => {
    if (tryRecover(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (tryRecover(event.error || event.message)) {
      event.preventDefault?.();
    }
  }, true);
}
