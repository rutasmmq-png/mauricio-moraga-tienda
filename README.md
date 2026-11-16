# Mauricio Moraga – Author & Books

Tienda de libros y sitio de autor con catálogo administrable, carrito, pagos directos (Stripe, Mercado Pago, Webpay), enlaces a Amazon, Hotmart y las tiendas de Draft2Digital, panel privado y tres idiomas (español, inglés, hindi).

**Tecnología:** Next.js 14 · Supabase (PostgreSQL, autenticación y almacenamiento de archivos) · Vercel (publicación).
Todos estos servicios tienen plan gratuito suficiente para comenzar.

---

## Qué incluye

| Área | Funciones |
|---|---|
| **Sitio público** | Inicio con frase destacada, libros destacados, novedades, autor y suscripción · Catálogo con filtros por idioma, temática, formato y plataforma, búsqueda y paginación · Ficha de cada libro con portada grande, especificaciones, todas las opciones de compra, opiniones, libros relacionados y botones para compartir · Sobre el autor · Novedades · Contacto con formulario, correo, redes y WhatsApp |
| **Compra** | Modalidad A: carrito propio (persiste mientras navega), checkout con datos, correo y dirección de despacho para impresos, pago con Stripe / Mercado Pago / Webpay, confirmación por correo y descarga segura · Modalidad B: Amazon, Hotmart, Books2Read, Apple Books, Kobo, etc. abren su propia página y **no** entran al carrito |
| **Seguridad** | Precios recalculados en el servidor · Pagos confirmados solo por la pasarela (webhook o consulta directa) y verificando el monto · Archivos en almacenamiento privado; enlaces personales (30 días, 5 descargas, enlace firmado de 60 s) · Panel con usuario y contraseña · Reglas de acceso (RLS) en la base de datos |
| **Panel /admin** | Libros (19 campos + varios enlaces de venta por libro, portada, archivo digital), publicar/borrador, destacar · Categorías e idiomas · Pedidos, despacho y renovación de descargas · Clientes · Opiniones (aprobar/ocultar) · Novedades · Suscriptores y mensajes (exportables a CSV) · Ajustes: textos de portada y biografía en 3 idiomas, foto, WhatsApp, redes, costos de envío, Google Analytics y Meta Pixel |
| **Marketing** | Títulos y descripciones por página, datos estructurados de libro (Google), sitemap.xml y robots.txt automáticos, Open Graph para redes, eventos de Analytics/Pixel (ver libro, agregar al carrito, iniciar pago, compra, clic a Amazon/Hotmart, suscripción) |

---

## Publicación paso a paso

### 1. Base de datos (Supabase) — 10 minutos
1. Crea una cuenta en <https://supabase.com> → **New project** (región: São Paulo). Guarda la contraseña de la base de datos.
2. Ve a **SQL Editor → New query**, pega todo el contenido de `supabase/schema.sql` y presiona **Run**.
3. Abre otra consulta, pega `supabase/seed.sql` y presiona **Run** (carga tus libros, categorías y textos iniciales).
4. Ve a **Project Settings → API** y copia: `Project URL`, `anon public` y `service_role` (esta última es secreta).
5. **Authentication → URL Configuration**: en *Site URL* escribe tu dominio (ej. `https://www.mauriciomoraga.com`) y en *Redirect URLs* agrega `https://www.mauriciomoraga.com/admin/clave`.

### 2. Tu usuario administrador
1. Supabase → **Authentication → Users → Add user → Create new user**: tu correo y una contraseña segura (marca *Auto Confirm User*).
2. En **SQL Editor** ejecuta (con tu correo):
   ```sql
   insert into admins (user_id) select id from auth.users where email = 'TU_CORREO@gmail.com';
   ```
Solo los usuarios de esa tabla pueden entrar al panel. Para agregar a otra persona, repite ambos pasos.

### 3. Publicar el sitio (Vercel) — 10 minutos
1. Crea una cuenta en <https://github.com> y un repositorio nuevo **privado**; sube todos los archivos de esta carpeta (botón *uploading an existing file*, arrastrando la carpeta completa).
2. Crea una cuenta en <https://vercel.com> con tu GitHub → **Add New → Project** → elige el repositorio.
3. En **Environment Variables** agrega las variables de `.env.example` (como mínimo `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. **Deploy**. En 2–3 minutos tendrás el sitio en una dirección `*.vercel.app`. Entra a `/admin` para probar el panel.

> Cada vez que cambies una variable de entorno, ve a **Deployments → ⋯ → Redeploy**.

### 4. Conectar tu dominio
1. Compra el dominio (ej. en NIC Chile para `.cl`, o Namecheap/GoDaddy para `.com`).
2. Vercel → tu proyecto → **Settings → Domains → Add** → escribe `www.tudominio.com` y también `tudominio.com`.
3. Vercel te mostrará dos registros DNS. En el panel de tu proveedor de dominio crea:
   - Tipo **A**, nombre `@`, valor `76.76.21.21`
   - Tipo **CNAME**, nombre `www`, valor `cname.vercel-dns.com`
   (usa exactamente lo que Vercel indique, puede variar). El certificado HTTPS se crea solo.
4. Actualiza `NEXT_PUBLIC_SITE_URL` en Vercel y la *Site URL* de Supabase con el dominio final, y haz **Redeploy**.
5. Registra el sitio en **Google Search Console** y envía `https://tudominio.com/sitemap.xml`.

---

## Activar los pagos directos

Los medios de pago **solo aparecen en el checkout cuando sus credenciales están configuradas**; no hay botones de pago simulados. Puedes activar uno, dos o los tres.

| Pasarela | Para qué | Monedas | Qué necesito |
|---|---|---|---|
| **Webpay Plus** (Transbank) | Tarjetas chilenas (débito/crédito) | CLP | Contratar Webpay Plus en transbank.cl → recibirás **código de comercio** y **API Key secreta** |
| **Mercado Pago** | Chile y Latinoamérica | CLP (cuenta chilena) | Cuenta Mercado Pago → *Tus integraciones → Crear aplicación* → **Access Token de producción** |
| **Stripe** | Tarjetas internacionales | USD, EUR, etc. | Cuenta Stripe (disponible para empresas en Chile) → **Secret key** y **Webhook secret** |

**Variables y configuración de cada una:**

- **Webpay:** `WEBPAY_ENV=production`, `WEBPAY_COMMERCE_CODE`, `WEBPAY_API_KEY`. No requiere webhook (la confirmación se hace al volver del pago).
  Para **probar** sin dinero real usa los valores de integración que vienen en `.env.example` con `WEBPAY_ENV=integration` y las tarjetas de prueba de transbankdevelopers.cl. Transbank exige una prueba de validación antes de pasar a producción.
- **Mercado Pago:** `MERCADOPAGO_ACCESS_TOKEN`. El aviso de pago llega solo a `https://tudominio.com/api/webhooks/mercadopago` (el sitio lo indica en cada cobro). Para probar usa el *Access Token de prueba* y usuarios de prueba.
- **Stripe:** `STRIPE_SECRET_KEY`. Luego en Stripe → **Developers → Webhooks → Add endpoint**: URL `https://tudominio.com/api/webhooks/stripe`, eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`. Copia el *Signing secret* en `STRIPE_WEBHOOK_SECRET`.

**Importante – moneda:** un carrito admite una sola moneda. Si vendes en CLP, el cliente verá Webpay y Mercado Pago (y Stripe si lo activas). Si vendes en USD, verá Stripe.

### Correos de confirmación y descarga (recomendado)
1. Crea una cuenta en <https://resend.com>, agrega y verifica tu dominio (te dará registros DNS para copiar en tu proveedor).
2. Crea una API Key y configúrala en `RESEND_API_KEY`; en `EMAIL_FROM` pon algo como `Mauricio Moraga <libros@tudominio.com>`.
3. En el panel → Ajustes, escribe el **correo donde recibir avisos de ventas**.

Sin Resend, la compra funciona igual y el cliente descarga desde la página de confirmación, pero no recibe correo.

### Google Analytics y Meta Pixel
Panel → **Ajustes → Marketing y medición**: pega el ID `G-XXXXXXX` de GA4 y el número de tu Pixel. No necesitas tocar código.

---

## Uso diario del panel (`tudominio.com/admin`)

**Agregar un libro:** Libros → *+ Agregar libro* → completa los datos, sube la portada → en *Enlaces y modalidades de venta* usa los botones rápidos (+ Amazon Kindle, + Hotmart, + Todas las tiendas (Books2Read), + Venta directa PDF…) y pega cada enlace → estado **Publicado** → Guardar.

**Vender un libro directamente (PDF):** en el libro, sube el archivo en *Archivo digital*, agrega *Venta directa PDF* con su precio y moneda, marca *Activo* y guarda. Aparecerá el botón **Agregar al carrito**.

**Vender impresos directamente:** agrega *Venta directa impreso* con precio y stock (vacío = sin control de stock). Define el costo de envío en Ajustes. Los pedidos aparecen en *Pedidos* como "Por despachar".

**Nuevos idiomas:** Categorías e idiomas → *+ Agregar idioma* (ej. `pt` Portugués). Los textos del menú del sitio están traducidos a español, inglés e hindi en `src/lib/i18n/`.

---

## Estado de los libros cargados

| Libro | Idioma | Venta configurada | Pendiente |
|---|---|---|---|
| The Secret to Success | Inglés | Amazon Kindle USD 6.99 (enlace directo) | Enlace del libro impreso en Amazon |
| El Secreto del Éxito | Español | Compra directa (inactiva) | Precio + archivo PDF para activarla |
| सफलता का रहस्य (Hindi) | Hindi | Books2Read: todas las tiendas | Precio de referencia (opcional) |
| Método Vinculum 21™ | Español | Hotmart (enlace directo) | Precio para mostrarlo (opcional) |
| Herencia con Maldición | Español | Amazon Kindle (enlace directo) | Precio para mostrarlo (opcional) |
| Inheritance with Curses | Inglés | Amazon Kindle (enlace directo) | Precio para mostrarlo (opcional) |
| Guía de Oraciones por Necesidad | Español | — (borrador) | Portada definitiva, precio, archivo |
| Mente Activa, Corazón Chileno | Español | — (borrador) | Portada, precio, modalidad |

Además: fotografía del autor, WhatsApp, correo de contacto y redes sociales (Panel → Ajustes).

---

## Para desarrolladores

```bash
cp .env.example .env.local   # completa las variables
npm install
npm run dev                  # http://localhost:3000
npm run typecheck
```

Estructura: `src/app/(site)` sitio público · `src/app/admin` panel · `src/app/api` checkout, webhooks, descargas y formularios · `src/lib` datos, pagos, pedidos, correo, idiomas · `supabase/` esquema y datos iniciales.
Para agregar una tienda nueva a la lista de plataformas basta con añadirla en `PLATFORMS` (`src/lib/site.ts`).
