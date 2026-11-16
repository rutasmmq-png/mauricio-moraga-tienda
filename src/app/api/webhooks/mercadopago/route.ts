import { NextResponse } from 'next/server';
import { getPayment, mercadoPagoEnabled } from '@/lib/payments/mercadopago';
import { markOrderFailed, markOrderPaid } from '@/lib/orders';

export const runtime = 'nodejs';

/**
 * Mercado Pago avisa que hubo un pago. No confiamos en el contenido del aviso:
 * consultamos el pago directamente a la API de Mercado Pago con nuestro token.
 */
export async function POST(req: Request) {
  if (!mercadoPagoEnabled()) return NextResponse.json({ ok: false }, { status: 400 });
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const type = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
  const id = body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id');
  if (type !== 'payment' || !id) return NextResponse.json({ ignored: true });
  try {
    const p = await getPayment(id);
    if (!p.external_reference) return NextResponse.json({ ignored: true });
    if (p.status === 'approved') await markOrderPaid(p.external_reference, 'mercadopago', String(p.id), { amount: p.transaction_amount, currency: p.currency_id });
    else if (p.status === 'rejected' || p.status === 'cancelled') await markOrderFailed(p.external_reference);
  } catch (e) {
    console.error('[mercadopago] webhook', e);
    return NextResponse.json({ error: 'retry' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
export async function GET() { return NextResponse.json({ ok: true }); }
