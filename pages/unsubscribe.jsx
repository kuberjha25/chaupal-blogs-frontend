import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { api } from '@/lib/api';

/* Opened from the "Unsubscribe" link in our emails: ?e=<email>&t=<token>. A button press confirms (a mail scanner opening the link can't unsubscribe anyone) */
export default function Unsubscribe() {
  const { query, isReady } = useRouter();
  const [state, setState] = useState('idle'); // idle | busy | done | error
  const email = typeof query.e === 'string' ? query.e : '';
  const token = typeof query.t === 'string' ? query.t : '';

  const confirm = async () => {
    setState('busy');
    try {
      await api.post('/api/public/unsubscribe', { email, token });
      setState('done');
    } catch (e) {
      setState('error');
    }
  };

  return (
    <>
      <Head>
        <title>Unsubscribe — Chaupal Te Charcha</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, textAlign: 'center' }}>
        <h1 className="display" style={{ margin: 0, fontSize: 30 }}>
          {state === 'done' ? 'YOU ARE UNSUBSCRIBED' : 'UNSUBSCRIBE FROM EMAILS'}
        </h1>
        {state === 'done' ? (
          <p style={{ margin: 0, color: 'var(--mut)', maxWidth: 440 }}>
            We will no longer email <b>{email}</b> about new stories. You can sign up again any time from the newsletter box on the home page.
          </p>
        ) : !isReady ? null : !email || !token ? (
          <p style={{ margin: 0, color: 'var(--mut)', maxWidth: 440 }}>This unsubscribe link is not valid. Please use the link from the bottom of one of our emails.</p>
        ) : (
          <>
            <p style={{ margin: 0, color: 'var(--mut)', maxWidth: 440 }}>
              Stop emails about new stories to <b>{email}</b>?
            </p>
            <button className="btn btn-lg" type="button" onClick={confirm} disabled={state === 'busy'}>
              {state === 'busy' ? 'Unsubscribing…' : 'Yes, unsubscribe me'}
            </button>
            {state === 'error' ? <p style={{ margin: 0, color: 'var(--bj)' }}>This link is not valid or has expired. Please use the link from a recent email.</p> : null}
          </>
        )}
        <Link className="backlink" href="/">← Back to Chaupal Te Charcha</Link>
      </main>
    </>
  );
}
