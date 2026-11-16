'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { saveBook, type ActionResult } from '../../actions';
import { SubmitButton, Uploader } from '../../ui';
import { CURRENCIES, FORMATS, PLATFORMS } from '@/lib/site';
import type { Book, Category, Language } from '@/lib/types';

const FORMAT_LABEL: Record<string, string> = { digital: 'Digital', kindle: 'Kindle', pdf: 'PDF', impreso: 'Impreso' };

interface OfferRow { key: string; id?: string; platform: string; label: string; format: string; url: string; price: string; currency: string; delivery: string; stock: string; active: boolean }

// Plantillas rápidas para agregar enlaces de venta habituales
const PRESETS: { name: string; row: Partial<OfferRow> }[] = [
  { name: 'Amazon Kindle', row: { platform: 'amazon', label: 'Amazon Kindle', format: 'kindle', delivery: 'digital' } },
  { name: 'Amazon impreso', row: { platform: 'amazon', label: 'Amazon – Libro impreso', format: 'impreso', delivery: 'physical' } },
  { name: 'Hotmart', row: { platform: 'hotmart', label: 'Hotmart', format: 'digital', delivery: 'digital' } },
  { name: 'Todas las tiendas (Books2Read)', row: { platform: 'books2read', label: 'Apple Books, Kobo, Google Play y más', format: 'digital', delivery: 'digital' } },
  { name: 'Venta directa PDF', row: { platform: 'direct', label: 'PDF – Compra directa', format: 'pdf', delivery: 'digital' } },
  { name: 'Venta directa impreso', row: { platform: 'direct', label: 'Libro impreso – Envío a domicilio', format: 'impreso', delivery: 'physical' } },
  { name: 'Otra tienda', row: { platform: 'apple', label: 'Apple Books', format: 'digital', delivery: 'digital' } },
];

let seq = 0;
const newKey = () => `n${Date.now()}${seq++}`;

export function BookForm({ book, languages, categories }: { book: Book | null; languages: Language[]; categories: Category[] }) {
  const [state, action] = useFormState<ActionResult | null, FormData>(saveBook, null);
  const [cover, setCover] = useState(book?.cover_url || '');
  const [file, setFile] = useState(book?.digital_file_path || '');
  const [currency, setCurrency] = useState(book?.currency || 'USD');
  const [offers, setOffers] = useState<OfferRow[]>((book?.offers || []).map((o) => ({
    key: o.id, id: o.id, platform: o.platform, label: o.label, format: o.format || '', url: o.url || '',
    price: o.price === null ? '' : String(o.price), currency: o.currency, delivery: o.delivery, stock: o.stock === null ? '' : String(o.stock), active: o.active,
  })));

  const upd = (key: string, patch: Partial<OfferRow>) => setOffers((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (i: number, d: number) => setOffers((rows) => { const c = [...rows]; const j = i + d; if (j < 0 || j >= c.length) return c; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const add = (p: Partial<OfferRow>) => setOffers((rows) => [...rows, { key: newKey(), platform: 'other', label: '', format: 'digital', url: '', price: '', currency, delivery: 'digital', stock: '', active: true, ...p }]);

  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="id" value={book?.id || ''} />
      <input type="hidden" name="cover_url" value={cover} />
      <input type="hidden" name="digital_file_path" value={file} />
      <input type="hidden" name="offers_json" value={JSON.stringify(offers.map(({ key: _k, ...r }) => r))} />

      <div className="stack" style={{ gap: 20 }}>
        <div className="panel form">
          <h2>Información del libro</h2>
          <div className="field"><label htmlFor="title">1 · Título *</label><input id="title" name="title" required className="input" defaultValue={book?.title} /></div>
          <div className="field"><label htmlFor="subtitle">2 · Subtítulo</label><input id="subtitle" name="subtitle" className="input" defaultValue={book?.subtitle || ''} /></div>
          <div className="grid-2">
            <div className="field"><label htmlFor="author">3 · Autor</label><input id="author" name="author" className="input" defaultValue={book?.author || 'Mauricio Moraga Quezada'} /></div>
            <div className="field"><label htmlFor="slug">Dirección web (slug)</label><input id="slug" name="slug" className="input" defaultValue={book?.slug} placeholder="se genera desde el título" /><span className="hint">/libros/{book?.slug || 'titulo-del-libro'}</span></div>
          </div>
          <div className="field"><label htmlFor="short">4 · Descripción corta (tarjetas y Google)</label><textarea id="short" name="short_description" className="textarea" style={{ minHeight: 80 }} maxLength={1000} defaultValue={book?.short_description || ''} /></div>
          <div className="field"><label htmlFor="long">5 · Descripción extensa</label><textarea id="long" name="long_description" className="textarea" style={{ minHeight: 220 }} defaultValue={book?.long_description || ''} /><span className="hint">Deja una línea en blanco entre párrafos.</span></div>
          <div className="field"><label htmlFor="contents">Temática y contenido (índice, qué aprenderá el lector)</label><textarea id="contents" name="contents" className="textarea" defaultValue={book?.contents || ''} /></div>
        </div>

        <div className="panel">
          <h2>Enlaces y modalidades de venta</h2>
          <p className="small muted" style={{ marginBottom: 14 }}>
            Cada fila es un botón de compra en la ficha del libro. <strong>Compra directa</strong> = se agrega al carrito y se paga en tu sitio (modalidad A).
            Cualquier otra plataforma abre su página de compra (modalidad B) y no entra al carrito.
          </p>
          <div className="stack" style={{ gap: 10 }}>
            {offers.map((o, i) => (
              <div key={o.key} className="offer-row">
                <div className="field"><label>Plataforma</label>
                  <select className="select" value={o.platform} onChange={(e) => upd(o.key, { platform: e.target.value })}>
                    {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select></div>
                <div className="field"><label>Texto del botón / edición</label><input className="input" value={o.label} onChange={(e) => upd(o.key, { label: e.target.value })} placeholder="Amazon Kindle" /></div>
                <div className="field"><label>{o.platform === 'direct' ? 'Enlace (no se usa en compra directa)' : 'URL de compra'}</label><input className="input" type="url" value={o.url} disabled={o.platform === 'direct'} onChange={(e) => upd(o.key, { url: e.target.value })} placeholder="https://" /></div>
                <div className="field"><label>Precio</label><input className="input" inputMode="decimal" value={o.price} onChange={(e) => upd(o.key, { price: e.target.value })} placeholder={o.platform === 'direct' ? 'obligatorio' : 'opcional'} /></div>
                <div className="field"><label>Moneda</label><select className="select" value={o.currency} onChange={(e) => upd(o.key, { currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div className="field"><label>Formato</label><select className="select" value={o.delivery === 'physical' ? 'impreso' : o.format} onChange={(e) => upd(o.key, { format: e.target.value, delivery: e.target.value === 'impreso' ? 'physical' : 'digital' })}>{FORMATS.map((f) => <option key={f} value={f}>{FORMAT_LABEL[f]}</option>)}</select></div>
                <div className="field"><label>Stock</label><input className="input" inputMode="numeric" value={o.stock} disabled={!(o.platform === 'direct' && o.delivery === 'physical')} onChange={(e) => upd(o.key, { stock: e.target.value })} placeholder="∞" /></div>
                <label className="check"><input type="checkbox" checked={o.active} onChange={(e) => upd(o.key, { active: e.target.checked })} /> Activo</label>
                <div className="row" style={{ gap: 0 }}>
                  <button type="button" className="btn-link" aria-label="Subir" onClick={() => move(i, -1)}>↑</button>
                  <button type="button" className="btn-link danger" aria-label="Quitar enlace" onClick={() => setOffers((r) => r.filter((x) => x.key !== o.key))}>✕</button>
                </div>
              </div>
            ))}
            {!offers.length && <p className="muted small">Este libro aún no tiene enlaces de venta. Agrega uno:</p>}
          </div>
          <div className="row" style={{ marginTop: 14, gap: 8 }}>
            {PRESETS.map((p) => <button key={p.name} type="button" className="btn btn-outline btn-sm" onClick={() => add(p.row)}>+ {p.name}</button>)}
          </div>
        </div>

        <div className="panel form">
          <h2>SEO (Google y redes sociales)</h2>
          <div className="field"><label htmlFor="seo_title">Título para Google</label><input id="seo_title" name="seo_title" className="input" maxLength={200} defaultValue={book?.seo_title || ''} placeholder="Si lo dejas vacío se usa el título y subtítulo" /></div>
          <div className="field"><label htmlFor="seo_description">Descripción para Google (máx. 160 caracteres recomendado)</label><textarea id="seo_description" name="seo_description" className="textarea" style={{ minHeight: 70 }} maxLength={400} defaultValue={book?.seo_description || ''} /></div>
        </div>
      </div>

      <div className="stack" style={{ gap: 20, position: 'sticky', top: 16 }}>
        <div className="panel form">
          <h2>Publicación</h2>
          <div className="field"><label htmlFor="status">13 · Estado</label>
            <select id="status" name="status" className="select" defaultValue={book?.status || 'draft'}><option value="draft">Borrador (no visible)</option><option value="published">Publicado</option></select></div>
          <label className="check"><input type="checkbox" name="featured" defaultChecked={book?.featured} /> 14 · Libro destacado (portada)</label>
          <label className="check"><input type="checkbox" name="is_new" defaultChecked={book?.is_new} /> Novedad editorial</label>
          <div className="field"><label htmlFor="sort">Orden (menor = primero)</label><input id="sort" name="sort" type="number" className="input" defaultValue={book?.sort ?? 0} /></div>
          {state?.message && <p className={`alert ${state.ok ? 'alert-ok' : 'alert-err'}`} role="status">{state.message}</p>}
          <SubmitButton className="btn btn-gold btn-block">{book ? 'Guardar cambios' : 'Crear libro'}</SubmitButton>
        </div>

        <div className="panel form">
          <h2>6 · Portada</h2>
          <Uploader bucket="covers" value={cover} onChange={setCover} accept="image/jpeg,image/png,image/webp" label={cover ? 'Cambiar portada' : 'Subir portada'} />
          <span className="hint small muted">JPG o PNG vertical, idealmente 1600 × 2400 px.</span>
        </div>

        <div className="panel form">
          <h2>Detalles</h2>
          <div className="grid-2">
            <div className="field"><label htmlFor="lang">7 · Idioma</label>
              <select id="lang" name="language_code" className="select" defaultValue={book?.language_code || 'es'}>{languages.map((l) => <option key={l.code} value={l.code}>{l.name_es}</option>)}</select></div>
            <div className="field"><label htmlFor="cat">8 · Temática</label>
              <select id="cat" name="category_id" className="select" defaultValue={book?.category_id || ''}><option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name_es}</option>)}</select></div>
          </div>
          <div className="grid-2">
            <div className="field"><label htmlFor="pages">9 · N.º de páginas</label><input id="pages" name="pages" type="number" min={0} className="input" defaultValue={book?.pages ?? ''} /></div>
            <div className="field"><label htmlFor="isbn">ISBN / ASIN</label><input id="isbn" name="isbn" className="input" defaultValue={book?.isbn || ''} /></div>
          </div>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}><legend style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>10 · Formatos</legend>
            <div className="row" style={{ gap: 14 }}>{FORMATS.map((f) => <label key={f} className="check"><input type="checkbox" name="formats" value={f} defaultChecked={book?.formats?.includes(f)} /> {FORMAT_LABEL[f]}</label>)}</div>
          </fieldset>
          <div className="grid-2">
            <div className="field"><label htmlFor="price">11 · Precio de referencia</label><input id="price" name="price" inputMode="decimal" className="input" defaultValue={book?.price ?? ''} /></div>
            <div className="field"><label htmlFor="currency">12 · Moneda</label><select id="currency" name="currency" className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="field"><label htmlFor="published_on">Fecha de publicación</label><input id="published_on" name="published_on" type="date" className="input" defaultValue={book?.published_on || ''} /></div>
        </div>

        <div className="panel form">
          <h2>Archivo digital (venta directa)</h2>
          <Uploader bucket="book-files" value={file} onChange={setFile} accept=".pdf,.epub,.mobi,.zip,.mp3,.mp4" label={file ? 'Reemplazar archivo' : 'Subir PDF / EPUB'} />
          <span className="hint small muted">Se guarda en un almacenamiento privado. Solo quien paga recibe un enlace personal (30 días, 5 descargas).</span>
        </div>
      </div>
    </form>
  );
}
