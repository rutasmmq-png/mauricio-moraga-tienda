import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { providersFor, type Provider } from '@/lib/payments';
import { createPendingOrder, CheckoutError, markOrderFailed, orderUrls } from '@/lib/orders';
import { stripe, toStripeAmount } from '@/lib/payments/stripe';
import { createPreference } from '@/lib/payments/mercadopago';
import { webpayCreate } from '@/lib/payments/webpay';
import { clean, clientIp, isEmail, rateLimited } from '@/lib/rateLimit';
import { SITE_URL } from '@/lib/site';
import type { Locale } from '@/lib/types';

/** GET: medios de pago disponibles y costo de envío para una moneda. */
export async function GET(req: Request) {
  const cur = (new URL(req.url).searchParams.get('currency') || 'USD').toUpperCase().slice(0, 3);
  const { data } = await createSupabaseAdmin().from('settings').select('key,value').in('key', [`shipping_cost_${cur}`, 'shipping_note_es']);
  const get = (k: string) => data?.find((r) => r.key === k)?.value || '';
  return NextResponse.json({ providers: providersFor(cur), shipping: Number(get(`shipping_cost_${cur}`)) || 0, shippingNote: get('shipping_note_es') });
}

/** POST: crea el pedido pendiente y la sesión de pago en la pasarela elegida. */
export async function POST(req: Request) {
  if (rateLimited(`checkout:${clientIp(req)}`, 10)) return NextResponse.json({ error: 'Demasiados intentos. Espera un minuto.' }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });

  const provider = body.provider as Provider;
  const locale: Locale = ['es', 'en', 'hi'].includes(body.locale) ? body.locale : 'es';
  const c = body.customer || {};
  const customer = {
    name: clean(c.name, 120), email: clean(c.email, 200), phone: clean(c.phone, 40), country: clean(c.country, 80),
    address: c.address ? { line1: clean(c.address.line1, 200), city: clean(c.address.city, 100), region: clean(c.address.region, 100), zip: clean(c.address.zip, 20), country: clean(c.address.country, 80) } : undefined,
  };
  if (!customer.name || !isEmail(customer.email)) return NextResponse.json({ error: 'Completa tu nombre y un correo válido.' }, { status: 400 });
  const lines = Array.isArray(body.items) ? body.items.slice(0, 50).map((i: { offerId: unknown; qty: unknown }) => ({ offerId: String(i.offerId), qty: Number(i.qty) || 1 })) : [];

  let created;
  try {
    created = await createPendingOrder(lines, customer, provider, locale);
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error('[checkout] crear pedido', e);
    return NextResponse.json({ error: 'No pudimos crear el pedido.' }, { status: 500 });
  }
  const { order, items } = created;
  if (!providersFor(order.currency).includes(provider)) {
    await markOrderFailed(order.id, 'cancelled');
    return NextResponse.json({ error: 'Este medio de pago no está disponible para esta moneda.' }, { status: 400 });
  }
  const urls = orderUrls(order);

  try {
    if (provider === 'stripe') {
      const session = await stripe().checkout.sessions.create({
        mode: 'payment',
        customer_email: order.email,
        client_reference_id: order.id,
        metadata: { order_id: order.id },
        payment_intent_data: { metadata: { order_id: order.id } },
        locale: locale === 'hi' ? 'auto' : locale,
        line_items: [
          ...items.map((i) => ({ quantity: i.quantity, price_data: { currency: order.currency.toLowerCase(), unit_amount: toStripeAmount(i.unit_price, order.currency), product_data: { name: `${i.title} – ${i.label}` } } })),
          ...(Number(order.shipping) > 0 ? [{ quantity: 1, price_data: { currency: order.currency.toLowerCase(), unit_amount: toStripeAmount(Number(order.shipping), order.currency), product_data: { name: 'Envío' } } }] : []),
        ],
        success_url: `${urls.success}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: urls.cancel,
      });
      await createSupabaseAdmin().from('orders').update({ provider_ref: session.id }).eq('id', order.id);
      return NextResponse.json({ redirectUrl: session.url });
    }

    if (provider === 'mercadopago') {
      const pref = await createPreference({
        items: [
          ...items.map((i) => ({ id: i.offer_id, title: `${i.title} – ${i.label}`.slice(0, 250), quantity: i.quantity, unit_price: Number(i.unit_price), currency_id: order.currency })),
          ...(Number(order.shipping) > 0 ? [{ id: 'envio', title: 'Envío', quantity: 1, unit_price: Number(order.shipping), currency_id: order.currency }] : []),
        ],
        payer: { name: order.customer_name, email: order.email },
        external_reference: order.id,
        back_urls: { success: urls.success, pending: urls.success, failure: urls.cancel },
        auto_return: 'approved',
        notification_url: `${SITE_URL}/api/webhooks/mercadopago`,
        statement_descriptor: 'MAURICIO MORAGA',
      }, order.id);
      await createSupabaseAdmin().from('orders').update({ provider_ref: pref.id }).eq('id', order.id);
      return NextResponse.json({ redirectUrl: pref.init_point });
    }

    if (provider === 'webpay') {
      const tx = await webpayCreate({ buyOrder: `MM${order.number}`, sessionId: order.id, amount: Number(order.total), returnUrl: `${SITE_URL}/api/payments/webpay/return` });
      await createSupabaseAdmin().from('orders').update({ provider_ref: tx.token }).eq('id', order.id);
      return NextResponse.json({ webpay: { url: tx.url, token: tx.token } });
    }
  } catch (e) {
    console.error('[checkout] pasarela', e);
    await markOrderFailed(order.id);
    return NextResponse.json({ error: 'La pasarela de pago no respondió. Inténtalo nuevamente.' }, { status: 502 });
  }
  return NextResponse.json({ error: 'Medio de pago no válido' }, { status: 400 });
}
