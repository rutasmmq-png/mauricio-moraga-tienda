import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { clean, clientIp, isEmail, rateLimited } from '@/lib/rateLimit';
import { emailLayout, escapeHtml, sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  if (rateLimited(`contact:${clientIp(req)}`, 3)) return NextResponse.json({ error: 'rate' }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  if (b.website) return NextResponse.json({ ok: true }); // trampa anti-spam
  const name = clean(b.name, 120), email = clean(b.email, 200), subject = clean(b.subject, 200), body = clean(b.body, 5000);
  if (!name || !isEmail(email) || !body) return NextResponse.json({ error: 'fields' }, { status: 400 });
  const sb = createSupabaseAdmin();
  await sb.from('messages').insert({ name, email, subject, body });
  const { data: s } = await sb.from('settings').select('key,value').in('key', ['admin_notification_email', 'contact_email']);
  const to = s?.find((r) => r.key === 'admin_notification_email')?.value || s?.find((r) => r.key === 'contact_email')?.value;
  if (to) await sendEmail({ to, replyTo: email, subject: `Contacto web: ${subject || name}`, html: emailLayout('Nuevo mensaje de contacto', `<p><strong>${escapeHtml(name)}</strong> · ${escapeHtml(email)}</p><p>${escapeHtml(body).replace(/\n/g, '<br>')}</p>`) });
  return NextResponse.json({ ok: true });
}
