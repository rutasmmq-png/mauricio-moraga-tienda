import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export default async function PostsAdmin() {
  const { data } = await createSupabaseAdmin().from('posts').select('id, title, slug, published, published_at').order('published_at', { ascending: false });
  return (
    <>
      <div className="adm-head"><h1>Novedades editoriales</h1><Link href="/admin/novedades/nuevo" className="btn btn-gold">+ Nueva novedad</Link></div>
      <div className="panel tbl-wrap"><table className="tbl">
        <thead><tr><th>Título</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {(data || []).map((p) => (
            <tr key={p.id}><td><Link className="link" href={`/admin/novedades/${p.id}`}>{p.title}</Link></td><td>{p.published_at ? new Date(p.published_at).toLocaleDateString('es-CL') : ''}</td>
              <td><span className={`status ${p.published ? 'st-published' : 'st-draft'}`}>{p.published ? 'Publicada' : 'Borrador'}</span></td>
              <td><a className="btn-link" href={`/novedades/${p.slug}`} target="_blank" rel="noopener">Ver ↗</a></td></tr>
          ))}
          {!data?.length && <tr><td colSpan={4} className="muted">Aún no hay novedades.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
