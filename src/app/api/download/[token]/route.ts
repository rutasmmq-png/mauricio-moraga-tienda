import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { slugify } from '@/lib/format';

export const dynamic = 'force-dynamic';

/** Entrega segura: valida el token (pagado, vigente, con descargas disponibles) y redirige a un enlace firmado de 60 s. */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  if (!/^[0-9a-f]{48}$/.test(params.token)) return new NextResponse('Enlace no válido', { status: 404 });
  const sb = createSupabaseAdmin();
  const { data, error } = await sb.rpc('use_download_token', { p_token: params.token });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return new NextResponse('Este enlace de descarga no es válido, venció o ya alcanzó el máximo de descargas. Escríbenos y te ayudamos.', { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const ext = (row.file_path.split('.').pop() || 'pdf').toLowerCase();
  const { data: signed, error: sErr } = await sb.storage.from('book-files').createSignedUrl(row.file_path, 60, { download: `${slugify(row.title)}.${ext}` });
  if (sErr || !signed) return new NextResponse('No pudimos preparar la descarga. Inténtalo en unos minutos.', { status: 500 });
  return NextResponse.redirect(signed.signedUrl, 302);
}
