import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.offerIds) ? body.offerIds.filter((x: unknown) => typeof x === 'string').slice(0, 50) : [];
  if (!ids.length) return NextResponse.json({ offers: [] });
  const { data } = await createSupabaseAdmin().from('sales_offers')
    .select('id, price, currency, active, platform, delivery, stock, book:books(status, digital_file_path)').in('id', ids);
  type R = { id: string; price: number | null; currency: string; active: boolean; platform: string; delivery: string; stock: number | null; book: { status: string; digital_file_path: string | null } | null };
  const offers = ((data || []) as unknown as R[]).map((o) => ({
    id: o.id, price: o.price === null ? null : Number(o.price), currency: o.currency,
    available: o.active && o.platform === 'direct' && o.price !== null && o.book?.status === 'published'
      && (o.delivery === 'physical' ? o.stock === null || o.stock > 0 : !!o.book?.digital_file_path),
  }));
  return NextResponse.json({ offers });
}
