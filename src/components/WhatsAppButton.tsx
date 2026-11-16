import { SocialIcon } from './SocialIcon';

export function whatsappLink(number: string, message: string) {
  const n = number.replace(/[^\d]/g, '');
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(message || '')}` : '';
}
export function WhatsAppButton({ number, message, label }: { number: string; message: string; label: string }) {
  const href = whatsappLink(number, message);
  if (!href) return null;
  return (
    <a className="wa" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} style={{ color: '#fff' }}>
      <SocialIcon name="whatsapp" size={28} />
    </a>
  );
}
