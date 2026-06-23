-- ============================================================================
-- Migration: store analytics (views + contacts) for competition / leaderboard.
-- Run once in the Supabase SQL Editor.
-- ============================================================================

create table if not exists events (
  id          bigint generated always as identity primary key,
  store_id    uuid references stores (id) on delete cascade,
  product_id  uuid references products (id) on delete set null,
  type        text not null check (type in ('view', 'contact')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_events_store   on events (store_id);
create index if not exists idx_events_created on events (created_at);

alter table events enable row level security;

-- Anyone (anonymous buyers) can log a view/contact event. No public reads of
-- raw rows — aggregates are exposed through the security-definer RPCs below.
drop policy if exists "insert events" on events;
create policy "insert events" on events
  for insert with check (type in ('view', 'contact'));

grant insert on events to anon, authenticated;

-- Leaderboard: stores ranked by activity over the last p_days days.
-- Score weights a contact (WhatsApp click) as 5 views.
create or replace function top_stores(p_days int default 30, p_limit int default 50)
returns table (
  id uuid, name text, slug text, logo_url text, is_verified boolean,
  views bigint, contacts bigint, score bigint
)
language sql stable security definer set search_path = public as $$
  select
    s.id, s.name, s.slug, s.logo_url, s.is_verified,
    count(*) filter (where e.type = 'view')    as views,
    count(*) filter (where e.type = 'contact') as contacts,
    count(*) filter (where e.type = 'view')
      + count(*) filter (where e.type = 'contact') * 5 as score
  from stores s
  left join events e
    on e.store_id = s.id
   and e.created_at > now() - make_interval(days => p_days)
  where s.status = 'approved'
  group by s.id
  order by score desc, s.created_at desc
  limit p_limit;
$$;

grant execute on function top_stores to anon, authenticated;

-- Single-store stats for the owner dashboard.
create or replace function store_stats(p_store uuid, p_days int default 30)
returns table (views bigint, contacts bigint)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where type = 'view')    as views,
    count(*) filter (where type = 'contact') as contacts
  from events
  where store_id = p_store
    and created_at > now() - make_interval(days => p_days);
$$;

grant execute on function store_stats to anon, authenticated;
