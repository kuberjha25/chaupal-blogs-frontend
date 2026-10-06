// Static page copied from the old WordPress site (contact-us). Edit the text in BODY below.
import Head from 'next/head';
import { ssrGet } from '@/lib/api';
import Chrome from '@/components/site/Chrome';
import Footer from '@/components/site/Footer';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const TITLE = "Contact Us";
const DESCRIPTION = "We would love to hear from you. Address: Plot 161 Ind, Industrial Area Phase II, Chandigarh, 160002 Phone: 97797 73084 Email: info@chaupal.in";
const BODY = "<p>We would love to hear from you.</p>\n<ul>\n<li><strong>Address:</strong> Plot 161 Ind, Industrial Area Phase II, Chandigarh, 160002</li>\n<li><strong>Phone:</strong> <a href=\"tel:9779773084\">97797 73084</a></li>\n<li><strong>Email:</strong> <a href=\"mailto:info@chaupal.in\">info@chaupal.in</a></li>\n</ul>";

export async function getServerSideProps() {
  try {
    const { settings } = await ssrGet('/api/public/home');
    return { props: { settings: settings || {} } };
  } catch (e) {
    return { props: { settings: {} } };
  }
}

export default function ContactUs({ settings }) {
  return (
    <>
      <Head>
        <title>{`${TITLE} — ${settings.site_title || 'Chaupal Te Charcha'}`}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={`${SITE}/contact-us`} />
      </Head>
      <Chrome settings={settings} />
      <main id="main">
        <div className="wrap" id="top">
          <article className="postbody">
            <h1>{TITLE}</h1>
            <div dangerouslySetInnerHTML={{ __html: BODY }} />
          </article>
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
