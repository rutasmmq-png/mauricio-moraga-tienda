'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServer } from '@/lib/supabase/server';
import { slugify } from '@/lib/format';

const str = (v: FormDataEntryValue | null, max = 20000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const nul = (v: FormDataEntryValue | null, max = 20000) => str(v, max) || null;
const num = (v: FormDataEntryValue | null) => { const s = str(v).replace(',', '.'); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; };
const refresh = () => { revalidatePath('/', 'layout'); };

export type ActionResult = { ok: boolean; message?: string; id?: string };

// ─────────────── Libros ───────────────
interface OfferInput { id?: string; platform: string; label: string; format: string; url: string; price: string; currency: string; delivery: string; stock: string; active: boolean }

export async function saveBook(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const sb = createSupabaseAdmin();
  const id = str(fd.get('id'));
  const title = str(fd.get('title'), 300);
  if (!title) return { ok: false, message: 'El título es obligatorio.' };
  let slug = slugify(str(fd.get('slug'), 120) || title);
  const { data: clash } = await sb.from('books').select('id').eq('slug', slug).maybeSingle();
  if (clash && clash.id !== id) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const book = {
    slug, title,
    subtitle: nul(fd.get('subtitle'), 400),
    author: str(fd.get('author'), 200) || 'Mauricio Moraga Quezada',
    short_description: nul(fd.get('short_description'), 1000),
    long_description: nul(fd.get('long_description')),
    contents: nul(fd.get('contents')),
    cover_url: nul(fd.get('cover_url'), 1000),
    language_code: nul(fd.get('language_code'), 10),
    category_id: nul(fd.get('category_id'), 40),
    pages: num(fd.get('pages')),
    formats: fd.getAll('formats').map(String),
    price: num(fd.get('price')),
    currency: str(fd.get('currency'), 3) || 'USD',
    status: fd.get('status') === 'published' ? 'published' : 'draft',
    featured: fd.get('featured') === 'on',
    is_new: fd.get('is_new') === 'on',
    isbn: nul(fd.get('isbn'), 40),
    published_on: nul(fd.get('published_on'), 10),
    digital_file_path: nul(fd.get('digital_file_path'), 500),
    seo_title: nul(fd.get('seo_title'), 200),
    seo_description: nul(fd.get('seo_description'), 400),
    sort: num(fd.get('sort')) ?? 0,
  };

  let bookId = id;
  if (id) {
    const { error } = await sb.from('books').update(book).eq('id', id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { data, error } = await sb.from('books').insert(book).select('id').single();
    if (error || !data) return { ok: false, message: error?.message || 'No se pudo crear' };
    bookId = data.id;
  }

  // Enlaces / opciones de venta
  let offers: OfferInput[] = [];
  try { offers = JSON.parse(str(fd.get('offers_json'), 200000) || '[]'); } catch { return { ok: false, message: 'Error en los enlaces de venta.' }; }
  const keep: string[] = [];
  for (const [i, o] of offers.entries()) {
    const row = {
      book_id: bookId, platform: (o.platform || 'other').slice(0, 30), label: (o.label || 'Comprar').slice(0, 120),
      format: o.format || null, url: o.url?.trim() || null, price: o.price === '' || o.price == null ? null : Number(String(o.price).replace(',', '.')),
      currency: (o.currency || 'USD').slice(0, 3).toUpperCase(), delivery: o.delivery === 'physical' ? 'physical' : 'digital',
      stock: o.stock === '' || o.stock == null ? null : Math.max(0, Math.floor(Number(o.stock))), active: !!o.active, sort: i,
    };
    if (row.platform !== 'direct' && row.url && !/^https?:\/\//i.test(row.url)) return { ok: false, message: `El enlace de "${row.label}" debe comenzar con https://` };
    if (row.platform !== 'direct' && row.active && !row.url) return { ok: false, message: `"${row.label}" está activo pero no tiene enlace.` };
    if (row.platform === 'direct' && row.active && row.price === null) return { ok: false, message: `"${row.label}" (compra directa) necesita precio para activarse.` };
    if (row.platform === 'direct' && row.active && row.delivery === 'digital' && !book.digital_file_path) return { ok: false, message: 'Para vender en forma directa un libro digital, primero sube el archivo del libro.' };
    if (o.id) {
      const { error } = await sb.from('sales_offers').update(row).eq('id', o.id).eq('book_id', bookId);
      if (error) return { ok: false, message: error.message };
      keep.push(o.id);
    } else {
      const { data, error } = await sb.from('sales_offers').insert(row).select('id').single();
      if (error || !data) return { ok: false, message: error?.message };
      keep.push(data.id);
    }
  }
  const del = sb.from('sales_offers').delete().eq('book_id', bookId);
  await (keep.length ? del.not('id', 'in', `(${keep.join(',')})`) : del);

  refresh();
  if (!id) redirect(`/admin/libros/${bookId}?creado=1`);
  return { ok: true, message: 'Cambios guardados.', id: bookId };
}

export async function setBookFlag(fd: FormData) {
  await requireAdmin();
  const id = str(fd.get('id'));
  const field = str(fd.get('field'));
  const value = str(fd.get('value'));
  const patch: Record<string, unknown> = field === 'status' ? { status: value === 'published' ? 'published' : 'draft' } : field === 'featured' ? { featured: value === 'true' } : {};
  if (Object.keys(patch).length) await createSupabaseAdmin().from('books').update(patch).eq('id', id);
  refresh();
}

export async function deleteBook(fd: FormData) {
  await requireAdmin();
  const sb = createSupabaseAdmin();
  const id = str(fd.get('id'));
  const { count } = await sb.from('order_items').select('id', { count: 'exact', head: true }).eq('book_id', id);
  if (count) { await sb.from('books').update({ status: 'draft' }).eq('id', id); } // con ventas: se archiva, no se borra
  else await sb.from('books').delete().eq('id', id);
  refresh();
  redirect('/admin/libros');
}

// ─────────────── Categorías e idiomas ───────────────
export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const id = str(fd.get('id'));
  const name_es = str(fd.get('name_es'), 120);
  if (!name_es) return;
  const row = { name_es, name_en: str(fd.get('name_en'), 120) || name_es, name_hi: str(fd.get('name_hi'), 120) || name_es, slug: slugify(str(fd.get('slug'), 120) || name_es), sort: num(fd.get('sort')) ?? 0 };
  const sb = createSupabaseAdmin();
  if (id) await sb.from('categories').update(row).eq('id', id); else await sb.from('categories').insert(row);
  refresh();
}
export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  await createSupabaseAdmin().from('categories').delete().eq('id', str(fd.get('id')));
  refresh();
}
export async function saveLanguage(fd: FormData) {
  await requireAdmin();
  const code = str(fd.get('code'), 10).toLowerCase().replace(/[^a-z-]/g, '');
  const name_es = str(fd.get('name_es'), 80);
  if (!code || !name_es) return;
  await createSupabaseAdmin().from('languages').upsert({ code, name_es, name_en: str(fd.get('name_en'), 80) || name_es, name_hi: str(fd.get('name_hi'), 80) || name_es, active: fd.get('active') === 'on', sort: num(fd.get('sort')) ?? 0 }, { onConflict: 'code' });
  refresh();
}
export async function deleteLanguage(fd: FormData) {
  await requireAdmin();
  const sb = createSupabaseAdmin();
  const code = str(fd.get('code'));
  const { count } = await sb.from('books').select('id', { count: 'exact', head: true }).eq('language_code', code);
  if (count) await sb.from('languages').update({ active: false }).eq('code', code);
  else await sb.from('languages').delete().eq('code', code);
  refresh();
}

// ─────────────── Pedidos ───────────────
export async function updateOrder(fd: FormData) {
  await requireAdmin();
  const id = str(fd.get('id'));
  const fs = str(fd.get('fulfillment_status'));
  await createSupabaseAdmin().from('orders').update({
    fulfillment_status: ['none', 'pending', 'shipped', 'delivered'].includes(fs) ? fs : undefined,
    tracking_info: nul(fd.get('tracking_info'), 500), notes: nul(fd.get('notes'), 4000),
  }).eq('id', id);
  revalidatePath(`/admin/pedidos/${id}`);
}
export async function resetDownloads(fd: FormData) {
  await requireAdmin();
  const orderId = str(fd.get('order_id'));
  const sb = createSupabaseAdmin();
  const { data: items } = await sb.from('order_items').select('id').eq('order_id', orderId);
  const ids = (items || []).map((i) => i.id);
  if (ids.length) await sb.from('download_tokens').update({ downloads: 0, expires_at: new Date(Date.now() + 30 * 864e5).toISOString() }).in('order_item_id', ids);
  revalidatePath(`/admin/pedidos/${orderId}`);
}

// ─────────────── Reseñas, mensajes, suscriptores ───────────────
export async function moderateReview(fd: FormData) {
  await requireAdmin();
  const sb = createSupabaseAdmin();
  const id = str(fd.get('id'));
  if (fd.get('action') === 'delete') await sb.from('reviews').delete().eq('id', id);
  else await sb.from('reviews').update({ approved: fd.get('action') === 'approve' }).eq('id', id);
  refresh();
}
export async function addReview(fd: FormData) {
  await requireAdmin();
  const rating = Math.min(5, Math.max(1, Math.round(num(fd.get('rating')) || 5)));
  const name = str(fd.get('name'), 80), comment = str(fd.get('comment'), 2000);
  if (!name || !comment) return;
  await createSupabaseAdmin().from('reviews').insert({ book_id: nul(fd.get('book_id')), name, comment, rating, approved: true });
  refresh();
}
export async function messageAction(fd: FormData) {
  await requireAdmin();
  const sb = createSupabaseAdmin();
  const id = str(fd.get('id'));
  if (fd.get('action') === 'delete') await sb.from('messages').delete().eq('id', id);
  else await sb.from('messages').update({ read: true }).eq('id', id);
  revalidatePath('/admin/mensajes');
}
export async function deleteSubscriber(fd: FormData) {
  await requireAdmin();
  await createSupabaseAdmin().from('subscribers').delete().eq('id', str(fd.get('id')));
  revalidatePath('/admin/suscriptores');
}

// ─────────────── Novedades ───────────────
export async function savePost(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const sb = createSupabaseAdmin();
  const id = str(fd.get('id'));
  const title = str(fd.get('title'), 300);
  if (!title) return { ok: false, message: 'El título es obligatorio.' };
  let slug = slugify(str(fd.get('slug'), 120) || title);
  const { data: clash } = await sb.from('posts').select('id').eq('slug', slug).maybeSingle();
  if (clash && clash.id !== id) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const row = {
    title, slug, excerpt: nul(fd.get('excerpt'), 600), body: nul(fd.get('body')), cover_url: nul(fd.get('cover_url'), 1000),
    book_id: nul(fd.get('book_id'), 40), published: fd.get('published') === 'on',
    published_at: nul(fd.get('published_at'), 30) || new Date().toISOString(),
  };
  if (id) { const { error } = await sb.from('posts').update(row).eq('id', id); if (error) return { ok: false, message: error.message }; }
  else {
    const { data, error } = await sb.from('posts').insert(row).select('id').single();
    if (error || !data) return { ok: false, message: error?.message };
    refresh(); redirect(`/admin/novedades/${data.id}`);
  }
  refresh();
  return { ok: true, message: 'Novedad guardada.' };
}
export async function deletePost(fd: FormData) {
  await requireAdmin();
  await createSupabaseAdmin().from('posts').delete().eq('id', str(fd.get('id')));
  refresh();
  redirect('/admin/novedades');
}

// ─────────────── Ajustes ───────────────
export async function saveSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const rows: { key: string; value: string }[] = [];
  fd.forEach((v, k) => { if (k.startsWith('s:')) rows.push({ key: k.slice(2).slice(0, 80), value: String(v).trim().slice(0, 20000) }); });
  const { error } = await createSupabaseAdmin().from('settings').upsert(rows, { onConflict: 'key' });
  refresh();
  return error ? { ok: false, message: error.message } : { ok: true, message: 'Ajustes guardados.' };
}

export async function signOut() {
  await createSupabaseServer().auth.signOut();
  redirect('/admin/login');
}
