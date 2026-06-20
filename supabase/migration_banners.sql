-- ============================================================================
-- Migration: home-page promo banners (managed by admin).
-- Run once in the Supabase SQL Editor.
-- ============================================================================
create extension if not exists "uuid-ossp";

create table if not exists banners (
  id          uuid primary key default uuid_generate_v4(),
  image_url   text not null,
  link_url    text,
  title       text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table banners enable row level security;

-- Public can read active banners; admin writes via the service-role key (bypasses RLS).
drop policy if exists "read active banners" on banners;
create policy "read active banners" on banners for select using (is_active = true);

grant select on banners to anon, authenticated;
