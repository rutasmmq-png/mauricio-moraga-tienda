import 'server-only';
import { stripeEnabled } from './stripe';
import { mercadoPagoEnabled, mercadoPagoCurrencies } from './mercadopago';
import { webpayEnabled } from './webpay';

export type Provider = 'stripe' | 'mercadopago' | 'webpay';

/** Medios de pago realmente configurados para una moneda. Si no hay credenciales, no se muestran. */
export function providersFor(currency: string): Provider[] {
  const cur = currency.toUpperCase();
  const list: Provider[] = [];
  if (webpayEnabled() && cur === 'CLP') list.push('webpay');
  if (mercadoPagoEnabled() && mercadoPagoCurrencies().includes(cur)) list.push('mercadopago');
  if (stripeEnabled()) list.push('stripe');
  return list;
}

export function allProviderCurrencies() {
  return { stripe: stripeEnabled(), mercadopago: mercadoPagoEnabled() ? mercadoPagoCurrencies() : [], webpay: webpayEnabled() };
}
