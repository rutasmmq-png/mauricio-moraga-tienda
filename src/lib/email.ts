import 'server-only';

/** Envía correos con Resend (https://resend.com). Si no está configurado, no falla: solo lo registra. */
export async function sendEmail(opts: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info('[email] Resend no configurado; correo no enviado:', opts.subject);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html, reply_to: opts.replyTo }),
  });
  if (!res.ok) console.error('[email] Error de Resend', res.status, await res.text());
  return res.ok;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function emailLayout(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#f3ece0;font-family:Georgia,serif;color:#1b1814">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#0d0c0a;color:#f3ece0;padding:22px 26px;font-size:22px;letter-spacing:.04em">MAURICIO MORAGA
      <div style="color:#c9a54e;font-size:12px;font-family:Arial,sans-serif;letter-spacing:0;margin-top:4px">Author &amp; Books</div></div>
    <div style="background:#fffdf8;padding:28px 26px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6">
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 14px">${title}</h1>${inner}</div>
  </div></body></html>`;
}
