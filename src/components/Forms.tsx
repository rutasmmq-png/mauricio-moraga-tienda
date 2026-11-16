'use client';
import { useEffect, useState } from 'react';
import { useI18n } from './I18nProvider';
import { track } from './track';

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'error');
}

export function NewsletterForm({ source = 'web' }: { source?: string }) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  if (state === 'ok') return <p style={{ fontSize: 18, fontWeight: 600 }} role="status">{t.newsletter.thanks}</p>;
  return (
    <form className="form" onSubmit={async (e) => {
      e.preventDefault();
      const email = String(new FormData(e.currentTarget).get('email') || '');
      setState('busy');
      try { await post('/api/subscribe', { email, locale, source }); track('subscribe'); setState('ok'); } catch { setState('err'); }
    }}>
      <label htmlFor={`nl-${source}`} className="visually-hidden">Email</label>
      <div className="row" style={{ gap: 8 }}>
        <input id={`nl-${source}`} name="email" type="email" required className="input" placeholder={t.newsletter.placeholder} style={{ flex: '1 1 220px', width: 'auto' }} />
        <button className="btn btn-dark" disabled={state === 'busy'}>{state === 'busy' ? t.common.loading : t.newsletter.button}</button>
      </div>
      {state === 'err' && <p className="alert alert-err">{t.common.error}</p>}
    </form>
  );
}

export function ContactForm() {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  if (state === 'ok') return <p className="alert alert-ok" role="status">{t.contact.sent}</p>;
  return (
    <form className="form" onSubmit={async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      setState('busy');
      try {
        await post('/api/contact', Object.fromEntries(f.entries()));
        track('contact'); setState('ok');
      } catch { setState('err'); }
    }}>
      <div className="grid-2">
        <div className="field"><label htmlFor="c-name">{t.contact.name} *</label><input id="c-name" name="name" required className="input" maxLength={120} /></div>
        <div className="field"><label htmlFor="c-email">{t.contact.email} *</label><input id="c-email" name="email" type="email" required className="input" maxLength={200} /></div>
      </div>
      <div className="field"><label htmlFor="c-subject">{t.contact.subject}</label><input id="c-subject" name="subject" className="input" maxLength={200} /></div>
      <div className="field"><label htmlFor="c-msg">{t.contact.message} *</label><textarea id="c-msg" name="body" required className="textarea" maxLength={5000} /></div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />
      {state === 'err' && <p className="alert alert-err">{t.common.error}</p>}
      <button className="btn btn-dark" disabled={state === 'busy'} style={{ alignSelf: 'flex-start' }}>{state === 'busy' ? t.common.loading : t.contact.send}</button>
    </form>
  );
}

export function ReviewForm({ bookId }: { bookId: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [rating, setRating] = useState(5);
  if (state === 'ok') return <p className="alert alert-ok" role="status">{t.book.reviewThanks}</p>;
  return (
    <form className="form" onSubmit={async (e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      setState('busy');
      try { await post('/api/reviews', { bookId, rating, name: f.get('name'), comment: f.get('comment'), website: f.get('website') }); setState('ok'); }
      catch { setState('err'); }
    }}>
      <h3 className="h-md">{t.book.writeReview}</h3>
      <div className="grid-2">
        <div className="field"><label htmlFor="r-name">{t.book.yourName} *</label><input id="r-name" name="name" required className="input" maxLength={80} /></div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{t.book.rating}</legend>
          <div className="row" style={{ gap: 2 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n}/5`} aria-pressed={rating === n}
                style={{ background: 'none', border: 0, fontSize: 28, cursor: 'pointer', color: n <= rating ? 'var(--gold)' : '#cdbfa5', minWidth: 40, minHeight: 44 }}>★</button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="field"><label htmlFor="r-comment">{t.book.comment} *</label><textarea id="r-comment" name="comment" required className="textarea" maxLength={2000} /></div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />
      {state === 'err' && <p className="alert alert-err">{t.common.error}</p>}
      <button className="btn btn-dark" disabled={state === 'busy'} style={{ alignSelf: 'flex-start' }}>{t.book.sendReview}</button>
    </form>
  );
}

export function ShareButtons({ url, title, label }: { url: string; title: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const txt = encodeURIComponent(title);
  return (
    <div className="share">
      <span className="small muted">{label}:</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer">Facebook</a>
      <a href={`https://wa.me/?text=${txt}%20${u}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <button type="button" title="Instagram no permite compartir enlaces directamente: copia el enlace para tu historia o biografía"
        onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* */ } }}>
        {copied ? '✓ Instagram' : 'Instagram (copiar enlace)'}
      </button>
    </div>
  );
}

export function TrackView({ name, value, currency }: { name: string; value?: number; currency?: string }) {
  useEffect(() => { track('view_item', { item_name: name, value, currency }); }, [name, value, currency]);
  return null;
}
