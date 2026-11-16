'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { saveSettings, type ActionResult } from '../../actions';
import { SubmitButton, Uploader } from '../../ui';

type F = [key: string, label: string, kind?: 'text' | 'area' | 'url' | 'email' | 'number', hint?: string];
const GROUPS: { title: string; fields: F[] }[] = [
  { title: 'Portada (por idioma)', fields: [
    ['hero_kicker_es', 'Línea superior (ES)'], ['hero_kicker_en', 'Línea superior (EN)'], ['hero_kicker_hi', 'Línea superior (HI)'],
    ['hero_quote_es', 'Frase destacada (ES)', 'area'], ['hero_quote_en', 'Frase destacada (EN)', 'area'], ['hero_quote_hi', 'Frase destacada (HI)', 'area'],
    ['hero_intro_es', 'Presentación (ES)', 'area'], ['hero_intro_en', 'Presentación (EN)', 'area'], ['hero_intro_hi', 'Presentación (HI)', 'area'],
  ] },
  { title: 'Biografía del autor', fields: [['author_bio_es', 'Biografía (ES)', 'area'], ['author_bio_en', 'Biografía (EN)', 'area'], ['author_bio_hi', 'Biografía (HI)', 'area']] },
  { title: 'Contacto y redes', fields: [
    ['contact_email', 'Correo público de contacto', 'email'], ['admin_notification_email', 'Correo donde recibir avisos de ventas y mensajes', 'email'],
    ['whatsapp_number', 'WhatsApp (con código de país)', 'text', 'Ejemplo: 56993169386. Si queda vacío, no se muestra el botón.'], ['whatsapp_message', 'Mensaje inicial de WhatsApp'],
    ['facebook_url', 'Facebook', 'url'], ['instagram_url', 'Instagram', 'url'], ['youtube_url', 'YouTube', 'url'], ['tiktok_url', 'TikTok', 'url'], ['amazon_author_url', 'Página de autor en Amazon', 'url'],
  ] },
  { title: 'Envíos (libros impresos de venta directa)', fields: [
    ['shipping_cost_CLP', 'Costo fijo de envío en CLP', 'number'], ['shipping_cost_USD', 'Costo fijo de envío en USD', 'number'], ['shipping_note_es', 'Nota de envío en el checkout', 'area'],
  ] },
  { title: 'Marketing y medición', fields: [
    ['ga_id', 'Google Analytics 4 – ID de medición', 'text', 'Formato G-XXXXXXXXXX'], ['meta_pixel_id', 'Meta (Facebook) Pixel ID', 'text', 'Solo números'],
  ] },
];

export function SettingsForm({ s }: { s: Record<string, string> }) {
  const [state, action] = useFormState<ActionResult | null, FormData>(saveSettings, null);
  const [photo, setPhoto] = useState(s.author_photo_url || '');
  return (
    <form action={action} className="stack" style={{ gap: 20 }}>
      <input type="hidden" name="s:author_photo_url" value={photo} />
      <div className="panel form"><h2>Fotografía del autor</h2>
        <Uploader bucket="covers" value={photo} onChange={setPhoto} accept="image/jpeg,image/png,image/webp" label={photo ? 'Cambiar fotografía' : 'Subir fotografía'} />
        <span className="hint small muted">Vertical (4:5), mínimo 1000 px de ancho.</span>
      </div>
      {GROUPS.map((g) => (
        <div className="panel form" key={g.title}>
          <h2>{g.title}</h2>
          <div className="grid-2">
            {g.fields.map(([key, label, kind = 'text', hint]) => (
              <div className="field" key={key} style={kind === 'area' && key.startsWith('author_bio') ? { gridColumn: '1 / -1' } : undefined}>
                <label htmlFor={key}>{label}</label>
                {kind === 'area'
                  ? <textarea id={key} name={`s:${key}`} className="textarea" style={{ minHeight: key.startsWith('author_bio') ? 200 : 90 }} defaultValue={s[key] || ''} />
                  : <input id={key} name={`s:${key}`} type={kind} className="input" defaultValue={s[key] || ''} step={kind === 'number' ? 'any' : undefined} />}
                {hint && <span className="hint">{hint}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="row" style={{ position: 'sticky', bottom: 0, background: '#f7f3ec', padding: '12px 0' }}>
        <SubmitButton className="btn btn-gold">Guardar ajustes</SubmitButton>
        {state?.message && <span className={`alert ${state.ok ? 'alert-ok' : 'alert-err'}`}>{state.message}</span>}
      </div>
    </form>
  );
}
