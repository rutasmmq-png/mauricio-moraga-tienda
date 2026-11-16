import type { Metadata } from 'next';
import { getDict, getLocale } from '@/lib/i18n';
import { getSettings } from '@/lib/data';
import { ContactForm } from '@/components/Forms';
import { SocialIcon } from '@/components/SocialIcon';
import { whatsappLink } from '@/components/WhatsAppButton';

export const metadata: Metadata = { title: 'Contacto', description: 'Contacta a Mauricio Moraga: consultas sobre libros, invitaciones y pedidos especiales.', alternates: { canonical: '/contacto' } };

export default async function ContactPage() {
  const locale = getLocale();
  const t = getDict(locale);
  const s = await getSettings();
  const wa = whatsappLink(s.whatsapp_number || '', s.whatsapp_message || '');
  const socials = [['facebook', s.facebook_url, 'Facebook'], ['instagram', s.instagram_url, 'Instagram'], ['youtube', s.youtube_url, 'YouTube'], ['tiktok', s.tiktok_url, 'TikTok']].filter(([, u]) => u);
  return (
    <section className="band light">
      <div className="container split" style={{ alignItems: 'start' }}>
        <div className="stack">
          <h1 className="h-lg">{t.contact.title}</h1>
          <p className="lead">{t.contact.subtitle}</p>
          {s.contact_email && <p><strong>{t.contact.directEmail}:</strong> <a className="link" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></p>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#1f8f4e', color: '#fff', alignSelf: 'flex-start' }}><SocialIcon name="whatsapp" /> {t.contact.whatsapp}</a>}
          {socials.length > 0 && (
            <div className="stack" style={{ gap: 10 }}>
              <strong>{t.contact.follow}</strong>
              <div className="row">{socials.map(([k, u, label]) => (
                <a key={k} href={u} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><SocialIcon name={k!} /> {label}</a>
              ))}</div>
            </div>
          )}
        </div>
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', padding: 'clamp(20px,3vw,32px)' }}><ContactForm /></div>
      </div>
    </section>
  );
}
