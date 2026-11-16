'use client';
import { createContext, useContext } from 'react';
import type { Dict } from '@/lib/i18n/es';
import type { Locale } from '@/lib/types';

const Ctx = createContext<{ locale: Locale; t: Dict } | null>(null);
export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, t: dict }}>{children}</Ctx.Provider>;
}
export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n fuera de I18nProvider');
  return v;
}
