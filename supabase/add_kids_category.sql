-- Adds the "Kids" clothing category to an existing database.
-- Run once in the Supabase SQL Editor.
insert into categories (name, slug, sort_order)
values ('Kids', 'kids', 3)
on conflict (slug) do nothing;
