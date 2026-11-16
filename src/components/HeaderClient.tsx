'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { useI18n } from './I18nProvider';
import type { Locale } from '@/lib/types';

const LOCALES: { code: Locale; label: string; name: string }[] = [
  { code: 'es', label: 'ES', name: 'Español' }, { code: 'en', label: 'EN', name: 'English' }, { code: 'hi', label: 'हि', name: 'हिन्दी' },
];

export function HeaderClient() {
  const { t, locale } = useI18n();
  const { count, ready } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const setLocale = (code: Locale) => {
    document.cookie = `mm-locale=${code}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  const links = [
    { href: '/', label: t.nav.home }, { href: '/libros', label: t.nav.books }, { href: '/autor', label: t.nav.author },
    { href: '/novedades', label: t.nav.news }, { href: '/contacto', label: t.nav.contact },
  ];
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="header">
      <div className="container header-in">
        <Link href="/" className="brand" aria-label="Mauricio Moraga – inicio">
          <b>MAURICIO MORAGA</b><span>Author &amp; Books</span>
        </Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{t.nav.menu}</button>
        <nav id="main-nav" className={`nav${open ? ' open' : ''}`} aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
        </nav>
        <div className="langs" role="group" aria-label={t.nav.language}>
          {LOCALES.map((l) => (
            <button key={l.code} type="button" aria-pressed={locale === l.code} title={l.name} onClick={() => setLocale(l.code)}>{l.label}</button>
          ))}
        </div>
        <Link href="/carrito" className="cart-btn" aria-label={`${t.nav.cart} (${ready ? count : 0})`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a54e" strokeWidth="1.8" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
          <span className="cart-label">{t.nav.cart}</span>
          <span className="cart-count">{ready ? count : 0}</span>
        </Link>
      </div>
    </header>
  );
}
