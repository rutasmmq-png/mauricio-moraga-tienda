'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useI18n } from '@/components/I18nProvider';
import { coverSrc, formatPrice } from '@/lib/format';

export function CartView() {
  const { t, locale } = useI18n();
  const { items, ready, subtotal, currency, setQty, remove } = useCart();
  const params = useSearchParams();
  const [notice, setNotice] = useState<string | null>(null);

  // Revalida precios y disponibilidad con el servidor cada vez que se abre el carrito.
  useEffect(() => {
    if (!ready || !items.length) return;
    fetch('/api/cart/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ offerIds: items.map((i) => i.offerId) }) })
      .then((r) => r.json())
      .then((d: { offers: { id: string; price: number | null; currency: string; available: boolean }[] }) => {
        let changed = false;
        for (const it of items) {
          const o = d.offers.find((x) => x.id === it.offerId);
          if (!o || !o.available) { remove(it.offerId); changed = true; }
          else if (Number(o.price) !== it.price || o.currency !== it.currency) { changed = true; remove(it.offerId); }
        }
        if (changed) setNotice(locale === 'en' ? 'Some items changed price or are no longer available and were removed. Please add them again.' : locale === 'hi' ? 'कुछ उत्पादों का मूल्य बदल गया या वे उपलब्ध नहीं हैं, इसलिए हटा दिए गए। कृपया फिर से जोड़ें।' : 'Algunos productos cambiaron de precio o ya no están disponibles y se quitaron del carrito. Vuelve a agregarlos desde su ficha.');
      })
      .catch(() => { /* sin conexión: se valida igual al pagar */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const needsShipping = items.some((i) => i.delivery === 'physical');

  return (
    <section className="band light">
      <div className="container">
        <h1 className="h-lg" style={{ marginBottom: 28 }}>{t.cart.title}</h1>
        {params.get('cancelado') && <p className="alert alert-info" style={{ marginBottom: 20 }}>{t.success.failed}</p>}
        {notice && <p className="alert alert-info" style={{ marginBottom: 20 }}>{notice}</p>}
        {!ready ? <p className="muted">{t.common.loading}</p> : !items.length ? (
          <div className="empty stack" style={{ alignItems: 'center' }}>
            <p>{t.cart.empty}</p>
            <Link href="/libros" className="btn btn-dark">{t.cart.continue}</Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div>
              {items.map((i) => (
                <div className="cart-line" key={i.offerId}>
                  <Link href={`/libros/${i.slug}`}><img src={coverSrc(i.cover)} alt="" /></Link>
                  <div className="stack" style={{ gap: 6 }}>
                    <Link href={`/libros/${i.slug}`} style={{ textDecoration: 'none' }}><strong style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{i.title}</strong></Link>
                    <span className="small muted">{i.label}</span>
                    {i.delivery === 'physical' ? (
                      <div className="qty" role="group" aria-label={t.cart.qty}>
                        <button type="button" aria-label="−" onClick={() => setQty(i.offerId, i.qty - 1)}>−</button>
                        <span aria-live="polite">{i.qty}</span>
                        <button type="button" aria-label="+" onClick={() => setQty(i.offerId, i.qty + 1)}>+</button>
                      </div>
                    ) : <span className="small muted">{t.cart.digitalOne}</span>}
                  </div>
                  <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
                    <span className="price">{formatPrice(i.price * i.qty, i.currency, locale)}</span>
                    <button type="button" className="link small" style={{ background: 'none', border: 0, cursor: 'pointer', minHeight: 32 }} onClick={() => remove(i.offerId)}>{t.cart.remove}</button>
                  </div>
                </div>
              ))}
              <p className="small muted" style={{ marginTop: 16 }}>{t.cart.note}</p>
            </div>
            <aside className="summary">
              <div className="sum-row"><span>{t.cart.subtotal}</span><strong>{formatPrice(subtotal, currency || 'USD', locale)}</strong></div>
              {needsShipping && <div className="sum-row small muted"><span>{t.cart.shipping}</span><span>{t.cart.shippingCalc}</span></div>}
              <div className="sum-row sum-total"><span>{t.cart.total}</span><span>{formatPrice(subtotal, currency || 'USD', locale)}{needsShipping ? ' +' : ''}</span></div>
              <Link href="/checkout" className="btn btn-gold btn-block">{t.cart.checkout}</Link>
              <Link href="/libros" className="btn btn-outline btn-block">{t.cart.continue}</Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
