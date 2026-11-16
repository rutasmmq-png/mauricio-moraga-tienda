import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Cliente con la sesión del visitante (respeta RLS). Para leer contenido público y validar al admin. */
export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(list) {
        try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* componente de servidor: el middleware refresca la sesión */ }
      },
    },
  });
}
