-- ════════════════════════════════════════════════════════════════
--  MAURICIO MORAGA – AUTHOR & BOOKS · Esquema de base de datos
--  Ejecutar completo en Supabase → SQL Editor (una sola vez).
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Idiomas de los libros ───
create table if not exists languages (
  code        text primary key,               -- 'es', 'en', 'hi', 'pt'...
  name_es     text not null,
  name_en     text not null,
  name_hi     text not null,
  active      boolean not null default true,
  sort        int not null default 0
);

-- ─── Categorías / temáticas ───
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name_es     text not null,
  name_en     text not null,
  name_hi     text not null,
  sort        int not null default 0
);

-- ─── Libros ───
create table if not exists books (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  title              text not null,                        -- 1
  subtitle           text,                                 -- 2
  author             text not null default 'Mauricio Moraga Quezada', -- 3
  short_description  text,                                 -- 4
  long_description   text,                                 -- 5
  cover_url          text,                                 -- 6
  language_code      text references languages(code) on update cascade, -- 7
  category_id        uuid references categories(id) on delete set null, -- 8
  pages              int,                                  -- 9
  formats            text[] not null default '{}',         -- 10: digital, kindle, pdf, impreso
  price              numeric(12,2),                        -- 11 precio de referencia
  currency           text not null default 'USD',          -- 12
  status             text not null default 'draft' check (status in ('published','draft')), -- 13
  featured           boolean not null default false,       -- 14
  is_new             boolean not null default false,       -- novedad editorial
  contents           text,                                 -- temática y contenido / índice
  isbn               text,
  published_on       date,
  digital_file_path  text,                                 -- archivo en bucket privado 'book-files'
  seo_title          text,
  seo_description    text,
  sort               int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists books_status_idx on books(status);
create index if not exists books_lang_idx on books(language_code);
create index if not exists books_cat_idx on books(category_id);

-- ─── Opciones / enlaces de venta (campos 15–19) ───
-- Un libro puede tener muchas: Amazon Kindle, Amazon impreso, Hotmart, venta directa, otras.
create table if not exists sales_offers (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid not null references books(id) on delete cascade,
  platform    text not null,                 -- direct, amazon, hotmart, books2read, apple, bn, kobo, everand, smashwords, tolino, overdrive, bookshop, googleplay, other
  label       text not null,                 -- 'Amazon Kindle', 'Libro impreso', 'PDF – compra directa'
  format      text,                          -- kindle, impreso, pdf, digital
  url         text,                          -- obligatorio para plataformas externas
  price       numeric(12,2),
  currency    text not null default 'USD',
  delivery    text not null default 'digital' check (delivery in ('digital','physical')),
  stock       int,                           -- solo libros físicos de venta directa (null = sin control)
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists offers_book_idx on sales_offers(book_id);
create index if not exists offers_platform_idx on sales_offers(platform);

-- ─── Clientes, pedidos y descargas ───
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  phone       text,
  country     text,
  created_at  timestamptz not null default now()
);

create table if not exists orders (
  id                 uuid primary key default gen_random_uuid(),
  number             bigint generated always as identity,
  access_key         text not null default encode(gen_random_bytes(18),'hex'),
  status             text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  provider           text check (provider in ('stripe','mercadopago','webpay')),
  provider_ref       text,
  currency           text not null,
  subtotal           numeric(12,2) not null,
  shipping           numeric(12,2) not null default 0,
  total              numeric(12,2) not null,
  customer_id        uuid references customers(id) on delete set null,
  customer_name      text not null,
  email              text not null,
  phone              text,
  country            text,
  needs_shipping     boolean not null default false,
  shipping_address   jsonb,
  fulfillment_status text not null default 'none' check (fulfillment_status in ('none','pending','shipped','delivered')),
  tracking_info      text,
  locale             text default 'es',
  notes              text,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_email_idx on orders(email);

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  book_id     uuid references books(id) on delete set null,
  offer_id    uuid references sales_offers(id) on delete set null,
  title       text not null,
  label       text,
  delivery    text not null,
  unit_price  numeric(12,2) not null,
  quantity    int not null check (quantity > 0),
  line_total  numeric(12,2) not null
);

create table if not exists download_tokens (
  id             uuid primary key default gen_random_uuid(),
  order_item_id  uuid not null references order_items(id) on delete cascade,
  token          text unique not null default encode(gen_random_bytes(24),'hex'),
  expires_at     timestamptz not null default now() + interval '30 days',
  downloads      int not null default 0,
  max_downloads  int not null default 5,
  created_at     timestamptz not null default now()
);

-- ─── Opiniones de lectores (requieren aprobación) ───
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid references books(id) on delete cascade,
  name        text not null,
  rating      int not null check (rating between 1 and 5),
  comment     text not null,
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── Novedades editoriales ───
create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  body         text,
  cover_url    text,
  book_id      uuid references books(id) on delete set null,
  published    boolean not null default false,
  published_at timestamptz default now(),
  created_at   timestamptz not null default now()
);

-- ─── Suscriptores y mensajes de contacto ───
create table if not exists subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  name        text,
  locale      text,
  source      text,
  created_at  timestamptz not null default now()
);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text,
  body        text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── Ajustes del sitio (clave/valor editable desde el panel) ───
create table if not exists settings (
  key    text primary key,
  value  text
);

-- ─── Administradores ───
create table if not exists admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- updated_at automático
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists books_touch on books;
create trigger books_touch before update on books for each row execute function touch_updated_at();

-- Descuento de stock seguro para libros físicos de venta directa
create or replace function decrement_stock(p_offer uuid, p_qty int) returns void
language sql security definer set search_path = public as $$
  update sales_offers set stock = greatest(stock - p_qty, 0) where id = p_offer and stock is not null;
$$;

-- Contador de descargas atómico: solo cuenta si el pedido está pagado, vigente y con cupo
create or replace function use_download_token(p_token text)
returns table (file_path text, title text)
language sql security definer set search_path = public as $$
  update download_tokens dt set downloads = dt.downloads + 1
  from order_items oi
  join orders o on o.id = oi.order_id
  join books b on b.id = oi.book_id
  where dt.token = p_token
    and dt.order_item_id = oi.id
    and o.status = 'paid'
    and dt.expires_at > now()
    and dt.downloads < dt.max_downloads
    and b.digital_file_path is not null
  returning b.digital_file_path, b.title;
$$;
revoke execute on function use_download_token(text) from public, anon, authenticated;
revoke execute on function decrement_stock(uuid, int) from public, anon, authenticated;

-- ════════════════ Seguridad (Row Level Security) ════════════════
-- El público solo LEE contenido publicado. Toda escritura pasa por el
-- servidor (clave service_role) después de validar al administrador.
alter table languages      enable row level security;
alter table categories     enable row level security;
alter table books          enable row level security;
alter table sales_offers   enable row level security;
alter table customers      enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table download_tokens enable row level security;
alter table reviews        enable row level security;
alter table posts          enable row level security;
alter table subscribers    enable row level security;
alter table messages       enable row level security;
alter table settings       enable row level security;
alter table admins         enable row level security;

drop policy if exists "public read languages" on languages;
create policy "public read languages" on languages for select using (true);
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);
drop policy if exists "public read books" on books;
create policy "public read books" on books for select using (status = 'published' or is_admin());
drop policy if exists "public read offers" on sales_offers;
create policy "public read offers" on sales_offers for select using (
  (active and exists (select 1 from books b where b.id = book_id and b.status = 'published')) or is_admin());
drop policy if exists "public read reviews" on reviews;
create policy "public read reviews" on reviews for select using (approved or is_admin());
drop policy if exists "public read posts" on posts;
create policy "public read posts" on posts for select using (published or is_admin());
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);
drop policy if exists "admin read self" on admins;
create policy "admin read self" on admins for select using (user_id = auth.uid());
-- customers, orders, order_items, download_tokens, subscribers, messages:
-- sin políticas públicas → solo accesibles desde el servidor.

-- ════════════════ Almacenamiento ════════════════
insert into storage.buckets (id, name, public) values ('covers','covers', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('book-files','book-files', false)
  on conflict (id) do nothing;
-- 'covers' es público para lectura. 'book-files' es privado: los archivos
-- solo se entregan con enlaces firmados de 60 segundos tras un pago confirmado.
