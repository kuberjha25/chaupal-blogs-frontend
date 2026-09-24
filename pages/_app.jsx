import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/lib/ui';
import Analytics from '@/components/Analytics';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Analytics />
        <Component {...pageProps} />
      </ToastProvider>
    </AuthProvider>
  );
}
