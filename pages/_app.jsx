import '@/styles/globals.css';
import Head from 'next/head';
import { AuthProvider } from '@/lib/auth';
import { ReaderProvider } from '@/lib/reader';
import { ToastProvider } from '@/lib/ui';
import Analytics from '@/components/Analytics';
import AuthModal from '@/components/reader/AuthModal';
import NotifyBar from '@/components/reader/NotifyBar';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ReaderProvider>
          {/* Site-wide defaults — a page can override with its own <meta name="robots"> (login/studio: noindex) */}
          <Head>
            <meta name="robots" content="max-image-preview:large" />
            <meta property="og:locale" content="en_IN" key="og:locale" />
          </Head>
          <Analytics />
          <Component {...pageProps} />
          {/* Both client-only — they render nothing into the SSR HTML */}
          <AuthModal />
          <NotifyBar />
        </ReaderProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
