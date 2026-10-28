import Head from 'next/head';

/* Backend down → friendly page (getServerSideProps sets 503 + Retry-After) */
export default function Unavailable({ children = 'COULD NOT LOAD DATA FROM THE BACKEND — please try again in a little while.' }) {
  return (
    <>
      <Head>
        <title>Temporarily unavailable — Chaupal Te Charcha</title>
      </Head>
      <main className="loading" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ font: 'inherit', margin: 0 }}>{children}</h1>
      </main>
    </>
  );
}
