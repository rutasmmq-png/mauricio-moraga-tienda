import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServer } from './supabase/server';
import { createSupabaseAdmin } from './supabase/admin';

/** Devuelve el usuario si es administrador; si no, null. */
export async function getAdminUser() {
  const sb = createSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await createSupabaseAdmin().from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  return data ? user : null;
}

/** Para páginas y acciones del panel: corta la ejecución si no hay administrador. */
export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect('/admin/login');
  return user;
}
