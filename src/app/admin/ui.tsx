'use client';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createSupabaseBrowser } from '@/lib/supabase/browser';

export function SubmitButton({ children, className = 'btn btn-dark' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending}>{pending ? 'Guardando…' : children}</button>;
}

/** Botón que pide confirmación antes de enviar su formulario (borrar, etc.). */
export function ConfirmButton({ message, children, className = 'btn-link danger' }: { message: string; children: React.ReactNode; className?: string }) {
  return <button className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>{children}</button>;
}

/** Sube un archivo directo a Supabase Storage con una URL firmada emitida por el servidor. */
export function Uploader({ bucket, value, onChange, accept, label }: { bucket: 'covers' | 'book-files'; value: string; onChange: (v: string) => void; accept: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [progressName, setProgressName] = useState('');
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="uploader">
        {bucket === 'covers' && value && <img src={value} alt="Portada" />}
        {bucket === 'book-files' && value && <span className="small"><strong>Archivo actual:</strong> {value.split('/').pop()}</span>}
        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
          {busy ? `Subiendo ${progressName}…` : label}
          <input type="file" accept={accept} hidden disabled={busy} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true); setErr(''); setProgressName(file.name);
            try {
              const r = await fetch('/api/admin/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bucket, filename: file.name }) });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error);
              const { error } = await createSupabaseBrowser().storage.from(bucket).uploadToSignedUrl(d.path, d.token, file, { contentType: file.type || undefined });
              if (error) throw error;
              onChange(bucket === 'covers' ? d.publicUrl : d.path);
            } catch (x) { setErr(x instanceof Error ? x.message : 'No se pudo subir el archivo'); }
            setBusy(false); e.target.value = '';
          }} />
        </label>
        {value && <button type="button" className="btn-link danger" onClick={() => onChange('')}>Quitar</button>}
      </div>
      {err && <p className="alert alert-err">{err}</p>}
    </div>
  );
}
