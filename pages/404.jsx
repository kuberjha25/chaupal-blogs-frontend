import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, textAlign: 'center' }}>
      <span className="display" style={{ fontSize: 120, lineHeight: 1, color: 'transparent', WebkitTextStroke: '3px var(--acc)' }}>404</span>
      <h1 className="display" style={{ margin: 0, fontSize: 30 }}>EH PANNA CHAUPAL TON BAHAR HAI</h1>
      <p style={{ margin: 0, color: 'var(--mut)', maxWidth: 420 }}>Jo story tusi labh rahe ho, oh ithe nahi — par charcha ghar te zaroor hai.</p>
      <Link className="btn btn-lg" href="/">← Back to Chaupal Te Charcha</Link>
    </main>
  );
}
