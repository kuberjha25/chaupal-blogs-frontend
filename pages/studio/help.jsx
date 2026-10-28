import { useMemo, useState } from 'react';
import StudioLayout from '@/components/studio/StudioLayout';
import { useAuth } from '@/lib/auth';

/* Admin handbook — plain data, so adding an answer is one object. a = paragraphs (string) and bullet lists ({ list: [...] }) */
const SECTIONS = [
  {
    id: 'start',
    title: 'Getting started',
    items: [
      {
        q: 'What can each role do?',
        a: [
          'Roles decide what shows up in the left menu. Change a role in Users & roles — it applies on the person\'s very next click.',
          {
            list: [
              'Admin — everything: publish, delete, SEO, marketing, readers, notifications, users and settings.',
              'Publisher (author) — writes posts, uploads media, runs quizzes and moderates comments on their own posts. Cannot publish: they Submit for review and an admin publishes.',
              'SEO manager — edits SEO title, meta description, slug and 301 redirects. Cannot change the post body.',
              'Marketing — UTM links, campaigns, newsletter, readers and push notifications.',
            ],
          },
        ],
      },
      {
        q: 'Where do I see how the site is doing?',
        a: 'The Dashboard shows total views, total posts, average read time, views for the last 7 days, recent activity and to-do cards (posts in review, published posts missing a meta description, live campaign, pending comments).',
      },
    ],
  },
  {
    id: 'posts',
    title: 'Writing and publishing posts',
    items: [
      {
        q: 'How do I publish a new story?',
        a: [
          { list: [
            'New post → add a title, a one-line dek (summary), the featured image, a boli and a category.',
            'Write the body in the editor. Use Heading 2 for section titles (see the table of contents answer below).',
            'Fill the SEO box: SEO title (up to 60 characters), meta description (up to 160) and the URL slug. Leave the slug empty to generate it from the title.',
            'Set the status and press Publish now. A publisher presses Submit for review instead.',
          ] },
        ],
      },
      {
        q: 'What do the statuses mean?',
        a: { list: [
          'Draft — saved, not visible on the site.',
          'In review — waiting for an admin to publish.',
          'Scheduled — goes live automatically at the "Go live at" time.',
          'Published — live on the site, in the sitemap and in the feed.',
        ] },
      },
      {
        q: 'How do I schedule a post?',
        a: 'Set the status to Scheduled, pick the date and time under "Go live at" and save. Until that time the post is hidden everywhere (home, /latest, category pages, sitemap). Once the time passes it appears on its own — nothing to click.',
      },
      {
        q: 'How does the table of contents work?',
        a: 'It is built automatically from the Heading 2 titles in the post body and shown in the article sidebar (and as a collapsible block on mobile). Use Heading 2 for sections — Heading 3 and bold text are not included. A post without any Heading 2 has no table of contents. Old WordPress posts may need their section titles re-marked as Heading 2.',
      },
      {
        q: 'Which image size should I use for the featured image?',
        a: 'Upload 1920×1080 (16:9). The minimum is 1280×720. Any format works (JPG, PNG, HEIC) — the server converts it to WebP. The size check under the image tells you if the width or ratio is off. If a post has no image, a ghost glyph on a coloured tone is shown instead (set under Ghost art).',
      },
      {
        q: 'Why is my published post not on the home page?',
        a: { list: [
          'It must be Published (or Scheduled with a time in the past) — drafts and in-review posts are never shown.',
          'The home page is cached for about a minute: a new post shows up within ~60 seconds.',
          'The big hero is always the single newest published post — there is no manual "featured" switch. To change the hero, publish a newer post.',
          'A post appears in its category row only if a category (and/or boli) is selected on it.',
        ] },
      },
    ],
  },
  {
    id: 'home',
    title: 'How the public site is organised',
    items: [
      {
        q: 'What is on the home page?',
        a: { list: [
          'Hero — the newest published post (cover image, read time, Read story button).',
          'Latest stories — the next 12 newest posts, with See all → /latest.',
          'One row per category and per boli hub that has stories (up to 12 cards each), with See all to that category or hub page.',
          'Then Top 10, What to Watch, Boli hubs, Trailers, quizzes and polls, Charcha sessions, calendar and the newsletter box. Sections with no data are hidden and their menu links disappear.',
        ] },
      },
      {
        q: 'What is the difference between /latest, /category/… and /boli/…?',
        a: { list: [
          '/latest — every published story, newest first, 12 per page.',
          '/category/<slug> — stories of one category, for example /category/movie. These are the same addresses the old WordPress site used, so old links and Google rankings keep working.',
          '/boli/<slug> — stories of one language hub: punjabi, haryanvi or bhojpuri.',
        ] },
      },
      {
        q: 'How do I add a new category?',
        a: [
          'The Studio cannot create categories yet — they live in the categories table. A developer adds one by inserting a row (name, slug, kind = category) or by adding it to database/migrate-categories.js and running it.',
          'After that, pick it on a post in the editor. An empty category page is kept out of Google (noindex) and out of the sitemap until it has a story.',
        ],
      },
      {
        q: 'A category page shows 404. Why?',
        a: 'The category does not exist in the database. On a fresh production database, run the category migration once: node database/migrate-categories.js (from the backend folder). It is safe to run again.',
      },
    ],
  },
  {
    id: 'media',
    title: 'Media library',
    items: [
      {
        q: 'How do uploads work?',
        a: 'Press Upload image. JPG, PNG and HEIC are converted to WebP and resized automatically, and the file name and size are shown in the library. Use the same library from the editor (featured image and images inside the body).',
      },
      {
        q: 'What happens if I delete a media file?',
        a: 'It is removed from every post that uses it, and those posts fall back to the ghost art. Deleting cannot be undone — upload it again if needed.',
      },
    ],
  },
  {
    id: 'seo',
    title: 'SEO, sitemaps and redirects',
    items: [
      {
        q: 'What can I do on the SEO page?',
        a: { list: [
          'Meta lens — check and edit the SEO title and meta description of published posts. Titles over 60 or descriptions over 160 characters get cut in Google.',
          'Keywords and rank tracking.',
          '301 redirects — send an old path to a new one without losing search ranking. Always use a path that starts with "/", for example /old-post/ → /article/new-slug.',
        ] },
      },
      {
        q: 'Which sitemaps exist and where is robots.txt?',
        a: [
          'The sitemap index is https://blog.chaupal.com/sitemap_index.xml (also at /sitemap.xml). It lists /post-sitemap.xml (all published posts, with images), /page-sitemap.xml (home, /latest and the legal pages) and /category-sitemap.xml (category and boli pages that have stories).',
          'robots.txt blocks /studio, /login and /api and points to the sitemap index. Submit sitemap_index.xml in Google Search Console once.',
          'If the backend is down the sitemaps answer 503 instead of an empty list, so Google retries later and does not drop your pages.',
        ],
      },
      {
        q: 'What happens to old WordPress links?',
        a: 'Old post and category URLs are handled by the redirects table and the catch-all route. Anything unknown gets a real 404 page. Add new 301s on the SEO page whenever you change the slug of a published post.',
      },
      {
        q: 'Should I change a slug after publishing?',
        a: 'Avoid it. The slug is the post\'s Google address. If you must change it, add a 301 from the old address to the new one on the SEO page straight away.',
      },
    ],
  },
  {
    id: 'growth',
    title: 'Marketing, newsletter and notifications',
    items: [
      {
        q: 'How do I build a UTM link?',
        a: 'Marketing → UTM link builder: enter the page URL, source, medium and campaign name, then Copy link, or Save as campaign to keep it. A campaign can be ended and re-opened from the table. Use these links in WhatsApp, Instagram and ads so GA4 can tell where visitors came from.',
      },
      {
        q: 'How do I send a push notification?',
        a: [
          { list: [
            'Notifications → write a title and a short message (the counters show the limit).',
            'Choose where it opens: Home, Latest stories or a custom path starting with "/", like /article/your-slug.',
            'Press Review & send, check the preview, then Yes, send now.',
          ] },
          'It goes only to readers who allowed notifications and cannot be undone — so read the preview twice. The history table shows when it was sent and how many were delivered or failed. Failed usually means the reader\'s browser subscription expired.',
        ],
      },
      {
        q: 'Is the newsletter live?',
        a: 'Readers can sign up from the site, but "Send test newsletter" is still a demo response. A real mailer (SES or Mailchimp) is planned for a later phase.',
      },
    ],
  },
  {
    id: 'community',
    title: 'Comments and readers',
    items: [
      {
        q: 'How do I moderate comments?',
        a: 'Comments lists new comments from article pages. Approve shows it on the post; mark as spam hides it. Publishers only see comments on their own posts. The dashboard shows how many are waiting.',
      },
      {
        q: 'What is on the Readers page?',
        a: 'Everyone who signed up on the site: name, email, verification, notification permission and last login. Search by name or email. Admin can deactivate a reader — they can no longer log in or comment — and re-activate them later.',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Users, settings and quizzes',
    items: [
      {
        q: 'How do I add a team member or reset a password?',
        a: [
          'Users & roles → Add user (name, email, role). Use Generate strong password.',
          'The password is shown once. Copy it and send it through a secure channel — it cannot be shown again, only reset.',
          'You can change roles, deactivate accounts and set a new password from the table. You cannot change or deactivate your own account.',
        ],
      },
      {
        q: 'What do Settings control?',
        a: 'Site title, tagline, the Gurmukhi label, the Watch on Chaupal URL, the footer blurb and copyright, and the social links. The public site reads these live, so saving changes the header, footer and article sidebar straight away.',
      },
      {
        q: 'How do quizzes and polls work?',
        a: 'Quizzes & polls controls the homepage widgets: pause or take a quiz live, and end or re-open a poll while watching live vote counts. Quiz questions are JSON config in the seed data for now — a visual builder is planned.',
      },
    ],
  },
  {
    id: 'fix',
    title: 'Troubleshooting',
    items: [
      {
        q: 'The editor says "Loading editor…" and never opens.',
        a: 'Almost always a stale page after a new deploy: the open tab asks for a JavaScript file that no longer exists. Hard refresh (Cmd+Shift+R). If it still hangs, open DevTools → Console / Network and look for a red .js error or a 404 — and check that the last build on the server finished and the app was restarted.',
      },
      {
        q: 'I changed something but the public site still shows the old version.',
        a: 'Public pages are cached for about a minute (60 s, then refreshed in the background). Wait a minute and refresh. Studio changes are never cached.',
      },
      {
        q: 'The site shows "Could not load data from the backend".',
        a: 'The frontend cannot reach the API. Check that the backend process is running and that API_INTERNAL_URL / NEXT_PUBLIC_API_URL point to it. The page returns 503 so Google does not index the error.',
      },
      {
        q: 'What do I do after a new version is deployed?',
        a: { list: [
          'Backend: pull, install if needed, restart. Run node database/migrate-categories.js once when a release adds categories.',
          'Frontend: pull, npm run build, restart.',
          'Then open the home page, one category page and /sitemap_index.xml to confirm all three load.',
        ] },
      },
    ],
  },
];

const flat = (a) => (Array.isArray(a) ? a : [a]).map((x) => (typeof x === 'string' ? x : x.list.join(' '))).join(' ');

function Answer({ a }) {
  return (Array.isArray(a) ? a : [a]).map((x, i) =>
    typeof x === 'string' ? <p key={i}>{x}</p> : <ul key={i}>{x.list.map((li) => <li key={li}>{li}</li>)}</ul>
  );
}

export default function Help() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();

  const shown = useMemo(
    () =>
      SECTIONS.map((s) => ({
        ...s,
        items: term ? s.items.filter((it) => `${it.q} ${flat(it.a)}`.toLowerCase().includes(term)) : s.items,
      })).filter((s) => s.items.length),
    [term]
  );

  if (user && user.role !== 'admin') {
    return (
      <StudioLayout title="Help">
        <div className="lockednote">The help centre is for admins only.</div>
      </StudioLayout>
    );
  }

  const count = shown.reduce((n, s) => n + s.items.length, 0);

  return (
    <StudioLayout title="Help">
      <div className="vhead">
        <div className="vh">
          <span className="rule" aria-hidden="true" />
          <h2 className="display">HELP &amp; FAQ</h2>
          <span className="sub">How everything in the Studio and on the site works — search or browse by topic.</span>
        </div>
      </div>

      <form className="rsearch" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="hq" className="sr-only">Search help</label>
        <input id="hq" type="search" placeholder="Search help… (try “schedule”, “category”, “sitemap”)" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </form>

      {!term ? (
        <nav className="helptopics" aria-label="Help topics">
          {SECTIONS.map((s) => <a key={s.id} className="pill" href={`#help-${s.id}`}>{s.title}</a>)}
        </nav>
      ) : <span className="notech">{count} {count === 1 ? 'answer' : 'answers'} found</span>}

      {shown.length ? shown.map((s) => (
        <section className="card helpsec" id={`help-${s.id}`} key={s.id}>
          <div className="ch"><span className="ct">{s.title.toUpperCase()}</span></div>
          {s.items.map((it) => (
            <details className="helpq" key={it.q} open={Boolean(term)}>
              <summary>{it.q}</summary>
              <div className="helpa"><Answer a={it.a} /></div>
            </details>
          ))}
        </section>
      )) : <div className="lockednote">No answers match “{q}”. Try a shorter word.</div>}
    </StudioLayout>
  );
}
