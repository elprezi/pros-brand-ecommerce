import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Product, Order } from '../../types/ecommerce';
import type { MediaItem } from '../../store/cmsContext';

// 1. SYNC PRODUCTS TO SUPABASE
export async function syncProductsFromSupabase(): Promise<Product[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data || data.length === 0) return null;
    return data as Product[];
  } catch (e) {
    console.warn('Supabase products fetch fallback:', e);
    return null;
  }
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('products').upsert(product);
    return !error;
  } catch (e) {
    console.warn('Supabase product save error:', e);
    return false;
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    return !error;
  } catch (e) {
    console.warn('Supabase product delete error:', e);
    return false;
  }
}

// 2. SYNC MEDIA LIBRARY TO SUPABASE
export async function syncMediaFromSupabase(): Promise<MediaItem[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('media_library').select('*');
    if (error || !data || data.length === 0) return null;
    return data as MediaItem[];
  } catch (e) {
    console.warn('Supabase media fetch fallback:', e);
    return null;
  }
}

export async function saveMediaToSupabase(media: MediaItem): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('media_library').upsert(media);
    return !error;
  } catch (e) {
    console.warn('Supabase media save error:', e);
    return false;
  }
}

export async function deleteMediaFromSupabase(mediaId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('media_library').delete().eq('id', mediaId);
    return !error;
  } catch (e) {
    console.warn('Supabase media delete error:', e);
    return false;
  }
}

// 3. SYNC ORDERS TO SUPABASE
export async function syncOrdersFromSupabase(): Promise<Order[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase.from('orders').select('*');
    if (error || !data || data.length === 0) return null;
    return data as Order[];
  } catch (e) {
    console.warn('Supabase orders fetch fallback:', e);
    return null;
  }
}

export async function saveOrderToSupabase(order: Order): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.from('orders').upsert(order);
    return !error;
  } catch (e) {
    console.warn('Supabase order save error:', e);
    return false;
  }
}
