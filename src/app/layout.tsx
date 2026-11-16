import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Noto_Sans_Devanagari } from 'next/font/google';
import { getLocale } from '@/lib/i18n';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const deva = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['400', '600'], variable: '--font-deva', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Mauricio Moraga – Author & Books', template: `%s | ${SITE_NAME}` },
  description: 'Libros de Mauricio Moraga Quezada en español, inglés e hindi: superación personal, familia, matrimonio y estudio bíblico. Compra directa, Amazon y Hotmart.',
  openGraph: { type: 'website', siteName: 'Mauricio Moraga – Author & Books', images: ['/covers/el-secreto-del-exito.jpg'] },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
};
export const viewport: Viewport = { themeColor: '#0d0c0a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale} className={`${serif.variable} ${sans.variable} ${deva.variable}`}>
      <body>{children}</body>
    </html>
  );
}
