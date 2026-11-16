import Link from 'next/link';
import type { Dict } from '@/lib/i18n';
import type { Settings } from '@/lib/types';
import { SocialIcon } from './SocialIcon';

export function Footer({ t, s }: { t: Dict; s: Settings }) {
  const socials = [
    { key: 'facebook', url: s.facebook_url }, { key: 'instagram', url: s.instagram_url },
    { key: 'youtube', url: s.youtube_url }, { key: 'tiktok', url: s.tiktok_url }, { key: 'amazon', url: s.amazon_author_url },
  ].filter((x) => x.url);
  return (
    <footer className="footer">
      <div className="container footer-in">
        <div className="stack" style={{ gap: 12, maxWidth: 360 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: '#f4efe4' }}>MAURICIO MORAGA</div>
          <p className="small">{t.footer.languages}</p>
          {socials.length > 0 && (
            <div className="socials">
              {socials.map((x) => (
                <a key={x.key} href={x.url} target="_blank" rel="noopener noreferrer" aria-label={x.key}><SocialIcon name={x.key} /></a>
              ))}
            </div>
          )}
        </div>
        <div className="row" style={{ gap: 48, alignItems: 'flex-start' }}>
          <div className="footer-col"><strong>{t.footer.store}</strong>
            <Link href="/libros">{t.nav.books}</Link><Link href="/novedades">{t.nav.news}</Link><Link href="/carrito">{t.nav.cart}</Link>
          </div>
          <div className="footer-col"><strong>{t.footer.authorCol}</strong>
            <Link href="/autor">{t.nav.author}</Link><Link href="/contacto">{t.nav.contact}</Link>
            {s.contact_email && <a href={`mailto:${s.contact_email}`}>{s.contact_email}</a>}
          </div>
        </div>
      </div>
      <div className="container small" style={{ padding: '18px 24px 28px', borderTop: '1px solid var(--ink-3)', color: '#8f846f' }}>
        © {new Date().getFullYear()} Mauricio Moraga Quezada. {t.footer.rights}
      </div>
    </footer>
  );
}
