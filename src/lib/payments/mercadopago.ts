import 'server-only';

const API = 'https://api.mercadopago.com';
export const mercadoPagoEnabled = () => !!process.env.MERCADOPAGO_ACCESS_TOKEN;
/** Mercado Pago cobra en la moneda del país de tu cuenta (Chile = CLP). */
export const mercadoPagoCurrencies = () => (process.env.MERCADOPAGO_CURRENCIES || 'CLP').split(',').map((s) => s.trim().toUpperCase());

function headers(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, 'Content-Type': 'application/json', ...extra };
}

export async function createPreference(body: Record<string, unknown>, idempotencyKey: string) {
  const res = await fetch(`${API}/checkout/preferences`, { method: 'POST', headers: headers({ 'X-Idempotency-Key': idempotencyKey }), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string; init_point: string; sandbox_init_point?: string };
}

export interface MpPayment { id: number; status: string; external_reference: string | null; transaction_amount: number; currency_id: string }
export async function getPayment(id: string | number) {
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(String(id))}`, { headers: headers(), cache: 'no-store' });
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}`);
  return (await res.json()) as MpPayment;
}
