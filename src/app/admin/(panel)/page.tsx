import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/format';
import { allProviderCurrencies } from '@/lib/payments';

export default async function Dashboard() {
  const sb = createSupabaseAdmin();
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [{ count: pub }, { count: drafts }, { count: subs }, { data: paid30 }, { data: recent }] = await Promise.all([
    sb.from('books').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('books').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    sb.from('subscribers').select('id', { count: 'exact', head: true }),
    sb.from('orders').select('total, currency').eq('status', 'paid').gte('paid_at', since),
    sb.from('orders').select('id, number, customer_name, total, currency, status, created_at').order('created_at', { ascending: false }).limit(8),
  ]);
  const revenue: Record<string, number> = {};
  (paid30 || []).forEach((o) => { revenue[o.currency] = (revenue[o.currency] || 0) + Number(o.total); });
  const prov = allProviderCurrencies();
  const missing = [
    !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
    !prov.stripe && !prov.webpay && !prov.mercadopago.length && 'ninguna pasarela de pago (Stripe, Mercado Pago o Webpay)',
    !process.env.RESEND_API_KEY && 'RESEND_API_KEY (correos de confirmación y descargas)',
  ].filter(Boolean);

  return (
    <>
      <div className="adm-head"><h1>Resumen</h1><Link href="/admin/libros/nuevo" className="btn btn-gold">+ Agregar libro</Link></div>
      {missing.length > 0 && <p className="alert alert-info" style={{ marginBottom: 20 }}>Falta configurar: {missing.join(' · ')}. Revisa la guía de publicación (README).</p>}
      <div className="stats">
        <div className="stat"><b>{pub || 0}</b><span>Libros publicados</span></div>
        <div className="stat"><b>{drafts || 0}</b><span>Borradores</span></div>
        <div className="stat"><b>{(paid30 || []).length}</b><span>Ventas directas (30 días)</span></div>
        {Object.entries(revenue).map(([c, v]) => <div className="stat" key={c}><b>{formatPrice(v, c)}</b><span>Ingresos {c} (30 días)</span></div>)}
        <div className="stat"><b>{subs || 0}</b><span>Suscriptores</span></div>
      </div>
      <div className="panel">
        <h2>Pagos activos</h2>
        <p className="small">Stripe: <strong>{prov.stripe ? 'activo' : 'no configurado'}</strong> · Mercado Pago: <strong>{prov.mercadopago.length ? `activo (${prov.mercadopago.join(', ')})` : 'no configurado'}</strong> · Webpay: <strong>{prov.webpay ? `activo (${process.env.WEBPAY_ENV === 'production' ? 'producción' : 'PRUEBAS'})` : 'no configurado'}</strong></p>
      </div>
      <div className="panel">
        <div className="adm-head" style={{ marginBottom: 8 }}><h2 style={{ margin: 0 }}>Últimos pedidos</h2><Link href="/admin/pedidos" className="btn-link">Ver todos</Link></div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>#</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th className="num">Total</th></tr></thead>
          <tbody>
            {(recent || []).map((o) => (
              <tr key={o.id}><td><Link href={`/admin/pedidos/${o.id}`} className="link">{o.number}</Link></td><td>{o.customer_name}</td>
                <td>{new Date(o.created_at).toLocaleString('es-CL')}</td><td><span className={`status st-${o.status}`}>{o.status}</span></td>
                <td className="num">{formatPrice(Number(o.total), o.currency)}</td></tr>
            ))}
            {!recent?.length && <tr><td colSpan={5} className="muted">Aún no hay pedidos.</td></tr>}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
