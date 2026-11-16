'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

/** Página a la que llega el enlace de recuperación de contraseña. */
export default function NewPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const sb = createSupabaseBrowser();
    const code = new URLSearchParams(window.location.search).get('code');
    (code ? sb.auth.exchangeCodeForSession(code) : sb.auth.getSession()).then(() => setReady(true));
  }, []);
  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={async (e) => {
        e.preventDefault();
        const p = String(new FormData(e.currentTarget).get('password') || '');
        if (p.length < 10) { setMsg('Usa al menos 10 caracteres.'); return; }
        const { error } = await createSupabaseBrowser().auth.updateUser({ password: p });
        if (error) setMsg(error.message); else { router.replace('/admin'); router.refresh(); }
      }}>
        <div className="brand" style={{ color: 'var(--ink-2)' }}><b>MAURICIO MORAGA</b><span>Nueva contraseña</span></div>
        <div className="field"><label htmlFor="password">Nueva contraseña</label><input id="password" name="password" type="password" minLength={10} required className="input" autoComplete="new-password" /></div>
        {msg && <p className="alert alert-err">{msg}</p>}
        <button className="btn btn-dark btn-block" disabled={!ready}>Guardar contraseña</button>
      </form>
    </div>
  );
}
