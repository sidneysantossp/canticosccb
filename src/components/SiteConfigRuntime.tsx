import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteRuntimeConfig } from '@/lib/publicSiteConfig';

const styleTagId = 'site-runtime-theme-overrides';

const toRgb = (value: string, fallback: [number, number, number]) => {
  const normalized = value.trim();

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    let hex = normalized.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }
    const num = Number.parseInt(hex, 16);
    return [
      (num >> 16) & 255,
      (num >> 8) & 255,
      num & 255,
    ] as [number, number, number];
  }

  return fallback;
};

const rgba = (value: string, alpha: number, fallback: [number, number, number]) => {
  const [r, g, b] = toRgb(value, fallback);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const SiteConfigRuntime = () => {
  const [verificationId, setVerificationId] = useState('');

  useEffect(() => {
    let cancelled = false;

    const applyRuntimeTheme = async () => {
      try {
        const config = await getSiteRuntimeConfig();
        if (cancelled) return;

        const { theme } = config;
        const fallbackPrimary: [number, number, number] = [220, 38, 38];
        const fallbackSecondary: [number, number, number] = [30, 41, 59];
        const fallbackText: [number, number, number] = [241, 245, 249];

        const styleContent = `
          html, body, #root {
            background-color: ${theme.colors.background} !important;
            color: ${theme.colors.text} !important;
            font-family: ${theme.fontFamily}, system-ui, sans-serif !important;
            font-size: ${theme.fontSize} !important;
          }
          body {
            background-color: ${theme.colors.background} !important;
            color: ${theme.colors.text} !important;
          }
          .bg-primary-500 { background-color: ${theme.colors.primary} !important; }
          .bg-primary-600 { background-color: ${theme.colors.secondary} !important; }
          .bg-primary-700 { background-color: ${theme.colors.secondary} !important; }
          .text-primary-400 { color: ${theme.colors.accent} !important; }
          .text-primary-500 { color: ${theme.colors.primary} !important; }
          .text-primary-600 { color: ${theme.colors.secondary} !important; }
          .border-primary-500 { border-color: ${theme.colors.primary} !important; }
          .border-primary-600 { border-color: ${theme.colors.secondary} !important; }
          .focus\\:ring-primary-500:focus { --tw-ring-color: ${rgba(theme.colors.primary, 0.45, fallbackPrimary)} !important; }
          .hover\\:bg-primary-500:hover,
          .hover\\:bg-primary-600:hover,
          .hover\\:bg-primary-700:hover {
            background-color: ${theme.colors.secondary} !important;
          }
          .hover\\:text-primary-400:hover,
          .hover\\:text-primary-500:hover {
            color: ${theme.colors.accent} !important;
          }
          .bg-primary-500\\/10 { background-color: ${rgba(theme.colors.primary, 0.1, fallbackPrimary)} !important; }
          .bg-primary-500\\/20 { background-color: ${rgba(theme.colors.primary, 0.2, fallbackPrimary)} !important; }
          .bg-primary-600\\/10 { background-color: ${rgba(theme.colors.secondary, 0.1, fallbackSecondary)} !important; }
          .bg-primary-600\\/20 { background-color: ${rgba(theme.colors.secondary, 0.2, fallbackSecondary)} !important; }
          .bg-background-primary,
          .min-h-screen,
          [class*="min-h-screen"] {
            background-color: ${theme.colors.background} !important;
          }
          .bg-background-secondary { background-color: ${rgba(theme.colors.secondary, 0.55, fallbackSecondary)} !important; }
          .bg-background-tertiary { background-color: ${rgba(theme.colors.secondary, 0.75, fallbackSecondary)} !important; }
          .bg-background-hover { background-color: ${rgba(theme.colors.secondary, 0.9, fallbackSecondary)} !important; }
          .text-text-primary { color: ${theme.colors.text} !important; }
          .text-text-secondary { color: ${rgba(theme.colors.text, 0.8, fallbackText)} !important; }
          .text-text-muted { color: ${rgba(theme.colors.text, 0.62, fallbackText)} !important; }
          .border-gray-700,
          .border-gray-800,
          .border-gray-900 { border-color: ${theme.colors.border} !important; }
          .rounded-lg,
          .rounded-xl {
            border-radius: ${theme.borderRadius} !important;
          }
        `.trim();

        let styleEl = document.getElementById(styleTagId) as HTMLStyleElement | null;
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = styleTagId;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = styleContent;

        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (themeColor) {
          themeColor.setAttribute('content', theme.colors.primary);
        }
      } catch (error) {
        console.warn('[SiteConfigRuntime] Não foi possível aplicar o tema runtime.', error);
      }
    };

    void applyRuntimeTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVerification = async () => {
      const config = await getSiteRuntimeConfig();
      if (!cancelled) {
        setVerificationId(config.seo.google_search_console_id || '');
      }
    };

    void loadVerification();
    return () => {
      cancelled = true;
    };
  }, [setVerificationId]);

  return verificationId ? (
    <Helmet>
      <meta name="google-site-verification" content={verificationId} />
    </Helmet>
  ) : null;
};

export default SiteConfigRuntime;
