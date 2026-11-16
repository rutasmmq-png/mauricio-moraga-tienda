'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNav({ badges }: { badges: { reviews: number; messages: number; orders: number } }) {
  const path = usePathname();
  const items: [string, string, number?][] = [
    ['/admin', 'Resumen'], ['/admin/libros', 'Libros'], ['/admin/pedidos', 'Pedidos y ventas', badges.orders],
    ['/admin/clientes', 'Clientes'], ['/admin/categorias', 'Categorías e idiomas'], ['/admin/resenas', 'Opiniones', badges.reviews],
    ['/admin/novedades', 'Novedades'], ['/admin/suscriptores', 'Suscriptores'], ['/admin/mensajes', 'Mensajes', badges.messages], ['/admin/ajustes', 'Ajustes del sitio'],
  ];
  return (
    <nav style={{ display: 'contents' }} aria-label="Panel">
      {items.map(([href, label, n]) => (
        <Link key={href} href={href} aria-current={(href === '/admin' ? path === href : path.startsWith(href)) ? 'page' : undefined}>
          {label}{n ? <span className="adm-badge">{n}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
