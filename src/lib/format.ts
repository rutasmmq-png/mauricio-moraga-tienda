import { ZERO_DECIMAL } from './site';
import type { Locale } from './types';

const localeTag: Record<Locale, string> = { es: 'es-CL', en: 'en-US', hi: 'hi-IN' };

export function formatPrice(amount: number | null | undefined, currency: string, locale: Locale = 'es') {
  if (amount === null || amount === undefined) return '';
  const digits = ZERO_DECIMAL.includes(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat(localeTag[locale], { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(digits)}`;
  }
}

export function roundMoney(n: number, currency: string) {
  return ZERO_DECIMAL.includes(currency) ? Math.round(n) : Math.round(n * 100) / 100;
}

export function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `libro-${Date.now()}`;
}

export function paragraphs(text: string | null | undefined) {
  return (text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

export function coverSrc(url: string | null | undefined) {
  return url && url.trim() ? url : '/covers/placeholder.svg';
}
