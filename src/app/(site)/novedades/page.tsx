import Link from 'next/link';
import type { Metadata } from 'next';
import { getDict, getLocale } from '@/lib/i18n';
import { getPosts } from '@/lib/data';
import { coverSrc } from '@/lib/format';

export const metadata: Metadata = { title: 'Novedades editoriales', description: 'Lanzamientos, nuevas ediciones y noticias de los libros de Mauricio Moraga.', alternates: { canonical: '/novedades' } };

export default async function NewsPage() {
  const t = getDict(getLocale());
  const posts = await getPosts(60);
  return (
    <section className="band light">
      <div className="container">
        <h1 className="h-lg" style={{ marginBottom: 32 }}>{t.news.title}</h1>
        {posts.length ? (
          <div className="posts">
            {posts.map((p) => (
              <Link key={p.id} href={`/novedades/${p.slug}`} className="post">
                <img src={coverSrc(p.cover_url)} alt="" loading="lazy" />
                <div>
                  <span className="small muted">{p.published_at ? new Date(p.published_at).toLocaleDateString('es-CL') : ''}</span>
                  <h2 className="h-md">{p.title}</h2>
                  {p.excerpt && <p className="muted">{p.excerpt}</p>}
                  <span className="link small">{t.news.read} →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : <p className="empty">{t.news.empty}</p>}
      </div>
    </section>
  );
}
