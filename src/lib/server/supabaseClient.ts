import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
  (typeof localStorage !== 'undefined' ? localStorage.getItem('pros_supabase_url') : '') ||
  'https://fofvmbusmxajgiymbzqs.supabase.co';

const supabaseAnonKey =
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  (typeof localStorage !== 'undefined' ? localStorage.getItem('pros_supabase_anon_key') : '') ||
  'sb_publishable_2v_vpVEZf7qSJKAHWiS6zQ_5BjTDLhM';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
}

export function saveSupabaseConfig(url: string, key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pros_supabase_url', url.trim());
    localStorage.setItem('pros_supabase_anon_key', key.trim());
  }
}
