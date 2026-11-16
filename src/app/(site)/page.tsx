import Link from 'next/link';
import { getDict, getLocale, setting } from '@/lib/i18n';
import { getFeaturedBooks, getNewBooks, getPosts, getReviews, getSettings } from '@/lib/data';
import { BookCard } from '@/components/BookCard';
import { NewsletterForm } from '@/components/Forms';
import { Credentials } from '@/components/Credentials';
import { coverSrc, paragraphs } from '@/lib/format';
import { SITE_URL } from '@/lib/site';

export default async function HomePage() {
  const locale = getLocale();
  const t = getDict(locale);
  const [s, featured, fresh, posts, reviews] = await Promise.all([getSettings(), getFeaturedBooks(8), getNewBooks(2), getPosts(3), getReviews(undefined, 6)]);
  const fan = featured.filter((b) => b.cover_url).slice(0, 3);
  const firstAmazon = featured.flatMap((b) => b.offers || []).find((o) => o.platform === 'amazon' && o.url);
  const bio = paragraphs(setting(s, 'author_bio', locale));

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Person', name: 'Mauricio Moraga Quezada', url: SITE_URL,
    jobTitle: 'Author', alumniOf: ['Universidad Santo Tomás', 'Instituto Bíblico Nacional', 'Rosen Institute'],
    sameAs: [s.facebook_url, s.instagram_url, s.youtube_url, s.amazon_author_url].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero">
        <div className="container hero-grid">
          <div className="stack" style={{ gap: 26 }}>
            <span className="kicker">{setting(s, 'hero_kicker', locale)}</span>
            <h1 className="h-xl">Mauricio<br />Moraga</h1>
            {setting(s, 'hero_quote', locale) && <p className="quote">“{setting(s, 'hero_quote', locale)}”</p>}
            <p className="lead">{setting(s, 'hero_intro', locale)}</p>
            <div className="row">
              <Link href="/libros" className="btn btn-gold">{t.hero.catalog}</Link>
              {firstAmazon
                ? <a href={firstAmazon.url!} target="_blank" rel="noopener noreferrer" className="btn btn-outline">{t.book.buyOn} Amazon ↗</a>
                : <a href="#destacados" className="btn btn-outline">{t.hero.featuredBuy}</a>}
            </div>
          </div>
          {fan.length > 0 && (
            <div className="fan" aria-hidden="true">
              {fan[1] && <img className="f1" src={coverSrc(fan[1].cover_url)} alt="" />}
              {fan[2] && <img className="f2" src={coverSrc(fan[2].cover_url)} alt="" />}
              <img className="f3" src={coverSrc(fan[0].cover_url)} alt="" style={{ aspectRatio: '3/4' }} />
              <div className="fan-cap">{t.hero.available}</div>
            </div>
          )}
        </div>
      </section>

      <section id="destacados" className="band light">
        <div className="container">
          <div className="section-head">
            <div className="stack" style={{ gap: 10 }}>
              <h2 className="h-lg">{t.home.featured}</h2>
              <p className="muted">{t.home.featuredSub}</p>
            </div>
            <Link href="/libros" className="btn btn-outline">{t.home.allBooks}</Link>
          </div>
          {featured.length ? (
            <div className="grid-books">{featured.map((b) => <BookCard key={b.id} book={b} t={t} locale={locale} />)}</div>
          ) : <p className="empty">{t.catalog.empty}</p>}
          <p className="small muted" style={{ marginTop: 18 }}>{t.cart.note}</p>
        </div>
      </section>

      {(fresh.length > 0 || posts.length > 0) && (
        <section className="band dark">
          <div className="container split">
            {fresh.length > 0 && (
              <div className="row" style={{ justifyContent: 'center', gap: 20, flexWrap: 'nowrap' }}>
                {fresh.map((b, i) => (
                  <Link key={b.id} href={`/libros/${b.slug}`} style={{ width: '46%', marginTop: i ? 40 : 0 }}>
                    <img src={coverSrc(b.cover_url)} alt={b.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', boxShadow: '0 30px 60px rgba(0,0,0,.6)' }} />
                  </Link>
                ))}
              </div>
            )}
            <div className="stack">
              <span className="kicker">{t.home.news}</span>
              {posts[0] ? (
                <>
                  <h2 className="h-lg">{posts[0].title}</h2>
                  {posts[0].excerpt && <p className="lead">{posts[0].excerpt}</p>}
                  <div className="row">
                    <Link href={`/novedades/${posts[0].slug}`} className="btn btn-gold">{t.news.read}</Link>
                    <Link href="/novedades" className="btn btn-outline">{t.home.allNews}</Link>
                  </div>
                </>
              ) : fresh[0] && (
                <>
                  <h2 className="h-lg">{fresh[0].title}</h2>
                  {fresh[0].short_description && <p className="lead">{fresh[0].short_description}</p>}
                  <div className="row"><Link href={`/libros/${fresh[0].slug}`} className="btn btn-gold">{t.book.view}</Link></div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="band light">
        <div className="container split" style={{ gridTemplateColumns: 'minmax(0,.8fr) minmax(0,1.2fr)' }}>
          <div className="author-photo">
            {s.author_photo_url
              ? <img src={s.author_photo_url} alt="Mauricio Moraga Quezada" />
              : <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#9a8460" strokeWidth="1.2" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>}
          </div>
          <div className="stack">
            <span className="kicker">{t.home.aboutKicker}</span>
            <h2 className="h-lg">Mauricio Moraga Quezada</h2>
            {bio[0] && <p style={{ fontSize: 17, lineHeight: 1.65 }}>{bio[0]}</p>}
            <Credentials locale={locale} />
            <Link href="/autor" className="btn btn-outline" style={{ alignSelf: 'flex-start' }}>{t.home.aboutCta}</Link>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="band dark-2">
          <div className="container">
            <h2 className="h-lg" style={{ marginBottom: 32 }}>{t.home.testimonials}</h2>
            <div className="reviews">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="review" style={{ margin: 0 }}>
                  <div className="stars" aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}</div>
                  <blockquote style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 21, lineHeight: 1.4 }}>“{r.comment}”</blockquote>
                  <figcaption className="small muted">— {r.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="band goldband">
        <div className="container split">
          <div className="stack" style={{ gap: 12 }}>
            <h2 className="h-lg">{t.newsletter.title}</h2>
            <p>{t.newsletter.text}</p>
          </div>
          <NewsletterForm source="home" />
        </div>
      </section>
    </>
  );
}
