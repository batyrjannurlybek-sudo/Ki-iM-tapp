You are a senior startup CTO and principal full-stack engineer.

Your task is to build a production-ready MVP of a mobile-first PWA web application for clothing discovery in local city markets.

PROJECT NAME:
Temporary name: "Kiyim MVP" (can be changed later)

CORE IDEA:
This is NOT a marketplace.
This is NOT an e-commerce checkout system.
This is NOT a delivery platform.

This is a LOCAL CLOTHING DISCOVERY ENGINE.

Users search clothing items across multiple local stores in one place instead of browsing Instagram manually.

TARGET MARKET:

* Country: Kazakhstan
* First city: Aktobe
* Expansion later to other cities in Kazakhstan

REAL USER PROBLEM:
Users waste a lot of time searching clothing in Instagram and visiting multiple stores blindly.
They want to quickly:

* find clothing items
* compare prices
* see availability
* locate stores
* go and try items physically in-store

KEY PRODUCT PRINCIPLE:
The system is centered around PRODUCTS, not stores.

STORES are secondary entities.

PRODUCT SEARCH is the core experience.

DO NOT BUILD:

* payment system
* cart
* checkout
* delivery
* logistics system

This is intentionally excluded to reduce complexity.

---

## CORE FEATURES

### 1. USER SIDE (PUBLIC)

#### Home Page

* Large search bar (primary UI element)
* Trending searches
* Popular categories:

  * Men
  * Women
  * Shoes
  * Streetwear
  * Accessories
* New arrivals
* Popular products
* Featured stores (secondary)

#### Product Search

* Search by:

  * product name
  * category
  * style
  * price range
* Filters:

  * price min/max
  * size
  * gender
  * store
  * category

#### Product Page

Must include:

* high-quality image gallery
* video support
* price
* sizes available
* description
* store name
* store location
* “Open in Google Maps”
* “Contact via WhatsApp”
* “View store profile”

#### Store Page

* store branding (logo, cover image)
* description
* address + map
* Instagram link
* WhatsApp link
* all products from this store

#### Favorites

* save products
* save stores

---

### 2. STORE SIDE (SELLER DASHBOARD)

#### Store Registration

* name
* phone
* Instagram
* address
* category (optional)
* approval required

#### Store Dashboard

* add products
* edit products
* delete products
* upload multiple images
* upload short videos
* manage sizes and price

#### Product Management

Each product includes:

* title
* category
* price
* sizes
* description
* images (multiple)
* optional video
* availability status

---

### 3. ADMIN PANEL

* approve/reject stores
* moderate products
* remove spam or low-quality content
* view analytics:

  * number of stores
  * number of products
  * searches
  * active users

---

## CRITICAL BUSINESS RULES

1. New stores do NOT appear immediately in search.
   They require admin approval.

2. Product quality matters more than store count.

3. System prioritizes PRODUCTS in search results.

4. Store pages exist, but discovery happens via products.

---

## UX / UI REQUIREMENTS

* premium modern fashion marketplace design
* mobile-first (80% users mobile)
* inspired by modern apps like:

  * Zara
  * ASOS
  * Farfetch
* large product images
* minimal UI clutter
* fast search experience (<200ms perceived response)
* infinite scroll product feed

---

## TECH STACK (MANDATORY)

Frontend:

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Shadcn UI

Backend:

* Supabase (Auth + DB + Storage)

Database:

* PostgreSQL

Storage:

* Supabase Storage (images/videos)

Hosting:

* Vercel

---

## ARCHITECTURE REQUIREMENTS

* clean modular architecture
* separation:

  * /app (pages)
  * /components
  * /lib
  * /services
  * /types
* reusable UI components
* scalable schema design
* proper indexing for search performance

---

## SEARCH SYSTEM REQUIREMENT (IMPORTANT)

Implement a basic but scalable search system:

* full-text search for product names
* filter-based querying
* prepare architecture for future ElasticSearch / Meilisearch upgrade

---

## IMPORTANT PRODUCT STRATEGY

This is NOT Amazon.
This is NOT Kaspi.
This is NOT Shopify clone.

This is:

> "Google for clothing in local city stores"

Focus on:

* discovery
* speed
* simplicity

---

## DELIVERY INSTRUCTIONS

1. First analyze the product critically:

   * risks
   * weak points
   * scaling issues

2. Then propose improved UX if needed

3. Then generate:

   * full project structure
   * database schema
   * core components
   * key pages
   * basic working MVP implementation

4. Do NOT over-engineer

5. Keep MVP realistic and buildable by 1 developer in 2–6 weeks

---

## FINAL GOAL

A working MVP where:

* stores can register and upload products
* users can search clothing across all stores
* users can view products and contact stores directly
* system is fast, clean, and usable in real city conditions
