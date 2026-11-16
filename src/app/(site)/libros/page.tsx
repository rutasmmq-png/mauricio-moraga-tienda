import Link from 'next/link';
import type { Metadata } from 'next';
import { getDict, getLocale, localName, platformLabel } from '@/lib/i18n';
import { getActivePlatforms, getCatalog, getCategories, getLanguages, PAGE_SIZE } from '@/lib/data';
import { BookCard } from '@/components/BookCard';
import { FORMATS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Libros',
  description: 'Catálogo completo de libros de Mauricio Moraga Quezada en español, inglés e hindi. Kindle, PDF, digital e impreso.',
  alternates: { canonical: '/libros' },
};

type SP = { lang?: string; cat?: string; format?: string; platform?: string; q?: string; page?: string };

export default async function CatalogPage({ searchParams }: { searchParams: SP }) {
  const locale = getLocale();
  const t = getDict(locale);
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const [langs, cats, platforms, { books, count }] = await Promise.all([
    getLanguages(), getCategories(), getActivePlatforms(),
    getCatalog({ lang: searchParams.lang, cat: searchParams.cat, format: searchParams.format, platform: searchParams.platform, q: searchParams.q?.slice(0, 80), page }),
  ]);
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const href = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { ...searchParams, ...patch, page: patch.page };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    const qs = p.toString();
    return `/libros${qs ? `?${qs}` : ''}`;
  };
  const group = (title: string, key: keyof SP, options: { value: string; label: string }[]) => (
    <div>
      <h3>{title}</h3>
      <div className="filter-list">
        <Link href={href({ [key]: undefined })} aria-current={!searchParams[key] ? 'true' : undefined}>{t.catalog.all}</Link>
        {options.map((o) => (
          <Link key={o.value} href={href({ [key]: o.value })} aria-current={searchParams[key] === o.value ? 'true' : undefined}>{o.label}</Link>
        ))}
      </div>
    </div>
  );
  const hasFilters = !!(searchParams.lang || searchParams.cat || searchParams.format || searchParams.platform || searchParams.q);

  return (
    <section className="band light">
      <div className="container">
        <div className="section-head">
          <div className="stack" style={{ gap: 10 }}>
            <h1 className="h-lg">{t.catalog.title}</h1>
            <p className="muted">{t.catalog.subtitle}</p>
          </div>
          <form action="/libros" className="row" style={{ gap: 8 }} role="search">
            {(['lang', 'cat', 'format', 'platform'] as const).map((k) => searchParams[k] ? <input key={k} type="hidden" name={k} value={searchParams[k]} /> : null)}
            <label htmlFor="q" className="visually-hidden">{t.catalog.search}</label>
            <input id="q" name="q" defaultValue={searchParams.q || ''} className="input" placeholder={t.catalog.search} style={{ width: 240 }} />
            <button className="btn btn-dark">{t.catalog.search.split(' ')[0]}</button>
          </form>
        </div>
        <div className="catalog">
          <aside className="filters" aria-label={t.catalog.filters}>
            {group(t.catalog.language, 'lang', langs.map((l) => ({ value: l.code, label: localName(l, locale) })))}
            {group(t.catalog.category, 'cat', cats.map((c) => ({ value: c.slug, label: localName(c, locale) })))}
            {group(t.catalog.format, 'format', FORMATS.map((f) => ({ value: f, label: t.formats[f] })))}
            {group(t.catalog.platform, 'platform', platforms.map((p) => ({ value: p, label: platformLabel(t, p) })))}
            {hasFilters && <Link href="/libros" className="link small">{t.catalog.clear}</Link>}
          </aside>
          <div>
            <p className="small muted" style={{ marginBottom: 16 }}>{count} {t.catalog.results}</p>
            {books.length ? (
              <div className="grid-books" style={{ gridTemplateColumns: undefined }}>
                {books.map((b) => <BookCard key={b.id} book={b} t={t} locale={locale} />)}
              </div>
            ) : <p className="empty">{t.catalog.empty}</p>}
            {pages > 1 && (
              <nav className="pager" aria-label="Paginación">
                {page > 1 && <Link className="btn btn-outline btn-sm" href={href({ page: String(page - 1) })}>← {t.catalog.prev}</Link>}
                <span className="small muted" style={{ alignSelf: 'center' }}>{page} / {pages}</span>
                {page < pages && <Link className="btn btn-outline btn-sm" href={href({ page: String(page + 1) })}>{t.catalog.next} →</Link>}
              </nav>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
