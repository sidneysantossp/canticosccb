import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getSiteRuntimeConfig } from '@/lib/publicSiteConfig';
import type { ContentProtectionDirectory } from '@/lib/contentProtectionConfig';

interface ContentCopyProtectionProps {
  children: React.ReactNode;
  directory: ContentProtectionDirectory;
}

const BLOCKED_CLIPBOARD_KEYS = new Set(['c', 'x', 'v']);

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [data-copy-allowed="true"]'));
};

const ContentCopyProtection: React.FC<ContentCopyProtectionProps> = ({ children, directory }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [showNotice, setShowNotice] = useState(false);
  const noticeTimer = useRef<number | null>(null);

  const notifyBlockedAction = useCallback(() => {
    setShowNotice(true);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setShowNotice(false), 2200);
  }, []);

  const blockClipboardAction = useCallback((event: React.SyntheticEvent) => {
    if (!isEnabled) return;
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    window.getSelection()?.removeAllRanges();
    notifyBlockedAction();
  }, [isEnabled, notifyBlockedAction]);

  useEffect(() => {
    let cancelled = false;

    void getSiteRuntimeConfig(true).then((config) => {
      if (!cancelled) setIsEnabled(config.contentProtection[directory]);
    });

    return () => {
      cancelled = true;
    };
  }, [directory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEnabled) return;
      if (!(event.ctrlKey || event.metaKey) || isEditableTarget(event.target)) return;
      if (!BLOCKED_CLIPBOARD_KEYS.has(event.key.toLowerCase())) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.getSelection()?.removeAllRanges();
      notifyBlockedAction();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, [isEnabled, notifyBlockedAction]);

  if (!isEnabled) return <>{children}</>;

  return (
    <div
      className="protected-content"
      onContextMenu={blockClipboardAction}
      onCopy={blockClipboardAction}
      onCut={blockClipboardAction}
      onPaste={blockClipboardAction}
      onDragStart={blockClipboardAction}
    >
      {children}
      {showNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-20 z-[10000] -translate-x-1/2 rounded-full border border-primary-500/30 bg-[#101613]/95 px-4 py-2 text-center text-xs font-semibold text-primary-200 shadow-2xl backdrop-blur-md sm:text-sm"
        >
          Conteúdo protegido contra cópia.
        </div>
      ) : null}
    </div>
  );
};

export default ContentCopyProtection;
