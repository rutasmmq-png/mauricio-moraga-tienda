import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDict, getLocale, localName } from '@/lib/i18n';
import { getBookBySlug, getRelatedBooks, getReviews } from '@/lib/data';
import { BookCard, bookPrice } from '@/components/BookCard';
import { OfferList } from '@/components/BuyButtons';
import { ReviewForm, ShareButtons, TrackView } from '@/components/Forms';
import { coverSrc, formatPrice, paragraphs } from '@/lib/format';
import { SITE_URL } from '@/lib/site';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const b = await getBookBySlug(params.slug);
  if (!b) return { title: 'Libro no encontrado' };
  const title = b.seo_title || `${b.title}${b.subtitle ? ' – ' + b.subtitle : ''}`;
  const description = (b.seo_description || b.short_description || '').slice(0, 300);
  const image = b.cover_url ? (b.cover_url.startsWith('http') ? b.cover_url : `${SITE_URL}${b.cover_url}`) : undefined;
  return {
    title, description, alternates: { canonical: `/libros/${b.slug}` },
    openGraph: { title, description, type: 'book', url: `/libros/${b.slug}`, images: image ? [image] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  };
}

export default async function BookPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const t = getDict(locale);
  const book = await getBookBySlug(params.slug);
  if (!book) notFound();
  const [related, reviews] = await Promise.all([getRelatedBooks(book, 4), getReviews(book.id, 20)]);
  const price = bookPrice(book);
  const url = `${SITE_URL}/libros/${book.slug}`;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Book', name: book.title, alternativeHeadline: book.subtitle || undefined,
    author: { '@type': 'Person', name: book.author }, inLanguage: book.language_code || undefined,
    image: book.cover_url ? (book.cover_url.startsWith('http') ? book.cover_url : `${SITE_URL}${book.cover_url}`) : undefined,
    description: book.short_description || undefined, numberOfPages: book.pages || undefined, isbn: book.isbn || undefined, url,
    offers: (book.offers || []).filter((o) => o.price !== null).map((o) => ({
      '@type': 'Offer', price: Number(o.price), priceCurrency: o.currency, availability: 'https://schema.org/InStock',
      url: o.platform === 'direct' ? url : o.url, seller: { '@type': 'Organization', name: o.platform === 'direct' ? 'Mauricio Moraga' : o.platform },
    })),
    aggregateRating: reviews.length ? { '@type': 'AggregateRating', ratingValue: avg.toFixed(1), reviewCount: reviews.length } : undefined,
  };

  const specs: [string, string | null | undefined][] = [
    [t.book.author, book.author],
    [t.book.language, localName(book.language, locale)],
    [t.book.format, book.formats.map((f) => t.formats[f] || f).join(' · ')],
    [t.book.pages, book.pages ? String(book.pages) : null],
    [t.book.category, localName(book.category, locale)],
    [t.book.price, price ? formatPrice(price.amount, price.currency, locale) : null],
    [t.book.isbn, book.isbn],
    [t.book.published, book.published_on],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView name={book.title} value={price?.amount} currency={price?.currency} />
      <section className="band light">
        <div className="container">
          <nav className="breadcrumb" aria-label="Ruta"><Link href="/libros">{t.nav.books}</Link> / {book.title}</nav>
          <div className="book-hero">
            <div className="book-cover-lg"><img src={coverSrc(book.cover_url)} alt={`${book.title} – portada`} /></div>
            <div className="stack" style={{ gap: 24 }}>
              <div className="chips">
                {book.language && <span className="chip">{localName(book.language, locale)}</span>}
                {book.is_new && <span className="chip chip-outline">{t.book.new}</span>}
                {book.category && <span className="chip chip-outline">{localName(book.category, locale)}</span>}
              </div>
              <h1 className="h-lg" lang={book.language_code || undefined}>{book.title}</h1>
              {book.subtitle && <p className="quote" style={{ color: 'var(--muted-dark)' }} lang={book.language_code || undefined}>{book.subtitle}</p>}
              <p className="muted">{t.book.author}: <strong style={{ color: 'var(--ink-2)' }}>{book.author}</strong></p>
              {book.short_description && <p style={{ fontSize: 18 }} lang={book.language_code || undefined}>{book.short_description}</p>}
              <div className="stack" style={{ gap: 12 }}>
                <h2 className="h-md">{t.book.buyOptions}</h2>
                <OfferList book={book} />
              </div>
              <dl className="specs">
                {specs.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
              <ShareButtons url={url} title={book.title} label={t.book.share} />
            </div>
          </div>
        </div>
      </section>

      {(book.long_description || book.contents) && (
        <section className="band" style={{ background: 'var(--white)' }}>
          <div className="container split" style={{ alignItems: 'start' }}>
            {book.long_description && (
              <div className="stack prose" lang={book.language_code || undefined}>
                <h2 className="h-md">{t.book.description}</h2>
                <div>{paragraphs(book.long_description).map((p, i) => <p key={i}>{p}</p>)}</div>
              </div>
            )}
            {book.contents && (
              <div className="stack prose" lang={book.language_code || undefined}>
                <h2 className="h-md">{t.book.contents}</h2>
                <div>{paragraphs(book.contents).map((p, i) => <p key={i}>{p}</p>)}</div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="band light">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div className="stack">
            <h2 className="h-md">{t.book.reviews}{reviews.length ? ` · ${avg.toFixed(1)} ★` : ''}</h2>
            {reviews.length ? reviews.map((r) => (
              <figure key={r.id} className="review" style={{ margin: 0, background: 'var(--white)', borderColor: 'var(--line)' }}>
                <div className="stars" aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}<span style={{ color: '#d9cdb5' }}>{'★'.repeat(5 - r.rating)}</span></div>
                <blockquote style={{ margin: 0 }}>{r.comment}</blockquote>
                <figcaption className="small muted">— {r.name}</figcaption>
              </figure>
            )) : <p className="muted">{t.book.noReviews}</p>}
          </div>
          <ReviewForm bookId={book.id} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="band" style={{ background: 'var(--paper-2)' }}>
          <div className="container">
            <h2 className="h-lg" style={{ marginBottom: 32 }}>{t.book.related}</h2>
            <div className="grid-books">{related.map((b) => <BookCard key={b.id} book={b} t={t} locale={locale} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
