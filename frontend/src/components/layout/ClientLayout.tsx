'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Script from 'next/script';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/ui/Toast';
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';
import { SiteSettings, defaultSiteSettings } from '@/lib/site-settings';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  // Dynamically update favicon in browser if customized in Site Settings
  useEffect(() => {
    const favUrl = settings?.branding?.faviconUrl || settings?.seo?.faviconUrl;
    if (favUrl && typeof document !== 'undefined') {
      const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
      if (existingIcons.length > 0) {
        existingIcons.forEach((el) => {
          el.href = favUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = favUrl;
        document.head.appendChild(link);
      }
    }
  }, [settings?.branding?.faviconUrl, settings?.seo?.faviconUrl]);

  const ga4Id = settings?.analytics?.ga4Enabled ? settings?.analytics?.ga4MeasurementId : null;
  const gtmId = settings?.analytics?.gtmEnabled ? settings?.analytics?.gtmContainerId : null;
  const pixelId = settings?.pixel?.pixelEnabled ? settings?.pixel?.pixelId : null;
  const isDebug = Boolean(settings?.analytics?.debugMode);
  const trackPageView = settings?.pixel?.trackPageView !== false;

  return (
    <ToastProvider>
      <CartProvider>
        {/* Google Analytics 4 Script */}
        {ga4Id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${ga4Id}', {
                  page_path: window.location.pathname,
                  ${isDebug ? 'debug_mode: true,' : ''}
                });
              `}
            </Script>
          </>
        )}

        {/* Google Tag Manager Script */}
        {gtmId && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}

        {/* Meta (Facebook) Pixel Script */}
        {pixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              ${trackPageView ? "fbq('track', 'PageView');" : ''}
            `}
          </Script>
        )}

        {children}
        <Suspense fallback={null}>
          <FloatingWhatsApp />
        </Suspense>
      </CartProvider>
    </ToastProvider>
  );
}
