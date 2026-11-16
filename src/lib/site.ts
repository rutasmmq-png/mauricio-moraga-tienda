export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'Mauricio Moraga';
export const FORMATS = ['digital', 'kindle', 'pdf', 'impreso'] as const;
export const CURRENCIES = ['USD', 'CLP', 'EUR', 'MXN', 'INR'] as const;
// Monedas sin decimales
export const ZERO_DECIMAL = ['CLP', 'JPY', 'KRW'];

/** Plataformas de venta conocidas. Se pueden agregar más aquí sin tocar la base de datos. */
export const PLATFORMS: Record<string, { name: string; bg: string; fg: string }> = {
  direct: { name: 'Compra directa', bg: '#1b1814', fg: '#f3ece0' },
  amazon: { name: 'Amazon', bg: '#ff9900', fg: '#111111' },
  hotmart: { name: 'Hotmart', bg: '#f04e23', fg: '#ffffff' },
  books2read: { name: 'Todas las tiendas (Books2Read)', bg: '#1b1814', fg: '#f3ece0' },
  draft2digital: { name: 'Draft2Digital', bg: '#1b1814', fg: '#f3ece0' },
  apple: { name: 'Apple Books', bg: '#111111', fg: '#ffffff' },
  bn: { name: 'Barnes & Noble', bg: '#2a5c45', fg: '#ffffff' },
  kobo: { name: 'Kobo', bg: '#bf0000', fg: '#ffffff' },
  everand: { name: 'Everand', bg: '#1e1e1e', fg: '#ffffff' },
  smashwords: { name: 'Smashwords', bg: '#2b4b7b', fg: '#ffffff' },
  tolino: { name: 'Tolino', bg: '#004b8d', fg: '#ffffff' },
  overdrive: { name: 'OverDrive', bg: '#2c2c6c', fg: '#ffffff' },
  bookshop: { name: 'Bookshop.org', bg: '#5b4a8b', fg: '#ffffff' },
  googleplay: { name: 'Google Play Libros', bg: '#1a73e8', fg: '#ffffff' },
  other: { name: 'Otra plataforma', bg: '#1b1814', fg: '#f3ece0' },
};
export function platformName(p: string, label?: string | null) {
  if (p === 'other' && label) return label;
  return PLATFORMS[p]?.name || label || p;
}
