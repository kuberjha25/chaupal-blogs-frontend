import Script from 'next/script';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const GTM = process.env.NEXT_PUBLIC_GTM_ID;
const GA4 = process.env.NEXT_PUBLIC_GA4_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/* ID env vich daalte hi live — khali hai to koi script load nahi hoti.
   Recommended: sirf GTM ID daalo te GA4 + Pixel GTM de andar manage karo,
   ya direct GA4/PIXEL IDs daalo — dono supported. */
export default function Analytics() {
  const router = useRouter();

  useEffect(() => {
    const onRoute = (url) => {
      if (GA4 && typeof window.gtag === 'function') {
        window.gtag('config', GA4, { page_path: url });
      }
      if (PIXEL && typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
      }
      if (GTM && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: 'pageview', page: url });
      }
    };
    router.events.on('routeChangeComplete', onRoute);
    return () => router.events.off('routeChangeComplete', onRoute);
  }, [router.events]);

  return (
    <>
      {GTM ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');`}
        </Script>
      ) : null}
      {GA4 ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4}');`}
          </Script>
        </>
      ) : null}
      {PIXEL ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

export function GtmNoScript() {
  if (!GTM) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
