# Kiyim MVP

**Local clothing discovery engine** — "Google for clothing in local city stores." Users search clothing items across multiple local stores (starting in Aktobe, Kazakhstan), compare prices, see availability, locate stores, and contact them directly via WhatsApp to try items in person.

This is **not** a marketplace, cart, checkout, or delivery platform. Discovery is centered on **products**, with stores as secondary entities.

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn-style UI primitives
- **Supabase** — Auth, Postgres, Storage
- **Vercel** hosting

## Architecture

```
src/
  app/            # routes (home, search, product, store, favorites, dashboard, admin)
  components/     # reusable UI (ui/ = primitives)
  lib/            # supabase clients, utils, favorites hook
  services/       # data-access layer (products, stores) — single place to swap search later
  types/          # shared TS types
supabase/
  schema.sql      # tables, indexes, full-text search RPC, RLS policies
  seed.sql        # demo store + products
```

## Setup

1. **Create a Supabase project**, then run `supabase/schema.sql` in the SQL Editor.
   Optionally run `supabase/seed.sql` for demo data.
   - **Already have an older DB?** Run `supabase/migration_seller.sql` instead — it adds the
     media tables, new product fields/statuses, and the storage bucket without dropping stores.
2. **Storage:** the schema/migration auto-creates a public `products` bucket with upload
   policies. No manual step needed.
3. **Env:** copy `.env.example` → `.env.local` and fill in the keys.
4. Install & run:

   ```bash
   npm install
   npm run dev
   ```

## Key flows

- **Users (public, no login):** home search → results with filters → product page → WhatsApp / Google Maps / store profile. Favorites saved in `localStorage`.
- **Stores (login required):** `/dashboard` → register store → **wait for admin approval** → add/edit/delete products. New stores never appear in search until approved (`stores.status = 'approved'`).
- **Admin:** `/admin` (password = `ADMIN_PASSWORD`) → approve/reject stores, remove products, view analytics.

## Search system

Search runs through the `search_products` Postgres RPC (`supabase/schema.sql`):

- Full-text via `tsvector` (`simple` config — avoids breaking on Kazakh).
- Typo/transliteration tolerance via `pg_trgm` trigram similarity.
- Filter-based querying (category, gender, store, size, price range).
- Only returns active products from **approved** stores.

All callers use the service layer (`src/services/products.ts`), so the engine can be swapped for **Meilisearch / ElasticSearch** later without touching pages.

## Seller dashboard

- `/dashboard` → stats (total / published / store status) + product management list
  (edit, publish, hide/show, archive, delete).
- `/dashboard/products/new` & `/dashboard/products/[id]/edit` → product form with
  multi-image + video upload straight to Supabase Storage, **Save Draft** / **Publish**.
- Product statuses: `draft → pending_review → published → hidden → archived`. Only
  `published` products from approved stores appear in home, search, and store pages.
- Schema: `stores` → `products` → `product_images` / `product_videos`. Reads go through the
  `products_with_media` view (aggregates media + store), so search/cards get everything in one query.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo.
3. Add the environment variables (Project → Settings → Environment Variables) — same keys as `.env.example`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ADMIN_PASSWORD` (**use a strong value, not `change-me`**), `NEXT_PUBLIC_SITE_URL` (your Vercel domain).
4. In Supabase → Authentication → URL Configuration, add your Vercel domain to the allowed redirect URLs.
5. Deploy.

**Security checklist**
- `.env.local` is gitignored — secrets never reach the repo. The service-role key is used only in
  server code (`src/lib/supabase/admin.ts`, admin route/actions) and never shipped to the browser.
- Row Level Security is enabled on all tables; the public anon key can only read approved/published data.
- Set a strong `ADMIN_PASSWORD` in production.

## Production notes / next steps

- Add icons (`/public/icon-192.png`, `/icon-512.png`) for full PWA install.
- Add client-side image compression before upload (Aktobe 4G).
- Consider debounced autocomplete on the search bar.
- Move admin auth to a proper role on `auth.users` once there's more than one admin.
