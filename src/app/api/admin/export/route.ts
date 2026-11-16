import { getAdminUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => { const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
};

export async function GET(req: Request) {
  if (!(await getAdminUser())) return new Response('No autorizado', { status: 401 });
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const sb = createSupabaseAdmin();
  let rows: Record<string, unknown>[] = [];
  if (type === 'subscribers') rows = (await sb.from('subscribers').select('email, locale, source, created_at').order('created_at')).data || [];
  else if (type === 'customers') rows = (await sb.from('customers').select('name, email, phone, country, created_at').order('created_at')).data || [];
  else if (type === 'orders') {
    let q = sb.from('orders').select('number, created_at, status, provider, customer_name, email, phone, currency, subtotal, shipping, total, fulfillment_status, shipping_address').order('created_at');
    const st = url.searchParams.get('status');
    if (st) q = q.eq('status', st);
    rows = (await q).data || [];
  } else return new Response('Tipo no válido', { status: 400 });
  return new Response(csv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
