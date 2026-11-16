'use client';
// Eventos para Google Analytics 4 y Meta Pixel (solo se envían si están configurados).
type W = Window & { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };

export function track(event: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'click_external' | 'subscribe' | 'contact', data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as W;
  try {
    w.gtag?.('event', event, data);
    const map: Record<string, string> = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase', subscribe: 'Lead', contact: 'Contact' };
    if (map[event]) w.fbq?.('track', map[event], { value: data.value, currency: data.currency, content_name: data.item_name });
    else w.fbq?.('trackCustom', 'ClickExternalStore', data);
  } catch { /* nunca romper la página por analítica */ }
}
