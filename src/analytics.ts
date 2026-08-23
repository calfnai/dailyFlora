const productionHostnames = new Set(['dailyflora.calfn.com', 'www.dailyflora.calfn.com']);
const measurementId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID?.trim() || '';
const analyticsLoadedKey = '__dailyfloraGoogleAnalyticsLoaded';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [analyticsLoadedKey]?: boolean;
  }
}

function canLoadAnalytics() {
  return import.meta.env.PROD
    && window.top === window.self
    && productionHostnames.has(window.location.hostname)
    && /^G-[A-Z0-9]+$/i.test(measurementId);
}

function loadGoogleTag() {
  if (!canLoadAnalytics() || window[analyticsLoadedKey]) return;
  window[analyticsLoadedKey] = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    anonymize_ip: true,
    transport_type: 'beacon'
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.onerror = () => {
    // Analytics is optional; a blocked or unavailable Google endpoint must not affect the site.
  };
  document.head.appendChild(script);
}

function scheduleAnalytics() {
  if (!canLoadAnalytics()) return;
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(loadGoogleTag, { timeout: 2500 });
  } else {
    window.setTimeout(loadGoogleTag, 1500);
  }
}

if (document.readyState === 'complete') scheduleAnalytics();
else window.addEventListener('load', scheduleAnalytics, { once: true });

export {};
