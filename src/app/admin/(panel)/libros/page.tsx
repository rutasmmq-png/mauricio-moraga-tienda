import Link from 'next/link';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { coverSrc, formatPrice } from '@/lib/format';
import { platformName } from '@/lib/site';
import { setBookFlag } from '../../actions';

export default async function BooksAdmin({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  let q = createSupabaseAdmin().from('books').select('id, slug, title, subtitle, cover_url, language_code, status, featured, is_new, price, currency, offers:sales_offers(platform, active, label)').order('sort').order('created_at', { ascending: false });
  if (searchParams.status) q = q.eq('status', searchParams.status);
  if (searchParams.q) q = q.ilike('title', `%${searchParams.q.replace(/[%,]/g, '')}%`);
  const { data } = await q;
  type Row = { id: string; slug: string; title: string; subtitle: string | null; cover_url: string | null; language_code: string | null; status: string; featured: boolean; is_new: boolean; price: number | null; currency: string; offers: { platform: string; active: boolean; label: string }[] };
  const books = (data || []) as unknown as Row[];
  return (
    <>
      <div className="adm-head">
        <h1>Libros</h1>
        <div className="row">
          <form className="row" style={{ gap: 6 }}>
            <input name="q" defaultValue={searchParams.q} className="input" placeholder="Buscar título" style={{ width: 200, padding: '8px 10px' }} />
            <select name="status" defaultValue={searchParams.status || ''} className="select" style={{ width: 150, padding: '8px 10px' }}>
              <option value="">Todos</option><option value="published">Publicados</option><option value="draft">Borradores</option>
            </select>
            <button className="btn btn-outline btn-sm">Filtrar</button>
          </form>
          <Link href="/admin/libros/nuevo" className="btn btn-gold">+ Agregar libro</Link>
        </div>
      </div>
      <div className="panel tbl-wrap">
        <table className="tbl">
          <thead><tr><th></th><th>Título</th><th>Idioma</th><th>Dónde se vende</th><th className="num">Precio ref.</th><th>Estado</th><th>Destacado</th><th></th></tr></thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td><img className="thumb" src={coverSrc(b.cover_url)} alt="" /></td>
                <td><Link href={`/admin/libros/${b.id}`} className="link"><strong>{b.title}</strong></Link>{b.subtitle && <div className="small muted">{b.subtitle}</div>}</td>
                <td>{b.language_code?.toUpperCase()}</td>
                <td className="small">{b.offers.length ? b.offers.map((o, i) => <div key={i} style={{ opacity: o.active ? 1 : .45 }}>{platformName(o.platform, o.label)}{o.active ? '' : ' (inactivo)'}</div>) : <span className="muted">Sin enlaces</span>}</td>
                <td className="num">{b.price !== null ? formatPrice(Number(b.price), b.currency) : '—'}</td>
                <td>
                  <form action={setBookFlag} className="inline">
                    <input type="hidden" name="id" value={b.id} /><input type="hidden" name="field" value="status" />
                    <input type="hidden" name="value" value={b.status === 'published' ? 'draft' : 'published'} />
                    <button className={`status st-${b.status}`} style={{ border: 0, cursor: 'pointer' }} title="Cambiar estado">{b.status === 'published' ? 'Publicado' : 'Borrador'}</button>
                  </form>
                </td>
                <td>
                  <form action={setBookFlag} className="inline">
                    <input type="hidden" name="id" value={b.id} /><input type="hidden" name="field" value="featured" />
                    <input type="hidden" name="value" value={String(!b.featured)} />
                    <button className="btn-link" aria-label="Cambiar destacado" style={{ fontSize: 20, textDecoration: 'none', color: b.featured ? 'var(--gold)' : '#cdbfa5' }}>★</button>
                  </form>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}><Link href={`/admin/libros/${b.id}`} className="btn-link">Editar</Link> <a href={`/libros/${b.slug}`} target="_blank" rel="noopener" className="btn-link">Ver ↗</a></td>
              </tr>
            ))}
            {!books.length && <tr><td colSpan={8} className="muted">No hay libros con ese filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
