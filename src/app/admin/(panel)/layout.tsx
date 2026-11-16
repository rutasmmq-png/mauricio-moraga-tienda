import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { signOut } from '../actions';
import { AdminNav } from './AdminNav';

export const metadata: Metadata = { title: 'Administración', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const sb = createSupabaseAdmin();
  const [{ count: reviews }, { count: messages }, { count: toShip }] = await Promise.all([
    sb.from('reviews').select('id', { count: 'exact', head: true }).eq('approved', false),
    sb.from('messages').select('id', { count: 'exact', head: true }).eq('read', false),
    sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid').eq('fulfillment_status', 'pending'),
  ]);
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="brand"><b style={{ fontSize: 20 }}>MAURICIO MORAGA</b><span>Panel</span></div>
        <AdminNav badges={{ reviews: reviews || 0, messages: messages || 0, orders: toShip || 0 }} />
        <div style={{ marginTop: 'auto', paddingTop: 16, fontSize: 13, color: '#9a8f79' }}>
          <div style={{ padding: '0 12px 8px', wordBreak: 'break-all' }}>{user.email}</div>
          <a href="/" target="_blank" rel="noopener">Ver sitio ↗</a>
          <form action={signOut}><button className="btn-link" style={{ color: '#e9e1d1', padding: '10px 12px' }}>Cerrar sesión</button></form>
        </div>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
