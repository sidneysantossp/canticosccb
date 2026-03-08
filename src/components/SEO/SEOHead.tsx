import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteRuntimeConfig, type RuntimeSeoSettings } from '@/lib/publicSiteConfig';

interface SEOProps {
  title: string;
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
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const baseUrl = runtimeSeo?.site_url || import.meta.env.VITE_APP_URL || 'https://canticosccb.com.br';
  const cleanPath = window.location.pathname;
  const defaultUrl = `${baseUrl}${cleanPath}`;
  const canonicalUrl = canonical ? (canonical.startsWith('http') ? canonical : `${baseUrl}${canonical}`) : defaultUrl;
  const resolvedDescription = description || runtimeSeo?.site_description || '';
  const resolvedKeywords = keywords || runtimeSeo?.site_keywords || undefined;
  const resolvedImage = ogImage || runtimeSeo?.og_image || '/logo-canticos-ccb.png';
  const imageUrl = resolvedImage.startsWith('http') ? resolvedImage : `${baseUrl}${resolvedImage}`;
  const pageUrl = ogUrl ? (ogUrl.startsWith('http') ? ogUrl : `${baseUrl}${ogUrl}`) : canonicalUrl;
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
      <title>{fullTitle}</title>
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
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={resolvedTwitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={fullTitle} />
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
