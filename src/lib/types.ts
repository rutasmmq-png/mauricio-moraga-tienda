export type Locale = 'es' | 'en' | 'hi';
export type Platform = string; // ver PLATFORMS en site.ts
export type Delivery = 'digital' | 'physical';

export interface Language { code: string; name_es: string; name_en: string; name_hi: string; active: boolean; sort: number }
export interface Category { id: string; slug: string; name_es: string; name_en: string; name_hi: string; sort: number }

export interface Offer {
  id: string; book_id: string; platform: Platform; label: string; format: string | null;
  url: string | null; price: number | null; currency: string; delivery: Delivery;
  stock: number | null; active: boolean; sort: number;
}

export interface Book {
  id: string; slug: string; title: string; subtitle: string | null; author: string;
  short_description: string | null; long_description: string | null; cover_url: string | null;
  language_code: string | null; category_id: string | null; pages: number | null; formats: string[];
  price: number | null; currency: string; status: 'published' | 'draft'; featured: boolean; is_new: boolean;
  contents: string | null; isbn: string | null; published_on: string | null; digital_file_path: string | null;
  seo_title: string | null; seo_description: string | null; sort: number; created_at: string; updated_at: string;
  offers?: Offer[]; category?: Category | null; language?: Language | null;
}

export interface Review { id: string; book_id: string | null; name: string; rating: number; comment: string; approved: boolean; created_at: string }
export interface Post { id: string; slug: string; title: string; excerpt: string | null; body: string | null; cover_url: string | null; book_id: string | null; published: boolean; published_at: string | null }
export type Settings = Record<string, string>;

export interface CartItem {
  offerId: string; bookId: string; slug: string; title: string; label: string; cover: string | null;
  delivery: Delivery; price: number; currency: string; qty: number;
}
