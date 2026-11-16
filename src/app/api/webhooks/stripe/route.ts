import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe, fromStripeAmount } from '@/lib/payments/stripe';
import { markOrderFailed, markOrderPaid } from '@/lib/orders';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get('stripe-signature');
  if (!secret || !sig) return NextResponse.json({ error: 'not configured' }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch (e) {
    console.error('[stripe] firma inválida', e);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object as Stripe.Checkout.Session;
    const orderId = s.metadata?.order_id;
    if (orderId && s.payment_status === 'paid') {
      const cur = (s.currency || '').toUpperCase();
      await markOrderPaid(orderId, 'stripe', String(s.payment_intent || s.id), { amount: fromStripeAmount(s.amount_total || 0, cur), currency: cur });
    }
  }
  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.metadata?.order_id) await markOrderFailed(s.metadata.order_id, event.type === 'checkout.session.expired' ? 'cancelled' : 'failed');
  }
  return NextResponse.json({ received: true });
}
