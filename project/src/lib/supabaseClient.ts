import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): { client: SupabaseClient; url: string; key: string } | { client: null; error: string; url: boolean; key: boolean } {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !key) {
    return { client: null, error: 'ENV missing', url: !!url, key: !!key };
  }

  if (!_client) {
    _client = createClient(url, key);
  }

  return { client: _client, url, key };
}
