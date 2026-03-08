import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteRuntimeConfig } from '@/lib/publicSiteConfig';

const styleTagId = 'site-runtime-theme-overrides';
const defaultThemeColor = '#10b981';

const SiteConfigRuntime = () => {
  const [verificationId, setVerificationId] = useState('');

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

  return verificationId ? (
    <Helmet>
      <meta name="google-site-verification" content={verificationId} />
    </Helmet>
  ) : null;
};

export default SiteConfigRuntime;
