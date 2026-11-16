import Link from 'next/link';
import { CardBuyButton } from './BuyButtons';
import { coverSrc, formatPrice } from '@/lib/format';
import { localName, platformLabel, type Dict } from '@/lib/i18n';
import type { Book, Locale } from '@/lib/types';

export function bookPrice(book: Book) {
  const offers = (book.offers || []).filter((o) => o.price !== null && (o.platform !== 'direct' || o.active));
  const direct = offers.find((o) => o.platform === 'direct');
  const o = direct || offers.sort((a, z) => Number(a.price) - Number(z.price))[0];
  if (o) return { amount: Number(o.price), currency: o.currency, platform: o.platform, label: o.label };
  if (book.price !== null) return { amount: Number(book.price), currency: book.currency, platform: null, label: null };
  return null;
}

export function BookCard({ book, t, locale }: { book: Book; t: Dict; locale: Locale }) {
  const price = bookPrice(book);
  const platforms = Array.from(new Set((book.offers || []).map((o) => o.platform === 'other' ? o.label : platformLabel(t, o.platform)))).join(' · ');
  return (
    <article className="card">
      <Link href={`/libros/${book.slug}`} className="card-cover" aria-label={book.title}>
        {book.is_new ? <span className="ribbon">{t.book.new}</span> : null}
        <img src={coverSrc(book.cover_url)} alt={`${book.title} – portada`} loading="lazy" />
      </Link>
      <div className="card-body">
        <div className="chips">
          {book.language && <span className="chip">{localName(book.language, locale)}</span>}
          {book.formats?.length ? <span className="chip chip-outline">{book.formats.map((f) => t.formats[f] || f).join(' · ')}</span> : null}
        </div>
        <h3 className="card-title"><Link href={`/libros/${book.slug}`}>{book.title}</Link></h3>
        {book.subtitle && <p className="card-sub">{book.subtitle}</p>}
        {book.short_description && <p className="card-desc">{book.short_description}</p>}
        <div className="card-price">
          <span className="price">{price ? formatPrice(price.amount, price.currency, locale) : '—'}</span>
          <span className="small muted" style={{ textAlign: 'right' }}>{platforms}</span>
        </div>
        <div className="card-actions">
          <Link href={`/libros/${book.slug}`} className="btn btn-outline">{t.book.view}</Link>
          <CardBuyButton book={book} />
        </div>
      </div>
    </article>
  );
}
