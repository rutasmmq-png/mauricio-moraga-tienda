import 'server-only';
import Stripe from 'stripe';
import { ZERO_DECIMAL } from '../site';

let client: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe no configurado');
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;
export const toStripeAmount = (n: number, cur: string) => (ZERO_DECIMAL.includes(cur) ? Math.round(n) : Math.round(n * 100));
export const fromStripeAmount = (n: number, cur: string) => (ZERO_DECIMAL.includes(cur) ? n : n / 100);
