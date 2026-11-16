'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { useI18n } from '@/components/I18nProvider';
import { track } from '@/components/track';
import { formatPrice } from '@/lib/format';

type Provider = 'stripe' | 'mercadopago' | 'webpay';

export function CheckoutForm() {
  const { t, locale } = useI18n();
  const { items, ready, subtotal, currency } = useCart();
  const [opts, setOpts] = useState<{ providers: Provider[]; shipping: number; shippingNote: string } | null>(null);
  const [provider, setProvider] = useState<Provider | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const needsShipping = items.some((i) => i.delivery === 'physical');

  useEffect(() => {
    if (!currency) return;
    fetch(`/api/checkout?currency=${currency}`).then((r) => r.json()).then((d) => { setOpts(d); setProvider(d.providers[0] || ''); }).catch(() => setOpts({ providers: [], shipping: 0, shippingNote: '' }));
  }, [currency]);

  if (!ready) return <section className="band light"><div className="container"><p>{t.common.loading}</p></div></section>;
  if (!items.length) return (
    <section className="band light"><div className="container empty stack" style={{ alignItems: 'center' }}>
      <p>{t.cart.empty}</p><Link href="/libros" className="btn btn-dark">{t.cart.continue}</Link>
    </div></section>
  );

  const shipping = needsShipping ? opts?.shipping || 0 : 0;
  const total = subtotal + shipping;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!provider) return;
    setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) || '').trim();
    track('begin_checkout', { currency, value: total });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider, locale,
          items: items.map((i) => ({ offerId: i.offerId, qty: i.qty })),
          customer: {
            name: g('name'), email: g('email'), phone: g('phone'), country: g('country'),
            address: needsShipping ? { line1: g('line1'), city: g('city'), region: g('region'), zip: g('zip'), country: g('country') } : undefined,
          },
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || t.checkout.error);
      if (d.webpay) {
        // Webpay exige enviar el token por POST a su formulario
        const form = document.createElement('form');
        form.method = 'POST'; form.action = d.webpay.url;
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = 'token_ws'; input.value = d.webpay.token;
        form.appendChild(input); document.body.appendChild(form); form.submit();
        return;
      }
      window.location.href = d.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.checkout.error);
      setBusy(false);
    }
  }

  return (
    <section className="band light">
      <div className="container">
        <h1 className="h-lg" style={{ marginBottom: 28 }}>{t.checkout.title}</h1>
        <form className="cart-grid" onSubmit={submit}>
          <div className="form">
            <h2 className="h-md">{t.checkout.yourData}</h2>
            <div className="field"><label htmlFor="name">{t.checkout.name} *</label><input id="name" name="name" required className="input" autoComplete="name" maxLength={120} /></div>
            <div className="grid-2">
              <div className="field"><label htmlFor="email">{t.checkout.email} *</label><input id="email" name="email" type="email" required className="input" autoComplete="email" maxLength={200} /><span className="hint">{t.checkout.emailHint}</span></div>
              <div className="field"><label htmlFor="phone">{t.checkout.phone}{needsShipping ? ' *' : ''}</label><input id="phone" name="phone" type="tel" required={needsShipping} className="input" autoComplete="tel" maxLength={40} /></div>
            </div>
            <div className="field"><label htmlFor="country">{t.checkout.country}</label><input id="country" name="country" className="input" autoComplete="country-name" defaultValue={currency === 'CLP' ? 'Chile' : ''} maxLength={80} /></div>
            {needsShipping && (
              <>
                <h2 className="h-md" style={{ marginTop: 12 }}>{t.checkout.shippingAddress}</h2>
                <div className="field"><label htmlFor="line1">{t.checkout.address} *</label><input id="line1" name="line1" required className="input" autoComplete="street-address" maxLength={200} /></div>
                <div className="grid-2">
                  <div className="field"><label htmlFor="city">{t.checkout.city} *</label><input id="city" name="city" required className="input" autoComplete="address-level2" maxLength={100} /></div>
                  <div className="field"><label htmlFor="region">{t.checkout.region}</label><input id="region" name="region" className="input" autoComplete="address-level1" maxLength={100} /></div>
                </div>
                <div className="field" style={{ maxWidth: 240 }}><label htmlFor="zip">{t.checkout.zip}</label><input id="zip" name="zip" className="input" autoComplete="postal-code" maxLength={20} /></div>
                {opts?.shippingNote && <p className="small muted">{opts.shippingNote}</p>}
              </>
            )}
            <h2 className="h-md" style={{ marginTop: 12 }}>{t.checkout.payment}</h2>
            {!opts ? <p className="muted">{t.common.loading}</p> : opts.providers.length === 0 ? (
              <p className="alert alert-info">{t.checkout.noProviders}</p>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {opts.providers.map((p) => (
                  <label key={p} className="radio-card">
                    <input type="radio" name="provider" value={p} checked={provider === p} onChange={() => setProvider(p)} />
                    <span>{t.checkout[p]}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <aside className="summary">
            <h2 className="h-md">{t.checkout.summary}</h2>
            {items.map((i) => (
              <div className="sum-row small" key={i.offerId}><span>{i.title} · {i.label} × {i.qty}</span><span style={{ whiteSpace: 'nowrap' }}>{formatPrice(i.price * i.qty, i.currency, locale)}</span></div>
            ))}
            <div className="sum-row"><span>{t.cart.subtotal}</span><span>{formatPrice(subtotal, currency!, locale)}</span></div>
            {needsShipping && <div className="sum-row"><span>{t.cart.shipping}</span><span>{formatPrice(shipping, currency!, locale)}</span></div>}
            <div className="sum-row sum-total"><span>{t.cart.total}</span><span>{formatPrice(total, currency!, locale)}</span></div>
            {error && <p className="alert alert-err" role="alert">{error}</p>}
            <button className="btn btn-gold btn-block" disabled={busy || !provider}>{busy ? t.checkout.processing : `${t.checkout.pay} ${formatPrice(total, currency!, locale)}`}</button>
            <p className="small muted">{t.checkout.terms}</p>
          </aside>
        </form>
      </div>
    </section>
  );
}
