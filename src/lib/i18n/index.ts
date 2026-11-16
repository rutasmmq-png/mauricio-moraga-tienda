import { cookies } from 'next/headers';
import es from './es';
import en from './en';
import hi from './hi';
import type { Locale, Settings } from '../types';
import { platformName } from '../site';
export type { Dict } from './es';

export const LOCALES: Locale[] = ['es', 'en', 'hi'];
export const LOCALE_LABEL: Record<Locale, string> = { es: 'ES', en: 'EN', hi: 'हि' };
export const LOCALE_NAME: Record<Locale, string> = { es: 'Español', en: 'English', hi: 'हिन्दी' };
export const LOCALE_COOKIE = 'mm-locale';
const dicts = { es, en, hi };

export function getLocale(): Locale {
  const v = cookies().get(LOCALE_COOKIE)?.value as Locale | undefined;
  return v && LOCALES.includes(v) ? v : 'es';
}
export function getDict(locale: Locale = getLocale()) { return dicts[locale]; }

/** Nombre traducido de una fila con columnas name_es / name_en / name_hi */
export function localName(row: { name_es: string; name_en: string; name_hi: string } | null | undefined, locale: Locale) {
  if (!row) return '';
  return (row as Record<string, string>)[`name_${locale}`] || row.name_es;
}
/** Ajuste traducible: busca `${key}_${locale}` y si está vacío usa la versión en español */
export function setting(s: Settings, key: string, locale: Locale) {
  return s[`${key}_${locale}`] || s[`${key}_es`] || s[key] || '';
}

/** Nombre visible de una plataforma, traducido cuando corresponde. */
export function platformLabel(t: { platforms: Record<string, string> }, p: string) {
  return t.platforms[p] || platformName(p);
}
