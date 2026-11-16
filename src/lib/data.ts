import 'server-only';
import { cache } from 'react';
import { createSupabaseServer } from './supabase/server';
import type { Book, Category, Language, Post, Review, Settings } from './types';

const BOOK_SELECT = '*, offers:sales_offers(*), category:categories(*), language:languages(*)';

function sortOffers(b: Book): Book {
  b.offers = (b.offers || []).filter((o) => o.active).sort((a, z) => a.sort - z.sort);
  return b;
}

export const getSettings = cache(async (): Promise<Settings> => {
  const sb = createSupabaseServer();
  const { data } = await sb.from('settings').select('key,value');
  return Object.fromEntries((data || []).map((r: { key: string; value: string | null }) => [r.key, r.value || '']));
});

export const getLanguages = cache(async (): Promise<Language[]> => {
  const { data } = await createSupabaseServer().from('languages').select('*').eq('active', true).order('sort');
  return (data || []) as Language[];
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data } = await createSupabaseServer().from('categories').select('*').order('sort');
  return (data || []) as Category[];
});

export interface CatalogQuery { lang?: string; cat?: string; format?: string; platform?: string; q?: string; page?: number }
export const PAGE_SIZE = 24;

export async function getCatalog(f: CatalogQuery) {
  const sb = createSupabaseServer();
  const select = f.platform
    ? '*, offers:sales_offers!inner(*), category:categories(*), language:languages(*)'
    : BOOK_SELECT;
  let q = sb.from('books').select(select, { count: 'exact' }).eq('status', 'published');
  if (f.lang) q = q.eq('language_code', f.lang);
  if (f.format) q = q.contains('formats', [f.format]);
  if (f.platform) q = q.eq('offers.platform', f.platform).eq('offers.active', true);
  if (f.q) q = q.or(`title.ilike.%${f.q.replace(/[%,()]/g, '')}%,subtitle.ilike.%${f.q.replace(/[%,()]/g, '')}%`);
  if (f.cat) {
    const { data: c } = await sb.from('categories').select('id').eq('slug', f.cat).maybeSingle();
    if (!c) return { books: [] as Book[], count: 0 };
    q = q.eq('category_id', c.id);
  }
  const page = Math.max(1, f.page || 1);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await q.order('featured', { ascending: false }).order('sort').order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  return { books: ((data || []) as unknown as Book[]).map(sortOffers), count: count || 0 };
}

export async function getFeaturedBooks(limit = 8) {
  const { data } = await createSupabaseServer().from('books').select(BOOK_SELECT)
    .eq('status', 'published').eq('featured', true).order('sort').limit(limit);
  return ((data || []) as unknown as Book[]).map(sortOffers);
}

export async function getNewBooks(limit = 4) {
  const { data } = await createSupabaseServer().from('books').select(BOOK_SELECT)
    .eq('status', 'published').eq('is_new', true).order('updated_at', { ascending: false }).limit(limit);
  return ((data || []) as unknown as Book[]).map(sortOffers);
}

export async function getAllPublishedBooks() {
  const { data } = await createSupabaseServer().from('books').select(BOOK_SELECT).eq('status', 'published').order('sort');
  return ((data || []) as unknown as Book[]).map(sortOffers);
}

export const getBookBySlug = cache(async (slug: string): Promise<Book | null> => {
  const { data } = await createSupabaseServer().from('books').select(BOOK_SELECT).eq('slug', slug).maybeSingle();
  return data ? sortOffers(data as unknown as Book) : null;
});

export async function getRelatedBooks(book: Book, limit = 4) {
  const sb = createSupabaseServer();
  const { data } = await sb.from('books').select(BOOK_SELECT).eq('status', 'published').neq('id', book.id).order('featured', { ascending: false }).order('sort').limit(30);
  const all = ((data || []) as unknown as Book[]).map(sortOffers);
  const score = (b: Book) => (b.category_id && b.category_id === book.category_id ? 2 : 0) + (b.language_code === book.language_code ? 1 : 0);
  return all.sort((a, z) => score(z) - score(a)).slice(0, limit);
}

export async function getReviews(bookId?: string, limit = 12) {
  let q = createSupabaseServer().from('reviews').select('*').eq('approved', true).order('created_at', { ascending: false }).limit(limit);
  if (bookId) q = q.eq('book_id', bookId);
  const { data } = await q;
  return (data || []) as Review[];
}

export async function getPosts(limit = 20) {
  const { data } = await createSupabaseServer().from('posts').select('*').eq('published', true).order('published_at', { ascending: false }).limit(limit);
  return (data || []) as Post[];
}

export async function getPost(slug: string) {
  const { data } = await createSupabaseServer().from('posts').select('*').eq('slug', slug).eq('published', true).maybeSingle();
  return (data || null) as Post | null;
}

/** Plataformas que tienen al menos una opción de venta activa (para el filtro del catálogo). */
export const getActivePlatforms = cache(async (): Promise<string[]> => {
  const { data } = await createSupabaseServer().from('sales_offers').select('platform').eq('active', true);
  const order = ['direct', 'amazon', 'hotmart', 'books2read', 'apple', 'kobo', 'bn', 'googleplay', 'everand', 'smashwords', 'tolino', 'overdrive', 'bookshop', 'draft2digital', 'other'];
  const set = Array.from(new Set((data || []).map((r: { platform: string }) => r.platform)));
  return set.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
});
