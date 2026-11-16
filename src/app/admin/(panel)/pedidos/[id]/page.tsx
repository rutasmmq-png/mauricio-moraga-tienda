import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/format';
import { resetDownloads, updateOrder } from '../../../actions';
import { SubmitButton } from '../../../ui';
import { SITE_URL } from '@/lib/site';

export default async function OrderDetail({ params }: { params: { id: string } }) {
  const sb = createSupabaseAdmin();
  const { data: o } = await sb.from('orders').select('*').eq('id', params.id).maybeSingle();
  if (!o) notFound();
  const { data: items } = await sb.from('order_items').select('*, tokens:download_tokens(token, downloads, max_downloads, expires_at)').eq('order_id', o.id);
  const addr = (o.shipping_address || {}) as Record<string, string>;
  return (
    <>
      <div className="adm-head"><h1>Pedido #{o.number}</h1><Link href="/admin/pedidos" className="btn-link">← Volver</Link></div>
      <div className="form-grid">
        <div className="stack" style={{ gap: 20 }}>
          <div className="panel">
            <h2>Productos</h2>
            <table className="tbl"><tbody>
              {(items || []).map((i) => (
                <tr key={i.id}>
                  <td><strong>{i.title}</strong><div className="small muted">{i.label} · {i.delivery === 'digital' ? 'Digital' : 'Impreso'}</div>
                    {i.tokens?.map((t: { token: string; downloads: number; max_downloads: number; expires_at: string }) => (
                      <div key={t.token} className="small muted">Descargas: {t.downloads}/{t.max_downloads} · vence {new Date(t.expires_at).toLocaleDateString('es-CL')}</div>
                    ))}</td>
                  <td className="num">× {i.quantity}</td><td className="num">{formatPrice(Number(i.line_total), o.currency)}</td>
                </tr>
              ))}
              <tr><td>Envío</td><td /><td className="num">{formatPrice(Number(o.shipping), o.currency)}</td></tr>
              <tr><td><strong>Total</strong></td><td /><td className="num"><strong>{formatPrice(Number(o.total), o.currency)}</strong></td></tr>
            </tbody></table>
            {o.status === 'paid' && (items || []).some((i) => i.delivery === 'digital') && (
              <form action={resetDownloads} style={{ marginTop: 12 }}><input type="hidden" name="order_id" value={o.id} />
                <SubmitButton className="btn btn-outline btn-sm">Renovar descargas (30 días más, contador a 0)</SubmitButton></form>
            )}
          </div>
          {o.needs_shipping && (
            <div className="panel form">
              <h2>Despacho</h2>
              <p>{[addr.line1, addr.city, addr.region, addr.zip, addr.country].filter(Boolean).join(', ')}</p>
              <form action={updateOrder} className="form">
                <input type="hidden" name="id" value={o.id} />
                <div className="grid-2">
                  <div className="field"><label htmlFor="fs">Estado del despacho</label>
                    <select id="fs" name="fulfillment_status" defaultValue={o.fulfillment_status} className="select">
                      <option value="pending">Por despachar</option><option value="shipped">Despachado</option><option value="delivered">Entregado</option>
                    </select></div>
                  <div className="field"><label htmlFor="tr">Seguimiento / courier</label><input id="tr" name="tracking_info" defaultValue={o.tracking_info || ''} className="input" /></div>
                </div>
                <div className="field"><label htmlFor="nt">Notas internas</label><textarea id="nt" name="notes" defaultValue={o.notes || ''} className="textarea" style={{ minHeight: 80 }} /></div>
                <SubmitButton>Guardar</SubmitButton>
              </form>
            </div>
          )}
        </div>
        <div className="panel stack" style={{ gap: 10 }}>
          <h2>Cliente</h2>
          <p><strong>{o.customer_name}</strong></p>
          <p><a className="link" href={`mailto:${o.email}`}>{o.email}</a></p>
          {o.phone && <p>{o.phone}</p>}{o.country && <p>{o.country}</p>}
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', width: '100%' }} />
          <p><span className={`status st-${o.status}`}>{o.status}</span></p>
          <p className="small">Pasarela: {o.provider} {o.provider_ref && <span className="muted">· {o.provider_ref}</span>}</p>
          <p className="small">Creado: {new Date(o.created_at).toLocaleString('es-CL')}</p>
          {o.paid_at && <p className="small">Pagado: {new Date(o.paid_at).toLocaleString('es-CL')}</p>}
          {!o.needs_shipping && o.notes && <p className="small alert alert-info">{o.notes}</p>}
          <p className="small"><a className="link" href={`${SITE_URL}/checkout/exito?order=${o.id}&k=${o.access_key}`} target="_blank" rel="noopener">Página del pedido del cliente ↗</a></p>
        </div>
      </div>
    </>
  );
}
