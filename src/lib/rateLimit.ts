// Limitador simple en memoria para formularios públicos (por instancia del servidor).
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}
export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}
export const isEmail = (s: unknown): s is string => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim()) && s.length < 200;
export const clean = (s: unknown, max = 2000) => (typeof s === 'string' ? s.trim().slice(0, max) : '');
