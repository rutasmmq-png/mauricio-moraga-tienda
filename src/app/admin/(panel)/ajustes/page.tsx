import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { SettingsForm } from './SettingsForm';

export default async function SettingsAdmin() {
  const { data } = await createSupabaseAdmin().from('settings').select('key,value');
  const s = Object.fromEntries((data || []).map((r) => [r.key, r.value || '']));
  return (<><div className="adm-head"><h1>Ajustes del sitio</h1></div><SettingsForm s={s} /></>);
}
