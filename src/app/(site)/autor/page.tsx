import Link from 'next/link';
import type { Metadata } from 'next';
import { getDict, getLocale, setting } from '@/lib/i18n';
import { getAllPublishedBooks, getSettings } from '@/lib/data';
import { BookCard } from '@/components/BookCard';
import { Credentials } from '@/components/Credentials';
import { paragraphs } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Sobre el autor',
  description: 'Mauricio Moraga Quezada: Relaciones Públicas (U. Santo Tomás), Teología (Instituto Bíblico Nacional), Hebreo bíblico (Rosen Institute, Israel) y más de 25 años enseñando principios bíblicos.',
  alternates: { canonical: '/autor' },
};

export default async function AuthorPage() {
  const locale = getLocale();
  const t = getDict(locale);
  const [s, books] = await Promise.all([getSettings(), getAllPublishedBooks()]);
  const bio = paragraphs(setting(s, 'author_bio', locale));
  return (
    <>
      <section className="band dark">
        <div className="container split" style={{ gridTemplateColumns: 'minmax(0,.8fr) minmax(0,1.2fr)' }}>
          <div className="author-photo" style={{ background: 'var(--ink-2)' }}>
            {s.author_photo_url
              ? <img src={s.author_photo_url} alt="Mauricio Moraga Quezada" />
              : <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9a8460" strokeWidth="1.2" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>}
          </div>
          <div className="stack">
            <span className="kicker">{t.author.title}</span>
            <h1 className="h-xl" style={{ fontSize: 'clamp(44px,6vw,72px)' }}>Mauricio Moraga Quezada</h1>
            {setting(s, 'hero_quote', locale) && <p className="quote">“{setting(s, 'hero_quote', locale)}”</p>}
          </div>
        </div>
      </section>
      <section className="band light">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div className="stack prose">{bio.map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="stack">
            <h2 className="h-md">{t.author.training}</h2>
            <Credentials locale={locale} />
            <Link href="/contacto" className="btn btn-dark" style={{ alignSelf: 'flex-start' }}>{t.nav.contact}</Link>
          </div>
        </div>
      </section>
      {books.length > 0 && (
        <section className="band" style={{ background: 'var(--paper-2)' }}>
          <div className="container">
            <h2 className="h-lg" style={{ marginBottom: 32 }}>{t.author.books}</h2>
            <div className="grid-books">{books.slice(0, 8).map((b) => <BookCard key={b.id} book={b} t={t} locale={locale} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
