import Link from 'next/link';
export default function NotFound() {
  return (
    <main style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', background: '#0d0c0a', color: '#f4efe4', padding: 24, textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
        <span style={{ color: '#c9a54e' }}>404</span>
        <h1 style={{ fontSize: 48 }}>Página no encontrada</h1>
        <p style={{ color: '#b9ae98' }}>La página que buscas no existe o fue movida.</p>
        <Link href="/" className="btn btn-gold">Volver al inicio</Link>
      </div>
    </main>
  );
}
