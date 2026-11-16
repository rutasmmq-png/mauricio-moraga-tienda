'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem } from '@/lib/types';
import { useI18n } from './I18nProvider';
import { track } from './track';
import Link from 'next/link';

const KEY = 'mm-cart-v1';
interface CartCtx {
  items: CartItem[]; count: number; subtotal: number; currency: string | null; ready: boolean;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => boolean;
  setQty: (offerId: string, qty: number) => void;
  remove: (offerId: string) => void;
  clear: () => void;
}
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ text: string; link?: boolean } | null>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch { /* sin almacenamiento */ }
    setReady(true);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) { try { setItems(JSON.parse(e.newValue || '[]')); } catch { /* */ } } };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* */ } } }, [items, ready]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4500); return () => clearTimeout(id); }, [toast]);

  const currency = items[0]?.currency ?? null;

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    if (currency && item.currency !== currency) { setToast({ text: t.cart.mixedCurrency.replace('{cur}', currency) }); return false; }
    setItems((prev) => {
      const found = prev.find((p) => p.offerId === item.offerId);
      if (found) return prev.map((p) => p.offerId === item.offerId ? { ...p, ...item, qty: item.delivery === 'digital' ? 1 : Math.min(p.qty + qty, 20) } : p);
      return [...prev, { ...item, qty: item.delivery === 'digital' ? 1 : qty }];
    });
    track('add_to_cart', { currency: item.currency, value: item.price, item_name: item.title });
    setToast({ text: `${t.book.added}: ${item.title}`, link: true });
    return true;
  }, [currency, t]);

  const setQty = useCallback((offerId: string, qty: number) => {
    setItems((prev) => prev.map((p) => p.offerId === offerId ? { ...p, qty: p.delivery === 'digital' ? 1 : Math.min(Math.max(1, qty), 20) } : p));
  }, []);
  const remove = useCallback((offerId: string) => setItems((prev) => prev.filter((p) => p.offerId !== offerId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items, ready, currency, add, setQty, remove, clear,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
  }), [items, ready, currency, add, setQty, remove, clear]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.link && <Link href="/carrito" className="link" style={{ color: 'var(--gold)' }}>{t.nav.cart} →</Link>}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart fuera de CartProvider');
  return v;
}
