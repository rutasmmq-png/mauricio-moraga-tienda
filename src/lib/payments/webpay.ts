import 'server-only';

// Webpay Plus REST (Transbank). Documentación: https://www.transbankdevelopers.cl/referencia/webpay
const BASE = () => (process.env.WEBPAY_ENV === 'production' ? 'https://webpay3g.transbank.cl' : 'https://webpay3gint.transbank.cl');
const PATH = '/rswebpaytransaction/api/webpay/v1.2/transactions';

export const webpayEnabled = () => !!process.env.WEBPAY_COMMERCE_CODE && !!process.env.WEBPAY_API_KEY;

function headers() {
  return {
    'Tbk-Api-Key-Id': process.env.WEBPAY_COMMERCE_CODE!,
    'Tbk-Api-Key-Secret': process.env.WEBPAY_API_KEY!,
    'Content-Type': 'application/json',
  };
}

export async function webpayCreate(p: { buyOrder: string; sessionId: string; amount: number; returnUrl: string }) {
  const res = await fetch(BASE() + PATH, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ buy_order: p.buyOrder, session_id: p.sessionId, amount: Math.round(p.amount), return_url: p.returnUrl }),
  });
  if (!res.ok) throw new Error(`Webpay ${res.status}: ${await res.text()}`);
  return (await res.json()) as { token: string; url: string };
}

export interface WebpayCommit { vci?: string; amount: number; status: string; buy_order: string; session_id: string; response_code: number; authorization_code?: string }
export async function webpayCommit(token: string) {
  const res = await fetch(`${BASE()}${PATH}/${encodeURIComponent(token)}`, { method: 'PUT', headers: headers() });
  if (!res.ok) throw new Error(`Webpay commit ${res.status}: ${await res.text()}`);
  return (await res.json()) as WebpayCommit;
}
