import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { slugify } from '@/lib/format';

/**
 * Entrega al administrador una URL firmada para subir un archivo directo a Supabase Storage
 * (sin límite de tamaño del servidor). bucket: 'covers' (público) o 'book-files' (privado).
 */
export async function POST(req: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { bucket, filename } = await req.json().catch(() => ({}));
  if (!['covers', 'book-files'].includes(bucket) || typeof filename !== 'string') return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const ext = (filename.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const allowed = bucket === 'covers' ? ['jpg', 'jpeg', 'png', 'webp', 'avif'] : ['pdf', 'epub', 'mobi', 'zip', 'mp3', 'mp4'];
  if (!allowed.includes(ext)) return NextResponse.json({ error: `Formato no permitido. Usa: ${allowed.join(', ')}` }, { status: 400 });
  const base = slugify(filename.replace(/\.[^.]+$/, '')).slice(0, 60);
  const path = `${new Date().toISOString().slice(0, 10)}/${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const sb = createSupabaseAdmin();
  const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || 'No se pudo preparar la subida' }, { status: 500 });
  const publicUrl = bucket === 'covers' ? sb.storage.from('covers').getPublicUrl(path).data.publicUrl : null;
  return NextResponse.json({ path, token: data.token, publicUrl });
}
