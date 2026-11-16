import { notFound } from 'next/navigation';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { BookForm } from '../BookForm';
import { deleteBook } from '../../../actions';
import { ConfirmButton } from '../../../ui';
import type { Book } from '@/lib/types';

export default async function EditBook({ params, searchParams }: { params: { id: string }; searchParams: { creado?: string } }) {
  const sb = createSupabaseAdmin();
  const [{ data: book }, { data: langs }, { data: cats }] = await Promise.all([
    sb.from('books').select('*, offers:sales_offers(*)').eq('id', params.id).maybeSingle(),
    sb.from('languages').select('*').order('sort'), sb.from('categories').select('*').order('sort'),
  ]);
  if (!book) notFound();
  const b = book as unknown as Book;
  b.offers = (b.offers || []).sort((a, z) => a.sort - z.sort);
  return (
    <>
      <div className="adm-head">
        <h1>{b.title}</h1>
        <div className="row">
          <a href={`/libros/${b.slug}`} target="_blank" rel="noopener" className="btn btn-outline btn-sm">Ver en el sitio ↗</a>
          <form action={deleteBook}><input type="hidden" name="id" value={b.id} />
            <ConfirmButton message="¿Eliminar este libro? Si ya tiene ventas, se pasará a borrador en lugar de borrarse.">Eliminar libro</ConfirmButton>
          </form>
        </div>
      </div>
      {searchParams.creado && <p className="alert alert-ok" style={{ marginBottom: 16 }}>Libro creado.</p>}
      <BookForm book={b} languages={langs || []} categories={cats || []} />
    </>
  );
}
