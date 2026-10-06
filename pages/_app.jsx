import '@/styles/globals.css';
import Head from 'next/head';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/ui';
import Analytics from '@/components/Analytics';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {/* Site-wide defaults — page apna <meta name="robots"> de ke override kar sakda (login/studio: noindex) */}
        <Head>
          <meta name="robots" content="max-image-preview:large" />
          <meta property="og:locale" content="en_IN" key="og:locale" />
        </Head>
        <Analytics />
        <Component {...pageProps} />
      </ToastProvider>
    </AuthProvider>
  );
}
