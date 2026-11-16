import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { clean, clientIp, isEmail, rateLimited } from '@/lib/rateLimit';

export async function POST(req: Request) {
  if (rateLimited(`sub:${clientIp(req)}`, 5)) return NextResponse.json({ error: 'rate' }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  if (!isEmail(b.email)) return NextResponse.json({ error: 'email' }, { status: 400 });
  await createSupabaseAdmin().from('subscribers').upsert({ email: b.email.trim().toLowerCase(), locale: clean(b.locale, 5), source: clean(b.source, 40) }, { onConflict: 'email', ignoreDuplicates: true });
  return NextResponse.json({ ok: true });
}
