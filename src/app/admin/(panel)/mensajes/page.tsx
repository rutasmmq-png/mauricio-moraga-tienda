import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { messageAction } from '../../actions';
import { ConfirmButton } from '../../ui';

export default async function MessagesAdmin() {
  const { data } = await createSupabaseAdmin().from('messages').select('*').order('created_at', { ascending: false }).limit(300);
  return (
    <>
      <div className="adm-head"><h1>Mensajes de contacto</h1></div>
      <div className="stack" style={{ gap: 12 }}>
        {(data || []).map((m) => (
          <div key={m.id} className="panel" style={{ marginTop: 0, borderLeft: m.read ? undefined : '3px solid var(--gold)' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><strong>{m.name}</strong> · <a className="link" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Tu mensaje'))}`}>{m.email}</a>
                <div className="small muted">{new Date(m.created_at).toLocaleString('es-CL')}{m.subject ? ` · ${m.subject}` : ''}</div></div>
              <div className="row" style={{ gap: 4 }}>
                {!m.read && <form action={messageAction}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="action" value="read" /><button className="btn-link">Marcar leído</button></form>}
                <form action={messageAction}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="action" value="delete" /><ConfirmButton message="¿Eliminar este mensaje?">Eliminar</ConfirmButton></form>
              </div>
            </div>
            <p style={{ whiteSpace: 'pre-line', marginTop: 10 }}>{m.body}</p>
          </div>
        ))}
        {!data?.length && <p className="panel muted">No hay mensajes.</p>}
      </div>
    </>
  );
}
