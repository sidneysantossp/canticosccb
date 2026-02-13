import { useEffect, useState } from 'react';
import { supabaseFetch } from '@/lib/supabaseRest';

interface AnalyticsConfig {
  analytics_enabled: boolean;
  google_analytics_id: string;
  google_tag_manager_id: string;
  facebook_pixel_id: string;
}

const SCRIPT_IDS = {
  gtag: 'ga-gtag-script',
  gtagInit: 'ga-gtag-init',
  gtmScript: 'gtm-script',
  gtmNoscript: 'gtm-noscript',
  fbPixel: 'fb-pixel-script',
};

function removeScript(id: string) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function cleanupAll() {
  Object.values(SCRIPT_IDS).forEach(removeScript);
}

function injectGoogleAnalytics(gaId: string) {
  if (!gaId || document.getElementById(SCRIPT_IDS.gtag)) return;

  // gtag.js loader
  const script = document.createElement('script');
  script.id = SCRIPT_IDS.gtag;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  // gtag init
  const initScript = document.createElement('script');
  initScript.id = SCRIPT_IDS.gtagInit;
  initScript.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(initScript);
}

function injectGTM(gtmId: string) {
  if (!gtmId || document.getElementById(SCRIPT_IDS.gtmScript)) return;

  // GTM script in head
  const script = document.createElement('script');
  script.id = SCRIPT_IDS.gtmScript;
  script.textContent = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `;
  document.head.appendChild(script);

  // GTM noscript iframe in body
  const noscript = document.createElement('noscript');
  noscript.id = SCRIPT_IDS.gtmNoscript;
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.insertBefore(noscript, document.body.firstChild);
}

function injectFacebookPixel(pixelId: string) {
  if (!pixelId || document.getElementById(SCRIPT_IDS.fbPixel)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_IDS.fbPixel;
  script.textContent = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}

const AnalyticsScripts: React.FC = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      // Timeout de segurança para não bloquear a página
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analytics config timeout')), 5000)
      );

      try {
        const rowsPromise = supabaseFetch<any>('site_config', {
          config_key: 'in.(analytics_enabled,google_analytics_id,google_tag_manager_id,facebook_pixel_id)',
          select: 'config_key,config_value',
        });

        const rows = await Promise.race([rowsPromise, timeoutPromise]) as any[];

        if (cancelled) return;

        const configMap: Record<string, string> = {};
        if (Array.isArray(rows)) {
          for (const row of rows) {
            configMap[row.config_key] = row.config_value;
          }
        }

        const config: AnalyticsConfig = {
          analytics_enabled: configMap.analytics_enabled === 'true',
          google_analytics_id: configMap.google_analytics_id || '',
          google_tag_manager_id: configMap.google_tag_manager_id || '',
          facebook_pixel_id: configMap.facebook_pixel_id || '',
        };

        if (!config.analytics_enabled) {
          cleanupAll();
          setLoaded(true);
          return;
        }

        // Injetar scripts em try-catch individuais para não falhar tudo
        try {
          if (config.google_analytics_id) injectGoogleAnalytics(config.google_analytics_id);
        } catch (e) { console.warn('GA injection failed', e); }

        try {
          if (config.google_tag_manager_id) injectGTM(config.google_tag_manager_id);
        } catch (e) { console.warn('GTM injection failed', e); }

        try {
          if (config.facebook_pixel_id) injectFacebookPixel(config.facebook_pixel_id);
        } catch (e) { console.warn('Pixel injection failed', e); }

        setLoaded(true);
      } catch (err) {
        // Silently fail after timeout or error
        console.warn('[AnalyticsScripts] Config load skipped/failed');
        setLoaded(true);
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

export default AnalyticsScripts;
