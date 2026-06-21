export type StoreStatus = "pending" | "approved" | "rejected" | "suspended";
export type ProductStatus = "draft" | "pending_review" | "published" | "hidden" | "archived";
export type Gender = "men" | "women" | "unisex" | "kids";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Store {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  city_id: string | null;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
  cover_url: string | null;
  status: StoreStatus;
  is_verified: boolean;
  plan_until: string | null;
  created_at: string;
  updated_at: string;
}

/** Store summary embedded in the products_with_media view (jsonb). */
export interface StoreSummary {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
  status: StoreStatus;
}

export interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  gender: Gender;
  brand: string | null;
  color: string | null;
  price: number;
  currency: string;
  sizes: string[];
  stock_quantity: number;
  status: ProductStatus;
  search_count: number;
  created_at: string;
  updated_at: string;
  // From the products_with_media view (aggregated):
  images: string[];
  videos: string[];
  store: StoreSummary | null;
}

/** Alias kept for existing call sites — the view always includes the store. */
export type ProductWithStore = Product;

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVideo {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}

/** Input payload for creating/updating a product (excludes media + server fields). */
export interface ProductInput {
  title: string;
  description: string | null;
  category_id: string | null;
  gender: Gender;
  brand: string | null;
  color: string | null;
  price: number;
  sizes: string[];
  stock_quantity: number;
  status: ProductStatus;
}

export interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  gender?: Gender;
  store?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}
