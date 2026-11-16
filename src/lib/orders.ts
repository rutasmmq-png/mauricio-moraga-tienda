import 'server-only';
import { createSupabaseAdmin } from './supabase/admin';
import { emailLayout, escapeHtml, sendEmail } from './email';
import { formatPrice, roundMoney } from './format';
import { SITE_URL } from './site';
import type { Locale } from './types';

export interface CheckoutLine { offerId: string; qty: number }
export interface CheckoutCustomer {
  name: string; email: string; phone?: string; country?: string;
  address?: { line1?: string; city?: string; region?: string; zip?: string; country?: string };
}

export class CheckoutError extends Error {}

/**
 * Crea un pedido "pendiente" recalculando TODO en el servidor a partir de la base de datos:
 * nunca se confía en precios enviados por el navegador.
 */
export async function createPendingOrder(lines: CheckoutLine[], customer: CheckoutCustomer, provider: string, locale: Locale) {
  const sb = createSupabaseAdmin();
  if (!lines.length) throw new CheckoutError('Carrito vacío');
  const ids = Array.from(new Set(lines.map((l) => l.offerId)));
  const { data: offers, error } = await sb.from('sales_offers')
    .select('id, label, price, currency, delivery, stock, active, platform, book:books(id, title, status, digital_file_path)')
    .in('id', ids);
  if (error) throw error;

  type Row = { id: string; label: string; price: number | null; currency: string; delivery: 'digital' | 'physical'; stock: number | null; active: boolean; platform: string; book: { id: string; title: string; status: string; digital_file_path: string | null } | null };
  const rows = (offers || []) as unknown as Row[];
  const items = lines.map((l) => {
    const o = rows.find((r) => r.id === l.offerId);
    if (!o || !o.active || o.platform !== 'direct' || o.price === null || !o.book || o.book.status !== 'published')
      throw new CheckoutError('Uno de los productos ya no está disponible. Actualiza tu carrito.');
    const qty = o.delivery === 'digital' ? 1 : Math.min(Math.max(1, Math.floor(Number(l.qty) || 1)), 20);
    if (o.delivery === 'physical' && o.stock !== null && o.stock < qty) throw new CheckoutError(`Sin stock suficiente: ${o.book.title}`);
    if (o.delivery === 'digital' && !o.book.digital_file_path) throw new CheckoutError(`El archivo de "${o.book.title}" aún no está disponible.`);
    return { o, qty };
  });

  const currency = items[0].o.currency;
  if (items.some((i) => i.o.currency !== currency)) throw new CheckoutError('Todos los productos deben estar en la misma moneda.');

  const needsShipping = items.some((i) => i.o.delivery === 'physical');
  if (needsShipping && (!customer.address?.line1 || !customer.address?.city)) throw new CheckoutError('Falta la dirección de despacho.');

  const subtotal = roundMoney(items.reduce((s, i) => s + Number(i.o.price) * i.qty, 0), currency);
  let shipping = 0;
  if (needsShipping) {
    const { data: s } = await sb.from('settings').select('value').eq('key', `shipping_cost_${currency}`).maybeSingle();
    shipping = roundMoney(Number(s?.value || 0) || 0, currency);
  }
  const total = roundMoney(subtotal + shipping, currency);
  const email = customer.email.trim().toLowerCase();

  const { data: cust } = await sb.from('customers')
    .upsert({ email, name: customer.name.trim(), phone: customer.phone || null, country: customer.country || null }, { onConflict: 'email' })
    .select('id').single();

  const { data: order, error: oErr } = await sb.from('orders').insert({
    status: 'pending', provider, currency, subtotal, shipping, total,
    customer_id: cust?.id || null, customer_name: customer.name.trim(), email,
    phone: customer.phone || null, country: customer.country || null,
    needs_shipping: needsShipping, shipping_address: needsShipping ? customer.address : null,
    fulfillment_status: needsShipping ? 'pending' : 'none', locale,
  }).select('*').single();
  if (oErr || !order) throw oErr || new Error('No se pudo crear el pedido');

  const orderItems = items.map(({ o, qty }) => ({
    order_id: order.id, book_id: o.book!.id, offer_id: o.id, title: o.book!.title, label: o.label,
    delivery: o.delivery, unit_price: Number(o.price), quantity: qty, line_total: roundMoney(Number(o.price) * qty, currency),
  }));
  const { error: iErr } = await sb.from('order_items').insert(orderItems);
  if (iErr) throw iErr;

  return { order, items: orderItems };
}

/**
 * Marca un pedido como pagado SOLO si estaba pendiente y el monto coincide.
 * Es idempotente: webhooks repetidos no duplican descargas ni correos.
 */
export async function markOrderPaid(orderId: string, provider: string, providerRef: string, paid: { amount: number; currency: string }) {
  const sb = createSupabaseAdmin();
  const { data: current } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!current) return { ok: false, reason: 'not_found' };
  if (current.status === 'paid') return { ok: true, already: true };
  if (paid.currency.toUpperCase() !== current.currency || Math.abs(Number(paid.amount) - Number(current.total)) > 0.01) {
    console.error('[orders] Monto no coincide', orderId, paid, current.total, current.currency);
    await sb.from('orders').update({ notes: `Monto recibido no coincide: ${paid.amount} ${paid.currency}` }).eq('id', orderId);
    return { ok: false, reason: 'amount_mismatch' };
  }

  const { data: updated } = await sb.from('orders')
    .update({ status: 'paid', provider, provider_ref: providerRef, paid_at: new Date().toISOString() })
    .eq('id', orderId).eq('status', 'pending').select('*').maybeSingle();
  if (!updated) return { ok: true, already: true }; // otro proceso lo confirmó primero

  const { data: items } = await sb.from('order_items').select('*').eq('order_id', orderId);
  const digital = (items || []).filter((i) => i.delivery === 'digital');
  let tokens: { order_item_id: string; token: string }[] = [];
  if (digital.length) {
    const { data } = await sb.from('download_tokens').insert(digital.map((i) => ({ order_item_id: i.id }))).select('order_item_id, token');
    tokens = data || [];
  }
  for (const i of (items || []).filter((x) => x.delivery === 'physical' && x.offer_id)) {
    await sb.rpc('decrement_stock', { p_offer: i.offer_id, p_qty: i.quantity });
  }

  await sendOrderEmails(updated, items || [], tokens).catch((e) => console.error('[orders] email', e));
  return { ok: true };
}

export async function markOrderFailed(orderId: string, status: 'failed' | 'cancelled' = 'failed') {
  await createSupabaseAdmin().from('orders').update({ status }).eq('id', orderId).eq('status', 'pending');
}

/** Pedido + ítems + descargas, solo si la clave de acceso coincide (nadie puede ver pedidos ajenos). */
export async function getOrderForCustomer(orderId: string, accessKey: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !accessKey) return null;
  const sb = createSupabaseAdmin();
  const { data: order } = await sb.from('orders').select('*').eq('id', orderId).eq('access_key', accessKey).maybeSingle();
  if (!order) return null;
  const { data: items } = await sb.from('order_items').select('*, tokens:download_tokens(token, expires_at, downloads, max_downloads)').eq('order_id', orderId);
  return { order, items: items || [] };
}

export function orderUrls(order: { id: string; access_key: string }) {
  const q = `order=${order.id}&k=${order.access_key}`;
  return { success: `${SITE_URL}/checkout/exito?${q}`, cancel: `${SITE_URL}/carrito?cancelado=1` };
}

async function sendOrderEmails(
  order: { id: string; number: number; email: string; customer_name: string; total: number; currency: string; locale: Locale; needs_shipping: boolean; access_key: string; shipping_address: Record<string, string> | null; phone: string | null },
  items: { id: string; title: string; label: string | null; quantity: number; line_total: number; delivery: string }[],
  tokens: { order_item_id: string; token: string }[],
) {
  const loc = (order.locale || 'es') as Locale;
  const dict = {
    es: { subj: `Confirmación de tu compra #${order.number}`, hi: 'Hola', thanks: 'Gracias por tu compra. Este es el detalle de tu pedido:', dl: 'Descargar', ship: 'Te contactaremos para coordinar el despacho de tus libros impresos.', view: 'Ver mi pedido', note: 'Los enlaces de descarga son personales, vencen en 30 días y permiten hasta 5 descargas.' },
    en: { subj: `Your purchase confirmation #${order.number}`, hi: 'Hello', thanks: 'Thank you for your purchase. Here are your order details:', dl: 'Download', ship: 'We will contact you to arrange delivery of your printed books.', view: 'View my order', note: 'Download links are personal, expire in 30 days and allow up to 5 downloads.' },
    hi: { subj: `आपकी खरीद की पुष्टि #${order.number}`, hi: 'नमस्ते', thanks: 'आपकी खरीद के लिए धन्यवाद। आपके ऑर्डर का विवरण:', dl: 'डाउनलोड करें', ship: 'मुद्रित पुस्तकों की डिलीवरी के लिए हम आपसे संपर्क करेंगे।', view: 'मेरा ऑर्डर देखें', note: 'डाउनलोड लिंक व्यक्तिगत हैं, 30 दिन में समाप्त होते हैं और अधिकतम 5 डाउनलोड की अनुमति देते हैं।' },
  };
  const tt = dict[loc] || dict.es;
  const rows = items.map((i) => {
    const tok = tokens.find((x) => x.order_item_id === i.id);
    const link = tok ? `<br><a href="${SITE_URL}/api/download/${tok.token}" style="display:inline-block;margin-top:6px;background:#1b1814;color:#f3ece0;padding:8px 14px;text-decoration:none">${tt.dl}</a>` : '';
    return `<tr><td style="padding:10px 0;border-bottom:1px solid #e3d8c3"><strong>${escapeHtml(i.title)}</strong><br><span style="color:#6b5f4c">${escapeHtml(i.label || '')} × ${i.quantity}</span>${link}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e3d8c3;text-align:right;white-space:nowrap">${formatPrice(Number(i.line_total), order.currency, loc)}</td></tr>`;
  }).join('');
  const html = emailLayout(tt.subj, `<p>${tt.hi} ${escapeHtml(order.customer_name)},</p><p>${tt.thanks}</p>
    <table style="width:100%;border-collapse:collapse">${rows}
    <tr><td style="padding:12px 0"><strong>Total</strong></td><td style="text-align:right"><strong>${formatPrice(Number(order.total), order.currency, loc)}</strong></td></tr></table>
    ${tokens.length ? `<p style="color:#6b5f4c;font-size:13px">${tt.note}</p>` : ''}
    ${order.needs_shipping ? `<p>${tt.ship}</p>` : ''}
    <p><a href="${orderUrls(order).success}" style="color:#8a6a22">${tt.view}</a></p>`);
  await sendEmail({ to: order.email, subject: tt.subj, html });

  const sb = createSupabaseAdmin();
  const { data: s } = await sb.from('settings').select('key,value').in('key', ['admin_notification_email', 'contact_email']);
  const adminEmail = s?.find((r) => r.key === 'admin_notification_email')?.value || s?.find((r) => r.key === 'contact_email')?.value;
  if (adminEmail) {
    const addr = order.shipping_address ? Object.values(order.shipping_address).filter(Boolean).map(String).map(escapeHtml).join(', ') : '';
    await sendEmail({
      to: adminEmail, subject: `Nueva venta #${order.number} – ${formatPrice(Number(order.total), order.currency, 'es')}`,
      html: emailLayout(`Nueva venta #${order.number}`, `<p><strong>${escapeHtml(order.customer_name)}</strong> · ${escapeHtml(order.email)} ${order.phone ? '· ' + escapeHtml(order.phone) : ''}</p>
        <ul>${items.map((i) => `<li>${escapeHtml(i.title)} – ${escapeHtml(i.label || '')} × ${i.quantity}</li>`).join('')}</ul>
        ${order.needs_shipping ? `<p><strong>Despacho:</strong> ${addr}</p>` : ''}
        <p><a href="${SITE_URL}/admin/pedidos/${order.id}">Ver en el panel</a></p>`),
    });
  }
}
