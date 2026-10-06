/* Push notification prompt — sirf logged-in readers layi, slim bottom bar (anonymous visitors nu kade nahi) */
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { readerFetch, useReader } from '@/lib/reader';

const LATER_KEY = 'ctc-notif-later'; // "Not now" — sirf is browser session layi
const DENIED_KEY = 'ctc-notif-denied-sent';

const ssGet = (k) => {
  try {
    return sessionStorage.getItem(k);
  } catch (e) {
    return null;
  }
};
const ssSet = (k) => {
  try {
    sessionStorage.setItem(k, '1');
  } catch (e) {
    /* private mode */
  }
};

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
const pushSupported = () => 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator;

function urlB64ToUint8Array(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function NotifyBar() {
  const { reader, refresh } = useReader();
  const router = useRouter();
  const [mode, setMode] = useState(null); // null | 'prompt' | 'ios' | 'denied'
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const deniedSent = useRef(false);

  const hiddenRoute = /^\/(studio|login)(\/|$)/.test(router.pathname);

  const reportDenied = () => {
    if (deniedSent.current || ssGet(DENIED_KEY)) return;
    deniedSent.current = true;
    ssSet(DENIED_KEY);
    readerFetch('/api/reader/push/status', { method: 'POST', body: { status: 'denied' } }).catch(() => {});
  };

  useEffect(() => {
    if (!reader || hiddenRoute) {
      setMode(null);
      return;
    }
    if (mode === 'denied') return; // hint dikh raha — user band kare
    if (reader.notif_status === 'granted' || ssGet(LATER_KEY)) {
      setMode(null);
      return;
    }
    if (isIOS() && !isStandalone()) {
      setMode('ios');
      return;
    }
    if (!pushSupported()) {
      setMode(null);
      return;
    }
    if (Notification.permission === 'default') {
      setMode('prompt');
      return;
    }
    if (Notification.permission === 'denied' && reader.notif_status !== 'denied' && !ssGet(DENIED_KEY)) {
      reportDenied();
      setMode('denied');
      return;
    }
    setMode(null);
  }, [reader, hiddenRoute]); // eslint-disable-line

  /* Bar footer nu na dhakke — body thalle jagah */
  useEffect(() => {
    document.body.classList.toggle('has-nbar', Boolean(mode));
    return () => document.body.classList.remove('has-nbar');
  }, [mode]);

  const later = () => {
    ssSet(LATER_KEY);
    setMode(null);
  };

  const allow = async () => {
    setErr('');
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        await navigator.serviceWorker.register('/sw.js');
        const reg = await navigator.serviceWorker.ready;
        const k = await readerFetch('/api/public/push/key');
        const key = k && k.publicKey;
        if (!key) throw new Error('Notifications are not available right now.');
        const sub =
          (await reg.pushManager.getSubscription()) ||
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(key) }));
        await readerFetch('/api/reader/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON() } });
        await refresh();
        setMode(null);
      } else if (perm === 'denied') {
        reportDenied();
        setMode('denied');
      } else {
        later(); // prompt band kar ditta — agli visit te phir
      }
    } catch (e) {
      setErr(e.message || 'Could not turn on notifications. Please try again.');
    }
    setBusy(false);
  };

  if (!mode) return null;

  return (
    <div className="notifybar" role="region" aria-label="Notifications">
      <div className="nbin">
        {mode === 'prompt' ? (
          <>
            <span className="nbtext">Get new stories as notifications</span>
            {err ? <span className="nberr" role="alert">{err}</span> : null}
            <span className="nbacts">
              <button className="btn sm" type="button" onClick={allow} disabled={busy}>{busy ? 'Turning on…' : 'Allow'}</button>
              <button className="btn sm btn-ghost" type="button" onClick={later} disabled={busy}>Not now</button>
            </span>
          </>
        ) : null}
        {mode === 'ios' ? (
          <>
            <span className="nbtext">Add this site to your Home Screen to get notifications</span>
            <span className="nbhint">Tap Share <span aria-hidden="true">⎙</span> → Add to Home Screen, then open it from there.</span>
            <span className="nbacts"><button className="btn sm btn-ghost" type="button" onClick={later}>Not now</button></span>
          </>
        ) : null}
        {mode === 'denied' ? (
          <>
            <span className="nbtext">Notifications are blocked in this browser</span>
            <span className="nbhint">To turn them on: click the lock / site icon next to the address bar → Site settings → Notifications → Allow, then reload.</span>
            <span className="nbacts"><button className="btn sm btn-ghost" type="button" onClick={later}>OK</button></span>
          </>
        ) : null}
      </div>
    </div>
  );
}
