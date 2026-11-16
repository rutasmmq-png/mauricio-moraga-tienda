import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { clean, clientIp, rateLimited } from '@/lib/rateLimit';

export async function POST(req: Request) {
  if (rateLimited(`review:${clientIp(req)}`, 3)) return NextResponse.json({ error: 'rate' }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true });
  const name = clean(b.name, 80), comment = clean(b.comment, 2000), rating = Math.round(Number(b.rating));
  if (!name || !comment || !(rating >= 1 && rating <= 5) || typeof b.bookId !== 'string') return NextResponse.json({ error: 'fields' }, { status: 400 });
  const sb = createSupabaseAdmin();
  const { data: book } = await sb.from('books').select('id').eq('id', b.bookId).eq('status', 'published').maybeSingle();
  if (!book) return NextResponse.json({ error: 'book' }, { status: 400 });
  await sb.from('reviews').insert({ book_id: book.id, name, comment, rating, approved: false });
  return NextResponse.json({ ok: true });
}
