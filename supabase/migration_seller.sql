-- ============================================================================
-- Migration: Seller Dashboard + media tables.
-- Run this ONCE on a database that already has the original schema.
-- Safe to run top-to-bottom in the Supabase SQL Editor. Preserves stores.
-- ============================================================================

create extension if not exists "pg_trgm";
create extension if not exists "uuid-ossp";

-- 1. New product fields ------------------------------------------------------
alter table products add column if not exists brand text;
alter table products add column if not exists color text;
alter table products add column if not exists stock_quantity int not null default 0;

-- 2. Migrate product_status enum -> draft/pending_review/published/hidden/archived
-- These run as top-level statements FIRST so the policy/function dependencies on
-- the status column are gone before we change the column type.
drop function if exists search_products(text, uuid, gender_type, uuid, text, numeric, numeric, int, int);
drop policy if exists "read active products" on products;
drop policy if exists "read products" on products;

do $$
begin
  alter table products alter column status drop default;
  alter table products alter column status type text using status::text;

  update products set status = case status
    when 'active' then 'published'
    when 'out_of_stock' then 'hidden'
    else status end;

  drop type if exists product_status;
  create type product_status as enum ('draft', 'pending_review', 'published', 'hidden', 'archived');

  alter table products alter column status type product_status using status::product_status;
  alter table products alter column status set default 'draft';
end $$;

-- 3. Rebuild search_vector to include brand ----------------------------------
alter table products drop column if exists search_vector;
alter table products add column search_vector tsvector generated always as (
  to_tsvector('simple',
    coalesce(title, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(description, ''))
) stored;
create index if not exists idx_products_search_vector on products using gin (search_vector);

-- 4. Media tables ------------------------------------------------------------
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

create index if not exists idx_product_images_product on product_images (product_id);
create index if not exists idx_product_videos_product on product_videos (product_id);

-- 5. Migrate existing images[] / video_url into the new tables, then drop them
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'products' and column_name = 'images') then
    insert into product_images (product_id, url, sort_order, is_primary)
    select p.id, u.url, u.ord::int, (u.ord = 1)
    from products p, unnest(p.images) with ordinality as u(url, ord)
    where p.images is not null;
    alter table products drop column images;
  end if;

  if exists (select 1 from information_schema.columns
             where table_name = 'products' and column_name = 'video_url') then
    insert into product_videos (product_id, url, sort_order)
    select id, video_url, 1 from products where video_url is not null and video_url <> '';
    alter table products drop column video_url;
  end if;
end $$;

-- 6. View with aggregated media + store --------------------------------------
drop view if exists products_with_media;
create view products_with_media
with (security_invoker = on) as
select
  p.*,
  coalesce((select array_agg(pi.url order by pi.is_primary desc, pi.sort_order)
            from product_images pi where pi.product_id = p.id), '{}') as images,
  coalesce((select array_agg(pv.url order by pv.sort_order)
            from product_videos pv where pv.product_id = p.id), '{}') as videos,
  (select jsonb_build_object(
      'id', s.id, 'name', s.name, 'slug', s.slug, 'whatsapp', s.whatsapp,
      'instagram', s.instagram, 'address', s.address, 'lat', s.lat,
      'lng', s.lng, 'logo_url', s.logo_url, 'status', s.status)
   from stores s where s.id = p.store_id) as store
from products p;

grant select on products_with_media to anon, authenticated;

-- 7. Search RPC --------------------------------------------------------------
create or replace function search_products(
  q text default null, p_category uuid default null, p_gender gender_type default null,
  p_store uuid default null, p_size text default null, p_min_price numeric default null,
  p_max_price numeric default null, p_limit int default 24, p_offset int default 0
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
    and (q is null or q = ''
         or pm.search_vector @@ plainto_tsquery('simple', q)
         or pm.title % q)
  order by
    case when q is null or q = '' then 0
         else ts_rank(pm.search_vector, plainto_tsquery('simple', q)) + similarity(pm.title, q) end desc,
    pm.created_at desc
  limit p_limit offset p_offset;
$$;

grant execute on function search_products to anon, authenticated;

-- 8. RLS ---------------------------------------------------------------------
alter table product_images enable row level security;
alter table product_videos enable row level security;

drop policy if exists "read products" on products;
create policy "read products" on products
  for select using (
    (status = 'published' and exists (
      select 1 from stores s where s.id = products.store_id and s.status = 'approved'))
    or exists (select 1 from stores s where s.id = products.store_id and s.owner_id = auth.uid())
  );
-- (Old "read active products" policy, if present, is replaced.)
drop policy if exists "read active products" on products;

drop policy if exists "read product images" on product_images;
create policy "read product images" on product_images for select using (true);
drop policy if exists "owner manage product images" on product_images;
create policy "owner manage product images" on product_images
  for all using (
    exists (select 1 from products p join stores s on s.id = p.store_id
            where p.id = product_images.product_id and s.owner_id = auth.uid()))
  with check (
    exists (select 1 from products p join stores s on s.id = p.store_id
            where p.id = product_images.product_id and s.owner_id = auth.uid()));

drop policy if exists "read product videos" on product_videos;
create policy "read product videos" on product_videos for select using (true);
drop policy if exists "owner manage product videos" on product_videos;
create policy "owner manage product videos" on product_videos
  for all using (
    exists (select 1 from products p join stores s on s.id = p.store_id
            where p.id = product_videos.product_id and s.owner_id = auth.uid()))
  with check (
    exists (select 1 from products p join stores s on s.id = p.store_id
            where p.id = product_videos.product_id and s.owner_id = auth.uid()));

-- 9. Storage bucket + policies ----------------------------------------------
insert into storage.buckets (id, name, public) values ('products', 'products', true)
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
