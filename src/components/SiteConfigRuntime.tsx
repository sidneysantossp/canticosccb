import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteRuntimeConfig } from '@/lib/publicSiteConfig';
import { getLogoByType } from '@/lib/mockApis';

const styleTagId = 'site-runtime-theme-overrides';
const defaultThemeColor = '#10b981';

const SiteConfigRuntime = () => {
  const [verificationId, setVerificationId] = useState('');
  const [analyticsId, setAnalyticsId] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('/favicon.png');

  useEffect(() => {
    const existingStyle = document.getElementById(styleTagId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', defaultThemeColor);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVerification = async () => {
      const config = await getSiteRuntimeConfig();
      if (!cancelled) {
        setVerificationId(config.seo.google_search_console_id || '');
        setAnalyticsId(config.seo.google_analytics_id || '');
      }
    };

    void loadVerification();
    return () => {
      cancelled = true;
    };
  }, [setVerificationId]);

  useEffect(() => {
    if (!/^G-[A-Z0-9]+$/i.test(analyticsId)) return;
    const source = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
    if (!document.querySelector(`script[src="${source}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.src = source;
      document.head.appendChild(script);
    }
    const trackingWindow = window as typeof window & { dataLayer?: unknown[][] };
    trackingWindow.dataLayer = trackingWindow.dataLayer || [];
    trackingWindow.dataLayer.push(['js', new Date()], ['config', analyticsId]);
  }, [analyticsId]);

  useEffect(() => {
    let cancelled = false;

    const applyFavicon = (url: string) => {
      const resolvedUrl = url || '/favicon.png';
      // Remove os fallbacks estáticos para não prevalecerem sobre o favicon do painel.
      document.head.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach((link) => link.remove());
      const iconType = resolvedUrl.includes('.svg') ? 'image/svg+xml' : resolvedUrl.includes('.ico') ? 'image/x-icon' : 'image/png';
      [
        { rel: 'icon', sizes: 'any' },
        { rel: 'shortcut icon' },
        { rel: 'apple-touch-icon', sizes: '180x180' },
      ].forEach(({ rel, sizes }) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = resolvedUrl;
        link.type = iconType;
        if (sizes) link.sizes = sizes;
        document.head.appendChild(link);
      });

      setFaviconUrl(resolvedUrl);
    };

    const loadFavicon = async () => {
      try {
        const logo = await getLogoByType('favicon');
        if (!cancelled && logo?.url) {
          applyFavicon(logo.url);
          return;
        }

        const cached = sessionStorage.getItem('faviconLogoUrl') || localStorage.getItem('faviconLogoUrl');
        if (!cancelled && cached) {
          applyFavicon(cached);
        }
      } catch {
        applyFavicon('/favicon.png');
      }
    };

    void loadFavicon();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Helmet>
      {verificationId ? <meta name="google-site-verification" content={verificationId} /> : null}
      <link rel="icon" type={faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'} href={faviconUrl} />
      <link rel="shortcut icon" href={faviconUrl} />
      <link rel="apple-touch-icon" href={faviconUrl} />
    </Helmet>
  );
};

export default SiteConfigRuntime;
