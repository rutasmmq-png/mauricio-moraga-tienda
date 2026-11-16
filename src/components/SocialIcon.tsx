export function SocialIcon({ name, size = 18 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true } as const;
  switch (name) {
    case 'facebook': return <svg {...p}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" /></svg>;
    case 'instagram': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>;
    case 'youtube': return <svg {...p}><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9l5 3-5 3V9z" /></svg>;
    case 'tiktok': return <svg {...p}><path d="M14 3v11a4 4 0 1 1-4-4" /><path d="M14 3c.5 3 2.5 5 5 5" /></svg>;
    case 'whatsapp': return <svg {...p}><path d="M4 20l1.3-4A8 8 0 1 1 8 19.2L4 20z" /><path d="M9 9.5c.3 2 2.2 4 4.5 4.6l1-1 1.8.8-.4 1.6c-3.5.3-7.4-3.4-7.3-7l1.6-.4.8 1.8-1 1z" /></svg>;
    default: return <svg {...p}><path d="M4 6h16M4 12h16M4 18h10" /></svg>;
  }
}
