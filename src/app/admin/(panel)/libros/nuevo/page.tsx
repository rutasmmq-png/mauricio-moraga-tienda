import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { BookForm } from '../BookForm';

export default async function NewBook() {
  const sb = createSupabaseAdmin();
  const [{ data: langs }, { data: cats }] = await Promise.all([sb.from('languages').select('*').order('sort'), sb.from('categories').select('*').order('sort')]);
  return (<><div className="adm-head"><h1>Agregar libro</h1></div><BookForm book={null} languages={langs || []} categories={cats || []} /></>);
}
