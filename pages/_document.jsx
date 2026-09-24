import { Html, Head, Main, NextScript } from 'next/document';
import { GtmNoScript } from '@/components/Analytics';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700;800&family=Baloo+2:wght@600;700&family=Baloo+Paaji+2:wght@600;700&display=swap"
          rel="stylesheet"
        />
        {(process.env.NEXT_PUBLIC_GSC_VERIFICATION || '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => (
            <meta key={v} name="google-site-verification" content={v} />
          ))}
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        {/* Theme first-paint ton pehla — stored choice jitdi hai; default: home dark, article/login/studio light */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=null;try{t=localStorage.getItem('ctc-theme');}catch(e){}if(!t){t=/^\\/(article|login|studio)/.test(location.pathname)?'light':'dark';}document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </Head>
      <body>
        <GtmNoScript />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
