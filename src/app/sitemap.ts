import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = ['', '/libros', '/autor', '/novedades', '/contacto'].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.8 }));
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const [{ data: books }, { data: posts }] = await Promise.all([
      sb.from('books').select('slug, updated_at').eq('status', 'published'),
      sb.from('posts').select('slug, published_at').eq('published', true),
    ]);
    return [
      ...base,
      ...(books || []).map((b) => ({ url: `${SITE_URL}/libros/${b.slug}`, lastModified: b.updated_at, priority: 0.9 })),
      ...(posts || []).map((p) => ({ url: `${SITE_URL}/novedades/${p.slug}`, lastModified: p.published_at || undefined, priority: 0.6 })),
    ];
  } catch { return base; }
}
