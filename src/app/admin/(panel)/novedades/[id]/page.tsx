import { notFound } from 'next/navigation';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { PostForm } from './PostForm';
import { deletePost } from '../../../actions';
import { ConfirmButton } from '../../../ui';

export default async function EditPost({ params }: { params: { id: string } }) {
  const sb = createSupabaseAdmin();
  const isNew = params.id === 'nuevo';
  const [{ data: post }, { data: books }] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : sb.from('posts').select('*').eq('id', params.id).maybeSingle(),
    sb.from('books').select('id, title').order('title'),
  ]);
  if (!isNew && !post) notFound();
  return (
    <>
      <div className="adm-head"><h1>{isNew ? 'Nueva novedad' : 'Editar novedad'}</h1>
        {post && <form action={deletePost}><input type="hidden" name="id" value={post.id} /><ConfirmButton message="¿Eliminar esta novedad?">Eliminar</ConfirmButton></form>}
      </div>
      <PostForm post={post} books={books || []} />
    </>
  );
}
