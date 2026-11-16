import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDict, getLocale } from '@/lib/i18n';
import { getPost } from '@/lib/data';
import { createSupabaseServer } from '@/lib/supabase/server';
import { BookCard } from '@/components/BookCard';
import { ShareButtons } from '@/components/Forms';
import { paragraphs } from '@/lib/format';
import { SITE_URL } from '@/lib/site';
import type { Book } from '@/lib/types';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPost(params.slug);
  return p ? { title: p.title, description: p.excerpt || undefined, alternates: { canonical: `/novedades/${p.slug}` }, openGraph: { title: p.title, description: p.excerpt || undefined, images: p.cover_url ? [p.cover_url] : undefined } } : { title: 'Novedad' };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const post = await getPost(params.slug);
  if (!post) notFound();
  let book: Book | null = null;
  if (post.book_id) {
    const { data } = await createSupabaseServer().from('books').select('*, offers:sales_offers(*), category:categories(*), language:languages(*)').eq('id', post.book_id).eq('status', 'published').maybeSingle();
    book = data as unknown as Book | null;
    if (book) book.offers = (book.offers || []).filter((o) => o.active);
  }
  return (
    <section className="band light">
      <div className="container" style={{ maxWidth: 820 }}>
        <nav className="breadcrumb"><Link href="/novedades">{t.news.title}</Link></nav>
        <article className="stack">
          <h1 className="h-lg">{post.title}</h1>
          {post.published_at && <span className="small muted">{new Date(post.published_at).toLocaleDateString('es-CL')}</span>}
          {post.cover_url && <img src={post.cover_url} alt="" style={{ width: '100%', maxHeight: 460, objectFit: 'cover', background: 'var(--paper-2)' }} />}
          <div className="prose">{paragraphs(post.body).map((p, i) => <p key={i}>{p}</p>)}</div>
          <ShareButtons url={`${SITE_URL}/novedades/${post.slug}`} title={post.title} label={t.book.share} />
        </article>
        {book && (
          <div className="stack" style={{ marginTop: 48, maxWidth: 320 }}>
            <h2 className="h-md">{t.news.relatedBook}</h2>
            <BookCard book={book} t={t} locale={locale} />
          </div>
        )}
      </div>
    </section>
  );
}
