'use client';
import { useCart } from './CartProvider';
import { useI18n } from './I18nProvider';
import { track } from './track';
import { formatPrice } from '@/lib/format';
import type { Book, Offer } from '@/lib/types';
import { PLATFORMS, platformName as pName } from '@/lib/site';


export function offerToCartItem(book: Book, o: Offer) {
  return { offerId: o.id, bookId: book.id, slug: book.slug, title: book.title, label: o.label, cover: book.cover_url, delivery: o.delivery, price: Number(o.price), currency: o.currency };
}

function platformName(o: Offer) { return o.platform === 'books2read' ? 'Books2Read' : pName(o.platform, o.label); }
function btnStyle(o: Offer) { const c = PLATFORMS[o.platform] || PLATFORMS.other; return { background: c.bg, color: c.fg }; }
export function isBuyable(o: Offer) {
  if (o.platform === 'direct') return o.price !== null && (o.delivery === 'digital' || o.stock === null || o.stock > 0);
  return !!o.url;
}

/** Botón principal de compra de una tarjeta: compra directa → carrito; externa → abre la plataforma. */
export function CardBuyButton({ book }: { book: Book }) {
  const { t } = useI18n();
  const { add } = useCart();
  const offers = (book.offers || []).filter(isBuyable);
  const direct = offers.find((o) => o.platform === 'direct');
  if (direct) {
    return <button type="button" className="btn btn-dark" onClick={() => add(offerToCartItem(book, direct))}>{t.book.addToCart}</button>;
  }
  const ext = offers.find((o) => o.platform !== 'direct');
  if (ext) {
    return (
      <a className="btn btn-dark" href={ext.url!} target="_blank" rel="noopener noreferrer"
        onClick={() => track('click_external', { platform: ext.platform, item_name: book.title, label: ext.label })}>
        {ext.platform === 'books2read' ? t.book.chooseStore : `${t.book.buyOn} ${platformName(ext)}`} ↗
      </a>
    );
  }
  return <span className="btn btn-outline" aria-disabled="true" style={{ opacity: .6, cursor: 'default' }}>{t.book.unavailable.split('.')[0]}</span>;
}

/** Lista completa de opciones de compra en la ficha: cada enlace con su propio botón. */
export function OfferList({ book }: { book: Book }) {
  const { t, locale } = useI18n();
  const { add } = useCart();
  const offers = book.offers || [];
  if (!offers.length) return <p className="alert alert-info">{t.book.unavailable}</p>;
  return (
    <div className="offers">
      {offers.map((o) => {
        const ok = isBuyable(o);
        const soldOut = o.platform === 'direct' && o.delivery === 'physical' && o.stock !== null && o.stock <= 0;
        return (
          <div className="offer" key={o.id}>
            <div>
              <div className="offer-name">{o.label} {o.price !== null && <span className="price" style={{ fontSize: 18, marginLeft: 8 }}>{formatPrice(Number(o.price), o.currency, locale)}</span>}</div>
              <div className="offer-note">
                {o.platform === 'direct'
                  ? `${t.book.directSale} · ${o.delivery === 'digital' ? t.book.digitalDelivery : t.book.physicalDelivery}`
                  : o.platform === 'books2read' ? t.book.allStores : `${t.book.externalSale} ${platformName(o)}`}
              </div>
            </div>
            {o.platform === 'direct' ? (
              <button type="button" className="btn btn-dark" disabled={!ok} onClick={() => add(offerToCartItem(book, o))}>
                {soldOut ? t.book.outOfStock : t.book.addToCart}
              </button>
            ) : ok ? (
              <a className="btn" style={btnStyle(o)}
                href={o.url!} target="_blank" rel="noopener noreferrer"
                onClick={() => track('click_external', { platform: o.platform, item_name: book.title, label: o.label, value: o.price, currency: o.currency })}>
                {o.platform === 'books2read' ? t.book.chooseStore : `${t.book.buyOn} ${platformName(o)}`} ↗
              </a>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
