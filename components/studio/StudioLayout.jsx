import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Mark } from '@/components/site/bits';
import { ThemeToggle } from '@/lib/ui';

const ROLE_META = {
  admin: { label: 'ADMIN', bg: 'var(--acc)', fg: 'var(--on-acc)', tc: 'var(--acc-text)' },
  author: { label: 'PUBLISHER', bg: 'var(--ok)', fg: '#fff', tc: 'var(--ok)' },
  seo: { label: 'SEO MANAGER', bg: 'var(--hv)', fg: '#fff', tc: 'var(--hv)' },
  marketing: { label: 'MARKETING', bg: 'var(--bj)', fg: '#fff', tc: 'var(--bj)' },
};

const I = {
  dash: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="2" stroke="currentColor" strokeWidth="1.7" /><rect x="11" y="2.5" width="6.5" height="6.5" rx="2" stroke="currentColor" strokeWidth="1.7" /><rect x="2.5" y="11" width="6.5" height="6.5" rx="2" stroke="currentColor" strokeWidth="1.7" /><rect x="11" y="11" width="6.5" height="6.5" rx="2" stroke="currentColor" strokeWidth="1.7" /></svg>,
  posts: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 3.5 H16 V16.5 H4 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M7 7.5 H13 M7 10.5 H13 M7 13.5 H11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 3.5 L16.5 7.5 L8 16 H4 V12 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
  media: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><circle cx="7.5" cy="8.5" r="1.4" fill="currentColor" /><path d="M4 14 L8.5 10.5 L12 13.5 L16 10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  play: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7" /><path d="M10 6.5 A2 2 0 1 1 8.6 9.9 C8.2 10.3 10 10.5 10 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" /><circle cx="10" cy="14.4" r="0.9" fill="currentColor" /></svg>,
  seo: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.7" /><path d="M13 13 L17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  mkt: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 12 V8 L12 4 V16 L3 12 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M14.5 8 A3.5 3.5 0 0 1 14.5 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  cmt: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 4.5 H17 V13.5 H8 L4.5 16.5 V13.5 H3 Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
  users: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="7.5" cy="7" r="3" stroke="currentColor" strokeWidth="1.7" /><path d="M2.5 16 C2.5 13 5 11.5 7.5 11.5 C10 11.5 12.5 13 12.5 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><circle cx="14" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.7" /><path d="M13.5 12 C16 12 17.7 13.5 17.7 15.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  set: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.7" /><path d="M10 2.8 V5 M10 15 V17.2 M2.8 10 H5 M15 10 H17.2 M4.9 4.9 L6.5 6.5 M13.5 13.5 L15.1 15.1 M15.1 4.9 L13.5 6.5 M6.5 13.5 L4.9 15.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  out: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12 4 H5 V16 H12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M9 10 H17 M14 6.5 L17.5 10 L14 13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  site: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 4 H4 V16 H16 V12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M11 3.5 H16.5 V9 M16.5 3.5 L9.5 10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>,
};

const GROUPS = [
  {
    head: 'CONTENT', perm: 'dashboard',
    links: [
      { href: '/studio', label: 'Dashboard', icon: I.dash, perm: 'dashboard' },
      { href: '/studio/posts', label: 'Posts', icon: I.posts, perm: 'posts' },
      { href: '/studio/editor', label: 'New post', icon: I.edit, perm: 'edit-content' },
      { href: '/studio/media', label: 'Media', icon: I.media, perm: 'media' },
      { href: '/studio/play', label: 'Quizzes te polls', icon: I.play, perm: 'playful' },
    ],
  },
  {
    head: 'GROWTH', perm: 'seo,marketing,approve',
    links: [
      { href: '/studio/seo', label: 'SEO', icon: I.seo, perm: 'seo' },
      { href: '/studio/marketing', label: 'Marketing', icon: I.mkt, perm: 'marketing' },
      { href: '/studio/comments', label: 'Comments', icon: I.cmt, perm: 'approve' },
    ],
  },
  {
    head: 'ADMIN', perm: 'users,settings',
    links: [
      { href: '/studio/users', label: 'Users te roles', icon: I.users, perm: 'users' },
      { href: '/studio/settings', label: 'Settings', icon: I.set, perm: 'settings' },
    ],
  },
];

/* Permission-gated render — <Can perm="publish">…</Can> */
export function Can({ perm, children }) {
  const { can } = useAuth();
  return can(perm) ? children : null;
}

export default function StudioLayout({ title, children }) {
  const router = useRouter();
  const { user, ready, can, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) {
    return <div className="loading" style={{ minHeight: '100vh' }}>STUDIO KHUL RAHA HAI…</div>;
  }

  const meta = ROLE_META[user.role] || ROLE_META.author;

  return (
    <>
      <Head>
        <title>{`${title} — Charcha Studio`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="shell">
        <aside className={`side${open ? ' open' : ''}`} aria-label="Studio navigation">
          <Link className="brand" href="/studio">
            <Mark size={38} icon={22} />
            <span>
              <span className="display b1">CHARCHA <span>STUDIO</span></span>
              <br />
              <span className="b2">CHAUPAL TE CHARCHA CMS</span>
            </span>
          </Link>

          {GROUPS.map((g) =>
            can(g.perm) ? (
              <nav className="ngroup" key={g.head} aria-label={g.head}>
                <span className="nh">{g.head}</span>
                {g.links.map((l) =>
                  can(l.perm) ? (
                    <Link key={l.href} className={`nlink${router.pathname === l.href ? ' active' : ''}`} href={l.href} onClick={() => setOpen(false)}>
                      {l.icon}
                      {l.label}
                    </Link>
                  ) : null
                )}
              </nav>
            ) : null
          )}

          <div className="sidefoot">
            <a className="nlink" href="/" target="_blank" rel="noopener noreferrer">{I.site}View site</a>
            <button className="nlink" type="button" onClick={() => { logout(); router.replace('/login'); }}>{I.out}Log out</button>
          </div>
        </aside>
        <div className={`backdrop${open ? ' show' : ''}`} onClick={() => setOpen(false)} />

        <div className="main">
          <header className="topbar">
            <button className="iconbtn menubtn" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(!open)} type="button">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3 6 H19 M3 11 H19 M3 16 H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <span className="display vtitle">{title}</span>
            <div className="searchbox">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" /><path d="M13.5 13.5 L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              <input type="search" placeholder="Search posts, media, users…" aria-label="Search" />
            </div>
            <ThemeToggle />
            <span className="userchip">
              <span className="avatar" style={{ background: meta.bg, color: meta.fg }}>
                {user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <span className="ut">
                <span className="un">{user.name}</span>
                <br />
                <span className="ur" style={{ color: meta.tc }}>{meta.label}</span>
              </span>
            </span>
          </header>
          <div className="views">
            <section className="view">{children}</section>
          </div>
        </div>
      </div>
    </>
  );
}
