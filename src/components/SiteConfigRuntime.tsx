import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteRuntimeConfig } from '@/lib/publicSiteConfig';
import { getLogoByType } from '@/lib/mockApis';

const styleTagId = 'site-runtime-theme-overrides';
const defaultThemeColor = '#10b981';

const SiteConfigRuntime = () => {
  const [verificationId, setVerificationId] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('/icons/favicon.svg');

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
      }
    };

    void loadVerification();
    return () => {
      cancelled = true;
    };
  }, [setVerificationId]);

  useEffect(() => {
    let cancelled = false;

    const applyFavicon = (url: string) => {
      const resolvedUrl = url || '/icons/favicon.svg';
      const selectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
      ];

      selectors.forEach((selector) => {
        let link = document.head.querySelector<HTMLLinkElement>(selector);
        if (!link) {
          link = document.createElement('link');
          if (selector.includes('apple-touch-icon')) {
            link.rel = 'apple-touch-icon';
          } else if (selector.includes('shortcut icon')) {
            link.rel = 'shortcut icon';
          } else {
            link.rel = 'icon';
          }
          document.head.appendChild(link);
        }

        link.href = resolvedUrl;
        if (selector === 'link[rel="icon"]') {
          link.type = resolvedUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
        }
      });

      setFaviconUrl(resolvedUrl);
    };

    const loadFavicon = async () => {
      try {
        const cached = sessionStorage.getItem('faviconLogoUrl') || localStorage.getItem('faviconLogoUrl');
        if (cached) {
          applyFavicon(cached);
          return;
        }

        const logo = await getLogoByType('favicon');
        if (!cancelled && logo?.url) {
          applyFavicon(logo.url);
        }
      } catch {
        applyFavicon('/icons/favicon.svg');
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
