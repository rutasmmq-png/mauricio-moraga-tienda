import { NextResponse } from 'next/server';
import { webpayCommit } from '@/lib/payments/webpay';
import { markOrderFailed, markOrderPaid, orderUrls } from '@/lib/orders';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';

// Transbank vuelve a esta URL (GET o POST) con token_ws (pago procesado)
// o con TBK_TOKEN / TBK_ORDEN_COMPRA (pago anulado o tiempo agotado).
async function handle(params: URLSearchParams) {
  const sb = createSupabaseAdmin();
  const tokenWs = params.get('token_ws');
  const tbkToken = params.get('TBK_TOKEN');
  const sessionId = params.get('TBK_ID_SESION');

  if (tokenWs && !tbkToken) {
    const { data: order } = await sb.from('orders').select('id, access_key').eq('provider_ref', tokenWs).maybeSingle();
    if (!order) return NextResponse.redirect(`${SITE_URL}/carrito?cancelado=1`, 303);
    try {
      const r = await webpayCommit(tokenWs);
      if (r.response_code === 0 && r.status === 'AUTHORIZED' && r.session_id === order.id) {
        await markOrderPaid(order.id, 'webpay', r.authorization_code || tokenWs, { amount: r.amount, currency: 'CLP' });
      } else {
        await markOrderFailed(order.id);
      }
    } catch (e) {
      console.error('[webpay] commit', e);
      // Si el commit ya se había hecho (recarga de página), el pedido ya está pagado y se muestra igual.
    }
    return NextResponse.redirect(orderUrls(order).success, 303);
  }

  // Pago anulado por el usuario o tiempo agotado
  const id = sessionId || null;
  if (id) {
    await markOrderFailed(id, 'cancelled');
  } else if (tbkToken) {
    const { data: o } = await sb.from('orders').select('id').eq('provider_ref', tbkToken).maybeSingle();
    if (o) await markOrderFailed(o.id, 'cancelled');
  }
  return NextResponse.redirect(`${SITE_URL}/carrito?cancelado=1`, 303);
}

export async function GET(req: Request) { return handle(new URL(req.url).searchParams); }
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const p = new URLSearchParams(new URL(req.url).search);
  form?.forEach((v, k) => p.set(k, String(v)));
  return handle(p);
}
