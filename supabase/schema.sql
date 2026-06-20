-- ============================================================================
-- Kiyim MVP — Local Clothing Discovery Engine
-- PostgreSQL schema for Supabase (fresh install).
-- For an EXISTING database, run supabase/migration_seller.sql instead.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pg_trgm";
create extension if not exists "uuid-ossp";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type store_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum ('draft', 'pending_review', 'published', 'hidden', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_type as enum ('men', 'women', 'unisex', 'kids');
exception when duplicate_object then null; end $$;

-- Cities ---------------------------------------------------------------------
create table if not exists cities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Categories -----------------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  sort_order  int not null default 0
);

-- Stores ---------------------------------------------------------------------
create table if not exists stores (
  id            uuid primary key default uuid_generate_v4(),
  owner_id      uuid references auth.users (id) on delete set null,
  name          text not null,
  slug          text not null unique,
  description   text,
  phone         text,
  whatsapp      text,
  instagram     text,
  address       text,
  city_id       uuid references cities (id),
  lat           double precision,
  lng           double precision,
  logo_url      text,
  cover_url     text,
  status        store_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Products -------------------------------------------------------------------
create table if not exists products (
  id             uuid primary key default uuid_generate_v4(),
  store_id       uuid not null references stores (id) on delete cascade,
  title          text not null,
  description    text,
  category_id    uuid references categories (id),
  gender         gender_type not null default 'unisex',
  brand          text,
  color          text,
  price          numeric(12, 2) not null default 0 check (price >= 0),
  currency       text not null default 'KZT',
  sizes          text[] not null default '{}',
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  status         product_status not null default 'draft',
  search_vector  tsvector generated always as (
    to_tsvector('simple',
      coalesce(title, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(description, ''))
  ) stored,
  search_count   int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Product media (separate tables, one product -> many images / videos) -------
create table if not exists product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products (id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists product_videos (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products (id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Home promo banners (admin-managed) -----------------------------------------
create table if not exists banners (
  id          uuid primary key default uuid_generate_v4(),
  image_url   text not null,
  link_url    text,
  title       text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Search analytics -----------------------------------------------------------
create table if not exists search_events (
  id          bigint generated always as identity primary key,
  query       text not null,
  results     int not null default 0,
  created_at  timestamptz not null default now()
);

-- Indexes --------------------------------------------------------------------
create index if not exists idx_products_store        on products (store_id);
create index if not exists idx_products_category      on products (category_id);
create index if not exists idx_products_status        on products (status);
create index if not exists idx_products_created       on products (created_at desc);
create index if not exists idx_products_search_vector on products using gin (search_vector);
create index if not exists idx_products_title_trgm    on products using gin (title gin_trgm_ops);
create index if not exists idx_product_images_product on product_images (product_id);
create index if not exists idx_product_videos_product on product_videos (product_id);
create index if not exists idx_stores_status          on stores (status);
create index if not exists idx_stores_city            on stores (city_id);
create index if not exists idx_search_events_query    on search_events using gin (query gin_trgm_ops);

-- updated_at trigger ---------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_stores_updated on stores;
create trigger trg_stores_updated before update on stores
  for each row execute function set_updated_at();

-- ============================================================================
-- VIEW: products with aggregated media + store info.
-- Used by all read paths so callers get images/videos/store in one query.
-- security_invoker = on => the view respects the caller's RLS policies.
-- ============================================================================
drop view if exists products_with_media;
create view products_with_media
with (security_invoker = on) as
select
  p.*,
  coalesce(
    (select array_agg(pi.url order by pi.is_primary desc, pi.sort_order)
     from product_images pi where pi.product_id = p.id),
    '{}'
  ) as images,
  coalesce(
    (select array_agg(pv.url order by pv.sort_order)
     from product_videos pv where pv.product_id = p.id),
    '{}'
  ) as videos,
  (select jsonb_build_object(
      'id', s.id, 'name', s.name, 'slug', s.slug, 'whatsapp', s.whatsapp,
      'instagram', s.instagram, 'address', s.address, 'lat', s.lat,
      'lng', s.lng, 'logo_url', s.logo_url, 'status', s.status)
   from stores s where s.id = p.store_id) as store
from products p;

grant select on products_with_media to anon, authenticated;

-- ============================================================================
-- SEARCH RPC — published products from approved stores only.
-- ============================================================================
create or replace function search_products(
  q             text default null,
  p_category    uuid default null,
  p_gender      gender_type default null,
  p_store       uuid default null,
  p_size        text default null,
  p_min_price   numeric default null,
  p_max_price   numeric default null,
  p_limit       int default 24,
  p_offset      int default 0
)
returns setof products_with_media
language sql stable as $$
  select pm.*
  from products_with_media pm
  where pm.status = 'published'
    and (pm.store->>'status') = 'approved'
    and (p_category  is null or pm.category_id = p_category)
    and (p_gender    is null or pm.gender = p_gender)
    and (p_store     is null or pm.store_id = p_store)
    and (p_size      is null or p_size = any(pm.sizes))
    and (p_min_price is null or pm.price >= p_min_price)
    and (p_max_price is null or pm.price <= p_max_price)
    and (
      q is null or q = ''
      or pm.search_vector @@ plainto_tsquery('simple', q)
      or pm.title % q
    )
  order by
    case when q is null or q = '' then 0
         else ts_rank(pm.search_vector, plainto_tsquery('simple', q))
              + similarity(pm.title, q) end desc,
    pm.created_at desc
  limit p_limit offset p_offset;
$$;

grant execute on function search_products to anon, authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table stores          enable row level security;
alter table products        enable row level security;
alter table product_images  enable row level security;
alter table product_videos  enable row level security;
alter table categories      enable row level security;
alter table cities          enable row level security;
alter table banners         enable row level security;

drop policy if exists "read active banners" on banners;
create policy "read active banners" on banners for select using (is_active = true);
grant select on banners to anon, authenticated;

drop policy if exists "read categories" on categories;
create policy "read categories" on categories for select using (true);
drop policy if exists "read cities" on cities;
create policy "read cities" on cities for select using (true);

-- Stores
drop policy if exists "read approved stores" on stores;
create policy "read approved stores" on stores
  for select using (status = 'approved' or owner_id = auth.uid());
drop policy if exists "insert own store" on stores;
create policy "insert own store" on stores
  for insert with check (owner_id = auth.uid());
drop policy if exists "update own store" on stores;
create policy "update own store" on stores
  for update using (owner_id = auth.uid());

-- Products: public sees published from approved stores; owners see their own.
drop policy if exists "read products" on products;
create policy "read products" on products
  for select using (
    (status = 'published' and exists (
      select 1 from stores s where s.id = products.store_id and s.status = 'approved'))
    or exists (select 1 from stores s where s.id = products.store_id and s.owner_id = auth.uid())
  );

drop policy if exists "owner manage products" on products;
create policy "owner manage products" on products
  for all using (
    exists (select 1 from stores s where s.id = products.store_id and s.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from stores s where s.id = products.store_id and s.owner_id = auth.uid())
  );

-- Product images / videos: anyone can read; owners manage their product's media.
drop policy if exists "read product images" on product_images;
create policy "read product images" on product_images for select using (true);
drop policy if exists "owner manage product images" on product_images;
create policy "owner manage product images" on product_images
  for all using (
    exists (select 1 from products p join stores s on s.id = p.store_id
            where p.id = product_images.product_id and s.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from products p join stores s on s.id = p.store_id
            where p.id = product_images.product_id and s.owner_id = auth.uid())
  );

drop policy if exists "read product videos" on product_videos;
create policy "read product videos" on product_videos for select using (true);
drop policy if exists "owner manage product videos" on product_videos;
create policy "owner manage product videos" on product_videos
  for all using (
    exists (select 1 from products p join stores s on s.id = p.store_id
            where p.id = product_videos.product_id and s.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from products p join stores s on s.id = p.store_id
            where p.id = product_videos.product_id and s.owner_id = auth.uid())
  );

-- ============================================================================
-- STORAGE: public bucket for product media + upload policies.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

drop policy if exists "public read product media" on storage.objects;
create policy "public read product media" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "auth upload product media" on storage.objects;
create policy "auth upload product media" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');

drop policy if exists "auth update product media" on storage.objects;
create policy "auth update product media" on storage.objects
  for update to authenticated using (bucket_id = 'products');

drop policy if exists "auth delete product media" on storage.objects;
create policy "auth delete product media" on storage.objects
  for delete to authenticated using (bucket_id = 'products');

-- Seed categories ------------------------------------------------------------
insert into categories (name, slug, sort_order) values
  ('Men', 'men', 1),
  ('Women', 'women', 2),
  ('Kids', 'kids', 3),
  ('Shoes', 'shoes', 4),
  ('Streetwear', 'streetwear', 5),
  ('Accessories', 'accessories', 6)
on conflict (slug) do nothing;

insert into cities (name, slug) values ('Aktobe', 'aktobe')
on conflict (slug) do nothing;
