import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/format';

const LABEL: Record<string, string> = { pending: 'Pendiente', paid: 'Pagado', failed: 'Fallido', cancelled: 'Cancelado', refunded: 'Reembolsado' };
const FUL: Record<string, string> = { none: '—', pending: 'Por despachar', shipped: 'Despachado', delivered: 'Entregado' };

export default async function OrdersAdmin({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const status = searchParams.status ?? 'paid';
  let q = createSupabaseAdmin().from('orders').select('id, number, customer_name, email, total, currency, status, provider, fulfillment_status, created_at').order('created_at', { ascending: false }).limit(300);
  if (status) q = q.eq('status', status);
  if (searchParams.q) q = q.or(`email.ilike.%${searchParams.q.replace(/[%,()]/g, '')}%,customer_name.ilike.%${searchParams.q.replace(/[%,()]/g, '')}%`);
  const { data } = await q;
  const totals: Record<string, number> = {};
  (data || []).filter((o) => o.status === 'paid').forEach((o) => { totals[o.currency] = (totals[o.currency] || 0) + Number(o.total); });
  return (
    <>
      <div className="adm-head">
        <h1>Pedidos y ventas directas</h1>
        <form className="row" style={{ gap: 6 }}>
          <input name="q" defaultValue={searchParams.q} placeholder="Nombre o correo" className="input" style={{ width: 200, padding: '8px 10px' }} />
          <select name="status" defaultValue={status} className="select" style={{ width: 160, padding: '8px 10px' }}>
            <option value="">Todos</option>{Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn btn-outline btn-sm">Filtrar</button>
          <a href={`/api/admin/export?type=orders&status=${status}`} className="btn btn-outline btn-sm">Exportar CSV</a>
        </form>
      </div>
      {Object.keys(totals).length > 0 && <p className="small" style={{ marginBottom: 12 }}>Total pagado en esta lista: {Object.entries(totals).map(([c, v]) => formatPrice(v, c)).join(' · ')}</p>}
      <div className="panel tbl-wrap">
        <table className="tbl">
          <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Pago</th><th>Estado</th><th>Despacho</th><th className="num">Total</th></tr></thead>
          <tbody>
            {(data || []).map((o) => (
              <tr key={o.id}>
                <td><Link className="link" href={`/admin/pedidos/${o.id}`}>{o.number}</Link></td>
                <td>{new Date(o.created_at).toLocaleString('es-CL')}</td>
                <td>{o.customer_name}<div className="small muted">{o.email}</div></td>
                <td>{o.provider}</td>
                <td><span className={`status st-${o.status}`}>{LABEL[o.status]}</span></td>
                <td>{o.fulfillment_status !== 'none' ? <span className={`status st-${o.fulfillment_status}`}>{FUL[o.fulfillment_status]}</span> : '—'}</td>
                <td className="num">{formatPrice(Number(o.total), o.currency)}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={7} className="muted">No hay pedidos con este filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
