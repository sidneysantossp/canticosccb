import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteRuntimeConfig } from '@/lib/publicSiteConfig';

const styleTagId = 'site-runtime-theme-overrides';
const defaultThemeColor = '#10b981';

const SiteConfigRuntime = () => {
  const [verificationId, setVerificationId] = useState('');
  const [analyticsId, setAnalyticsId] = useState('');
  const faviconUrl = '/favicon.png';

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
