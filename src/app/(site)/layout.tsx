import { getDict, getLocale } from '@/lib/i18n';
import { getSettings } from '@/lib/data';
import { I18nProvider } from '@/components/I18nProvider';
import { CartProvider } from '@/components/CartProvider';
import { HeaderClient } from '@/components/HeaderClient';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Analytics } from '@/components/Analytics';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const t = getDict(locale);
  const s = await getSettings();
  return (
    <I18nProvider locale={locale} dict={t}>
      <CartProvider>
        <a href="#contenido" className="visually-hidden">Saltar al contenido</a>
        <HeaderClient />
        <main id="contenido">{children}</main>
        <Footer t={t} s={s} />
        <WhatsAppButton number={s.whatsapp_number || ''} message={s.whatsapp_message || ''} label={t.contact.whatsapp} />
        <Analytics gaId={s.ga_id} pixelId={s.meta_pixel_id} />
      </CartProvider>
    </I18nProvider>
  );
}
