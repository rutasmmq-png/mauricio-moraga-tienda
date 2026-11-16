'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { track } from '@/components/track';

export function PaidEffects({ orderId, value, currency }: { orderId: string; value: number; currency: string }) {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    clear();
    const key = `mm-tracked-${orderId}`;
    try { if (!sessionStorage.getItem(key)) { track('purchase', { transaction_id: orderId, value, currency }); sessionStorage.setItem(key, '1'); } } catch { /* */ }
  }, [ready, clear, orderId, value, currency]);
  return null;
}

export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => { n += 1; router.refresh(); if (n > 40) clearInterval(id); }, 4000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
