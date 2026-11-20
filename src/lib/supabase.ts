import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

/** True only when both credentials are present. Otherwise the app uses local IndexedDB mode. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** Null in local mode — every call is guarded by the data service. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'market-research.auth',
      },
    })
  : null

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured. Running in local IndexedDB mode.')
  }
  return supabase
}
