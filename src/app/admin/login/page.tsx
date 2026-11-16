'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '').trim();
    const sb = createSupabaseBrowser();
    setBusy(true); setMsg(null);
    if (mode === 'reset') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/clave` });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Si el correo existe, recibirás un enlace para crear una nueva contraseña.' });
      setBusy(false);
      return;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password: String(f.get('password') || '') });
    if (error) { setMsg({ ok: false, text: 'Correo o contraseña incorrectos.' }); setBusy(false); return; }
    router.replace('/admin');
    router.refresh();
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="brand" style={{ color: 'var(--ink-2)' }}><b>MAURICIO MORAGA</b><span>Panel de administración</span></div>
        <div className="field"><label htmlFor="email">Correo</label><input id="email" name="email" type="email" required className="input" autoComplete="username" /></div>
        {mode === 'login' && <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" required className="input" autoComplete="current-password" /></div>}
        {msg && <p className={`alert ${msg.ok ? 'alert-ok' : 'alert-err'}`}>{msg.text}</p>}
        <button className="btn btn-dark btn-block" disabled={busy}>{busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Enviar enlace'}</button>
        <button type="button" className="btn-link" onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setMsg(null); }}>
          {mode === 'login' ? '¿Olvidaste tu contraseña?' : 'Volver al ingreso'}
        </button>
      </form>
    </div>
  );
}
