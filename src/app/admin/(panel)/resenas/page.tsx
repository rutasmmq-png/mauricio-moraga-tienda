import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { addReview, moderateReview } from '../../actions';
import { ConfirmButton, SubmitButton } from '../../ui';

export default async function ReviewsAdmin() {
  const sb = createSupabaseAdmin();
  const [{ data }, { data: books }] = await Promise.all([
    sb.from('reviews').select('*, book:books(title)').order('approved').order('created_at', { ascending: false }).limit(300),
    sb.from('books').select('id, title').order('title'),
  ]);
  return (
    <>
      <div className="adm-head"><h1>Opiniones de lectores</h1></div>
      <p className="small muted" style={{ marginBottom: 16 }}>Las opiniones enviadas desde el sitio quedan pendientes hasta que las apruebes. Solo publica opiniones reales de lectores.</p>
      <div className="panel tbl-wrap"><table className="tbl">
        <thead><tr><th>Libro</th><th>Lector</th><th>★</th><th>Comentario</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {(data || []).map((r) => (
            <tr key={r.id}>
              <td>{r.book?.title || '—'}</td><td>{r.name}</td><td>{r.rating}</td><td style={{ maxWidth: 420 }}>{r.comment}</td>
              <td><span className={`status ${r.approved ? 'st-approved' : 'st-pending'}`}>{r.approved ? 'Publicada' : 'Pendiente'}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <form action={moderateReview} className="inline"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="action" value={r.approved ? 'hide' : 'approve'} /><button className="btn-link">{r.approved ? 'Ocultar' : 'Aprobar'}</button></form>
                <form action={moderateReview} className="inline"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="action" value="delete" /><ConfirmButton message="¿Eliminar esta opinión?">Eliminar</ConfirmButton></form>
              </td>
            </tr>
          ))}
          {!data?.length && <tr><td colSpan={6} className="muted">Aún no hay opiniones.</td></tr>}
        </tbody>
      </table></div>
      <div className="panel form">
        <h2>Agregar un testimonio recibido por otro medio</h2>
        <form action={addReview} className="form">
          <div className="grid-2">
            <div className="field"><label htmlFor="rb">Libro</label><select id="rb" name="book_id" className="select"><option value="">General (sin libro)</option>{(books || []).map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></div>
            <div className="field"><label htmlFor="rn">Nombre del lector</label><input id="rn" name="name" className="input" required /></div>
          </div>
          <div className="field" style={{ maxWidth: 140 }}><label htmlFor="rr">Estrellas</label><input id="rr" name="rating" type="number" min={1} max={5} defaultValue={5} className="input" /></div>
          <div className="field"><label htmlFor="rc">Comentario</label><textarea id="rc" name="comment" className="textarea" required /></div>
          <SubmitButton>Publicar testimonio</SubmitButton>
        </form>
      </div>
    </>
  );
}
