'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { savePost, type ActionResult } from '../../../actions';
import { SubmitButton, Uploader } from '../../../ui';
import type { Post } from '@/lib/types';

export function PostForm({ post, books }: { post: Post | null; books: { id: string; title: string }[] }) {
  const [state, action] = useFormState<ActionResult | null, FormData>(savePost, null);
  const [cover, setCover] = useState(post?.cover_url || '');
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="id" value={post?.id || ''} />
      <input type="hidden" name="cover_url" value={cover} />
      <div className="panel form">
        <div className="field"><label htmlFor="t">Título *</label><input id="t" name="title" required className="input" defaultValue={post?.title} /></div>
        <div className="field"><label htmlFor="e">Resumen</label><textarea id="e" name="excerpt" className="textarea" style={{ minHeight: 80 }} defaultValue={post?.excerpt || ''} /></div>
        <div className="field"><label htmlFor="b">Texto completo</label><textarea id="b" name="body" className="textarea" style={{ minHeight: 300 }} defaultValue={post?.body || ''} /><span className="hint">Deja una línea en blanco entre párrafos.</span></div>
      </div>
      <div className="stack" style={{ gap: 20 }}>
        <div className="panel form">
          <label className="check"><input type="checkbox" name="published" defaultChecked={post?.published ?? true} /> Publicada</label>
          <div className="field"><label htmlFor="d">Fecha</label><input id="d" name="published_at" type="date" className="input" defaultValue={post?.published_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)} /></div>
          <div className="field"><label htmlFor="bk">Libro relacionado</label><select id="bk" name="book_id" className="select" defaultValue={post?.book_id || ''}><option value="">—</option>{books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></div>
          <div className="field"><label htmlFor="s">Dirección web (slug)</label><input id="s" name="slug" className="input" defaultValue={post?.slug} placeholder="automática" /></div>
          {state?.message && <p className={`alert ${state.ok ? 'alert-ok' : 'alert-err'}`}>{state.message}</p>}
          <SubmitButton className="btn btn-gold btn-block">Guardar</SubmitButton>
        </div>
        <div className="panel form"><h2>Imagen</h2><Uploader bucket="covers" value={cover} onChange={setCover} accept="image/jpeg,image/png,image/webp" label="Subir imagen" /></div>
      </div>
    </form>
  );
}
