import Head from 'next/head';

/* Backend down → friendly page (getServerSideProps 503 + Retry-After set karda) */
export default function Unavailable({ children = 'BACKEND SE DATA NAHI MILA — thodi der baad try karo.' }) {
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
