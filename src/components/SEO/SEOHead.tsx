import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'music.song' | 'music.album' | 'music.playlist' | 'profile';
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'player';
  schemaData?: object;
  noindex?: boolean;
  nofollow?: boolean;
}

const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogType = 'website',
  ogImage = '/images/og-default.jpg',
  ogUrl,
  twitterCard = 'summary_large_image',
  schemaData,
  noindex = false,
  nofollow = false
}) => {
  const siteName = 'Cânticos CCB';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://canticosccb.com.br';
  const canonicalUrl = canonical || ogUrl || window.location.href;
  const imageUrl = ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`;
  const pageUrl = ogUrl || window.location.href;

  // Robots meta tag
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@canticosccb" />
      <meta name="twitter:creator" content="@canticosccb" />

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
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
