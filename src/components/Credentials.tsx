import type { Locale } from '@/lib/types';

const DATA: Record<Locale, [string, string][]> = {
  es: [
    ['Relaciones Públicas', 'Universidad Santo Tomás'],
    ['Teología', 'Instituto Bíblico Nacional'],
    ['Hebreo y Griego bíblico', 'Rosen Institute, Israel · estudios independientes de griego'],
    ['+25 años', 'Enseñando principios bíblicos en iglesias y grupos de estudio'],
  ],
  en: [
    ['Public Relations', 'Universidad Santo Tomás'],
    ['Theology', 'Instituto Bíblico Nacional'],
    ['Biblical Hebrew & Greek', 'Rosen Institute, Israel · independent Greek studies'],
    ['25+ years', 'Teaching biblical principles in churches and study groups'],
  ],
  hi: [
    ['जनसंपर्क', 'यूनिवर्सिदाद सांतो तोमास'],
    ['धर्मशास्त्र', 'इंस्टीट्यूटो बिब्लिको नासियोनाल'],
    ['बाइबिल हिब्रू और यूनानी', 'रोज़ेन इंस्टीट्यूट, इज़राइल · यूनानी का स्वतंत्र अध्ययन'],
    ['25+ वर्ष', 'चर्चों और अध्ययन समूहों में बाइबल शिक्षण'],
  ],
};

export function Credentials({ locale }: { locale: Locale }) {
  return (
    <div className="creds">
      {(DATA[locale] || DATA.es).map(([a, b]) => <div className="cred" key={a}><strong>{a}</strong><span>{b}</span></div>)}
    </div>
  );
}
