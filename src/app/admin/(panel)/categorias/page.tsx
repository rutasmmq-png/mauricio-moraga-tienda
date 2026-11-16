import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { deleteCategory, deleteLanguage, saveCategory, saveLanguage } from '../../actions';
import { ConfirmButton, SubmitButton } from '../../ui';

export default async function CategoriesAdmin() {
  const sb = createSupabaseAdmin();
  const [{ data: cats }, { data: langs }] = await Promise.all([sb.from('categories').select('*').order('sort'), sb.from('languages').select('*').order('sort')]);
  return (
    <>
      <div className="adm-head"><h1>Categorías e idiomas</h1></div>
      <div className="panel">
        <h2>Temáticas</h2>
        <p className="small muted" style={{ marginBottom: 12 }}>El nombre se muestra según el idioma que elija el visitante.</p>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Español</th><th>English</th><th>हिन्दी</th><th>Orden</th><th></th></tr></thead>
          <tbody>
            {(cats || []).map((c) => (
              <tr key={c.id}><td colSpan={5}>
                <form action={saveCategory} className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                  <input type="hidden" name="id" value={c.id} /><input type="hidden" name="slug" value={c.slug} />
                  <input name="name_es" defaultValue={c.name_es} className="input" required />
                  <input name="name_en" defaultValue={c.name_en} className="input" />
                  <input name="name_hi" defaultValue={c.name_hi} className="input" />
                  <input name="sort" type="number" defaultValue={c.sort} className="input" style={{ width: 80 }} />
                  <SubmitButton className="btn btn-outline btn-sm">Guardar</SubmitButton>
                </form>
                <form action={deleteCategory} style={{ textAlign: 'right' }}><input type="hidden" name="id" value={c.id} /><ConfirmButton message="¿Eliminar esta temática? Los libros quedarán sin temática.">Eliminar</ConfirmButton></form>
              </td></tr>
            ))}
          </tbody>
        </table></div>
        <form action={saveCategory} className="row" style={{ gap: 8, marginTop: 14 }}>
          <input name="name_es" placeholder="Nueva temática (español)" className="input" required style={{ flex: '1 1 200px', width: 'auto' }} />
          <input name="name_en" placeholder="English" className="input" style={{ flex: '1 1 160px', width: 'auto' }} />
          <input name="name_hi" placeholder="हिन्दी" className="input" style={{ flex: '1 1 160px', width: 'auto' }} />
          <SubmitButton className="btn btn-dark btn-sm">+ Agregar</SubmitButton>
        </form>
      </div>

      <div className="panel">
        <h2>Idiomas de los libros</h2>
        <p className="small muted" style={{ marginBottom: 12 }}>Agrega aquí nuevos idiomas (por ejemplo «pt» Portugués). Usa el código ISO de 2 letras.</p>
        <div className="stack" style={{ gap: 8 }}>
          {(langs || []).map((l) => (
            <form key={l.code} action={saveLanguage} className="row" style={{ gap: 8 }}>
              <input name="code" defaultValue={l.code} readOnly className="input" style={{ width: 70 }} />
              <input name="name_es" defaultValue={l.name_es} className="input" style={{ flex: '1 1 140px', width: 'auto' }} required />
              <input name="name_en" defaultValue={l.name_en} className="input" style={{ flex: '1 1 140px', width: 'auto' }} />
              <input name="name_hi" defaultValue={l.name_hi} className="input" style={{ flex: '1 1 140px', width: 'auto' }} />
              <input name="sort" type="number" defaultValue={l.sort} className="input" style={{ width: 80 }} />
              <label className="check"><input type="checkbox" name="active" defaultChecked={l.active} /> Activo</label>
              <SubmitButton className="btn btn-outline btn-sm">Guardar</SubmitButton>
              <button formAction={deleteLanguage} className="btn-link danger">Eliminar</button>
            </form>
          ))}
        </div>
        <form action={saveLanguage} className="row" style={{ gap: 8, marginTop: 14 }}>
          <input name="code" placeholder="pt" className="input" required style={{ width: 70 }} maxLength={5} />
          <input name="name_es" placeholder="Portugués" className="input" required style={{ flex: '1 1 140px', width: 'auto' }} />
          <input name="name_en" placeholder="Portuguese" className="input" style={{ flex: '1 1 140px', width: 'auto' }} />
          <input name="name_hi" placeholder="पुर्तगाली" className="input" style={{ flex: '1 1 140px', width: 'auto' }} />
          <input type="hidden" name="active" value="on" />
          <SubmitButton className="btn btn-dark btn-sm">+ Agregar idioma</SubmitButton>
        </form>
      </div>
    </>
  );
}
