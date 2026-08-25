import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteRuntimeConfig, type RuntimeSeoSettings } from '@/lib/publicSiteConfig';
import { DEFAULT_SITE_URL, normalizeAssetUrl, normalizeSiteUrl } from '@/utils/siteUrl';

interface SEOProps {
  title: string;
  exactTitle?: boolean;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'music.song' | 'music.album' | 'music.playlist' | 'profile';
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'player';
  schemaData?: object | object[];
  noindex?: boolean;
  nofollow?: boolean;
}

const SEOHead: React.FC<SEOProps> = ({
  title,
  exactTitle = false,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage,
  ogUrl,
  twitterCard,
  schemaData,
  noindex = false,
  nofollow = false
}) => {
  const [runtimeSeo, setRuntimeSeo] = useState<RuntimeSeoSettings | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRuntimeSeo = async () => {
      try {
        const config = await getSiteRuntimeConfig();
        if (!cancelled) {
          setRuntimeSeo(config.seo);
        }
      } catch {
        // Keep hardcoded SEO defaults when runtime config is unavailable.
      }
    };

    void loadRuntimeSeo();

    return () => {
      cancelled = true;
    };
  }, []);

  const siteName = runtimeSeo?.site_title || 'Cânticos CCB';
  const fullTitle = exactTitle || title.includes(siteName) ? title : `${title} | ${siteName}`;
  const baseUrl = normalizeSiteUrl(
    runtimeSeo?.site_url || import.meta.env.VITE_APP_URL || DEFAULT_SITE_URL,
    DEFAULT_SITE_URL
  );
  const cleanPath = window.location.pathname;
  const isHomePage = canonical === '/' || cleanPath === '/';
  const resolvedTitle = isHomePage ? (runtimeSeo?.site_title || fullTitle) : fullTitle;
  const defaultUrl = normalizeSiteUrl(`${baseUrl}${cleanPath}`, baseUrl);
  const canonicalUrl = canonical
    ? normalizeSiteUrl(canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`, baseUrl)
    : defaultUrl;
  const resolvedDescription = isHomePage
    ? (runtimeSeo?.site_description || description || '')
    : (description || runtimeSeo?.site_description || '');
  const resolvedKeywords = isHomePage
    ? (runtimeSeo?.site_keywords || keywords || undefined)
    : (keywords || runtimeSeo?.site_keywords || undefined);
  const resolvedImage = isHomePage
    ? (runtimeSeo?.og_image || ogImage || '/logo-canticos-ccb.png')
    : (ogImage || runtimeSeo?.og_image || '/logo-canticos-ccb.png');
  const resolvedOgTitle = isHomePage
    ? (runtimeSeo?.og_title || resolvedTitle)
    : resolvedTitle;
  const resolvedOgDescription = isHomePage
    ? (runtimeSeo?.og_description || resolvedDescription)
    : resolvedDescription;
  const imageUrl = normalizeAssetUrl(
    resolvedImage.startsWith('http') ? resolvedImage : `${baseUrl}${resolvedImage}`
  );
  const pageUrl = ogUrl
    ? normalizeSiteUrl(ogUrl.startsWith('http') ? ogUrl : `${baseUrl}${ogUrl}`, baseUrl)
    : canonicalUrl;
  const resolvedTwitterCard = twitterCard || runtimeSeo?.twitter_card || 'summary_large_image';
  const robotsContent = [
    noindex || runtimeSeo?.robots_index === false ? 'noindex' : 'index',
    nofollow || runtimeSeo?.robots_follow === false ? 'nofollow' : 'follow'
  ].join(', ');

  const twitterSite = runtimeSeo?.twitter_site || '@canticosccb';
  const searchConsoleVerification = runtimeSeo?.google_search_console_id || '';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      {resolvedKeywords && <meta name="keywords" content={resolvedKeywords} />}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      {searchConsoleVerification && (
        <meta name="google-site-verification" content={searchConsoleVerification} />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="pt-BR" href={canonicalUrl} />
      <link rel="alternate" hrefLang="pt" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={resolvedTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={resolvedTwitterCard} />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={resolvedTitle} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterSite} />

      {/* Additional Meta Tags */}
      <meta name="author" content="Cânticos CCB" />
      <meta name="language" content="Portuguese" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Mobile Optimization */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* Schema.org JSON-LD */}
      {schemaData && (
        Array.isArray(schemaData)
          ? schemaData.map((schema, i) => (
              <script key={i} type="application/ld+json">
                {JSON.stringify(schema)}
              </script>
            ))
          : (
              <script type="application/ld+json">
                {JSON.stringify(schemaData)}
              </script>
            )
      )}
    </Helmet>
  );
};

export default SEOHead;
