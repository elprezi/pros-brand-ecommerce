import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
  (typeof localStorage !== 'undefined' ? localStorage.getItem('pros_supabase_url') : '') ||
  '';

const supabaseAnonKey =
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
  (typeof localStorage !== 'undefined' ? localStorage.getItem('pros_supabase_anon_key') : '') ||
  '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
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
