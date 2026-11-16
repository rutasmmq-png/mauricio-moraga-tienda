import Link from 'next/link';
import type { Metadata } from 'next';
import { getDict, getLocale } from '@/lib/i18n';
import { getOrderForCustomer, markOrderPaid } from '@/lib/orders';
import { formatPrice } from '@/lib/format';
import { stripe, stripeEnabled, fromStripeAmount } from '@/lib/payments/stripe';
import { getPayment, mercadoPagoEnabled } from '@/lib/payments/mercadopago';
import { PaidEffects, AutoRefresh } from './ClientBits';

export const metadata: Metadata = { title: 'Pedido', robots: { index: false } };
export const dynamic = 'force-dynamic';

type SP = { order?: string; k?: string; session_id?: string; payment_id?: string; collection_id?: string };

export default async function SuccessPage({ searchParams }: { searchParams: SP }) {
  const locale = getLocale();
  const t = getDict(locale);
  let data = searchParams.order && searchParams.k ? await getOrderForCustomer(searchParams.order, searchParams.k) : null;

  // Confirmación de respaldo: si el webhook aún no llegó, se consulta directamente a la pasarela.
  if (data && data.order.status === 'pending') {
    try {
      if (data.order.provider === 'stripe' && searchParams.session_id && stripeEnabled()) {
        const s = await stripe().checkout.sessions.retrieve(searchParams.session_id);
        if (s.payment_status === 'paid' && s.metadata?.order_id === data.order.id) {
          await markOrderPaid(data.order.id, 'stripe', String(s.payment_intent || s.id), { amount: fromStripeAmount(s.amount_total || 0, (s.currency || '').toUpperCase()), currency: (s.currency || '').toUpperCase() });
        }
      }
      const mpId = searchParams.payment_id || searchParams.collection_id;
      if (data.order.provider === 'mercadopago' && mpId && mercadoPagoEnabled()) {
        const p = await getPayment(mpId);
        if (p.status === 'approved' && p.external_reference === data.order.id) {
          await markOrderPaid(data.order.id, 'mercadopago', String(p.id), { amount: p.transaction_amount, currency: p.currency_id });
        }
      }
    } catch (e) { console.error('[exito] verificación', e); }
    data = await getOrderForCustomer(searchParams.order!, searchParams.k!);
  }

  if (!data) {
    return <section className="band light"><div className="container empty stack" style={{ alignItems: 'center' }}><p>{t.success.notFound}</p><Link href="/libros" className="btn btn-dark">{t.success.back}</Link></div></section>;
  }
  const { order, items } = data;
  const paid = order.status === 'paid';
  const pending = order.status === 'pending';

  return (
    <section className="band light">
      <div className="container" style={{ maxWidth: 760 }}>
        {paid && <PaidEffects orderId={order.id} value={Number(order.total)} currency={order.currency} />}
        {pending && <AutoRefresh />}
        <div className="stack">
          <span className="kicker">{t.success.order} #{order.number}</span>
          <h1 className="h-lg">{paid ? t.success.title : pending ? t.success.pendingTitle : t.success.failedTitle}</h1>
          <p className={`alert ${paid ? 'alert-ok' : pending ? 'alert-info' : 'alert-err'}`}>{paid ? t.success.paid : pending ? t.success.pending : t.success.failed}</p>

          <div style={{ background: 'var(--white)', border: '1px solid var(--line)', padding: 24 }} className="stack">
            {items.map((i: { id: string; title: string; label: string | null; quantity: number; line_total: number; delivery: string; tokens: { token: string; downloads: number; max_downloads: number; expires_at: string }[] }) => (
              <div key={i.id} className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
                <div className="stack" style={{ gap: 4 }}>
                  <strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{i.title}</strong>
                  <span className="small muted">{i.label} × {i.quantity}</span>
                </div>
                <div className="row">
                  <span className="price" style={{ fontSize: 17 }}>{formatPrice(Number(i.line_total), order.currency, locale)}</span>
                  {paid && i.tokens?.map((tk) => (
                    <a key={tk.token} href={`/api/download/${tk.token}`} className="btn btn-dark btn-sm">{t.success.download} ({tk.max_downloads - tk.downloads})</a>
                  ))}
                </div>
              </div>
            ))}
            {Number(order.shipping) > 0 && <div className="sum-row"><span>{t.cart.shipping}</span><span>{formatPrice(Number(order.shipping), order.currency, locale)}</span></div>}
            <div className="sum-row sum-total"><span>{t.cart.total}</span><span>{formatPrice(Number(order.total), order.currency, locale)}</span></div>
          </div>
          {paid && items.some((i: { delivery: string }) => i.delivery === 'digital') && <p className="small muted">{t.success.downloadNote}</p>}
          {paid && order.needs_shipping && <p>{t.success.shipping}</p>}
          <div className="row">
            <Link href="/libros" className="btn btn-gold">{t.success.back}</Link>
            {!paid && !pending && <Link href="/carrito" className="btn btn-outline">{t.success.retry}</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
