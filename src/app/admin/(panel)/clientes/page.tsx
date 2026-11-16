import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/format';

export default async function CustomersAdmin({ searchParams }: { searchParams: { q?: string } }) {
  let q = createSupabaseAdmin().from('customers').select('id, email, name, phone, country, created_at, orders(total, currency, status)').order('created_at', { ascending: false }).limit(500);
  if (searchParams.q) q = q.or(`email.ilike.%${searchParams.q.replace(/[%,()]/g, '')}%,name.ilike.%${searchParams.q.replace(/[%,()]/g, '')}%`);
  const { data } = await q;
  type C = { id: string; email: string; name: string | null; phone: string | null; country: string | null; created_at: string; orders: { total: number; currency: string; status: string }[] };
  return (
    <>
      <div className="adm-head"><h1>Clientes</h1>
        <form className="row" style={{ gap: 6 }}><input name="q" defaultValue={searchParams.q} className="input" placeholder="Buscar" style={{ width: 220, padding: '8px 10px' }} /><button className="btn btn-outline btn-sm">Buscar</button>
          <a className="btn btn-outline btn-sm" href="/api/admin/export?type=customers">Exportar CSV</a></form>
      </div>
      <p className="small muted" style={{ marginBottom: 12 }}>Datos básicos de quienes compraron directamente en el sitio. Úsalos solo para atender sus pedidos.</p>
      <div className="panel tbl-wrap"><table className="tbl">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>País</th><th className="num">Compras</th><th className="num">Total pagado</th></tr></thead>
        <tbody>
          {((data || []) as unknown as C[]).map((c) => {
            const paid = c.orders.filter((o) => o.status === 'paid');
            const sums: Record<string, number> = {};
            paid.forEach((o) => { sums[o.currency] = (sums[o.currency] || 0) + Number(o.total); });
            return (
              <tr key={c.id}><td>{c.name}</td><td><a className="link" href={`/admin/pedidos?status=&q=${encodeURIComponent(c.email)}`}>{c.email}</a></td><td>{c.phone}</td><td>{c.country}</td>
                <td className="num">{paid.length}</td><td className="num">{Object.entries(sums).map(([k, v]) => formatPrice(v, k)).join(' · ') || '—'}</td></tr>
            );
          })}
          {!data?.length && <tr><td colSpan={6} className="muted">Aún no hay clientes.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
