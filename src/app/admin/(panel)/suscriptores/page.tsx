import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { deleteSubscriber } from '../../actions';
import { ConfirmButton } from '../../ui';

export default async function SubscribersAdmin() {
  const { data, count } = await createSupabaseAdmin().from('subscribers').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(1000);
  return (
    <>
      <div className="adm-head"><h1>Suscriptores ({count || 0})</h1><a className="btn btn-outline" href="/api/admin/export?type=subscribers">Exportar CSV (Mailchimp, Brevo…)</a></div>
      <div className="panel tbl-wrap"><table className="tbl">
        <thead><tr><th>Correo</th><th>Idioma</th><th>Origen</th><th>Fecha</th><th></th></tr></thead>
        <tbody>
          {(data || []).map((s) => (
            <tr key={s.id}><td>{s.email}</td><td>{s.locale}</td><td>{s.source}</td><td>{new Date(s.created_at).toLocaleDateString('es-CL')}</td>
              <td><form action={deleteSubscriber}><input type="hidden" name="id" value={s.id} /><ConfirmButton message="¿Eliminar este suscriptor?">Eliminar</ConfirmButton></form></td></tr>
          ))}
          {!data?.length && <tr><td colSpan={5} className="muted">Aún no hay suscriptores.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
