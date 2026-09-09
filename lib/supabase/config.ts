// Central place to resolve Supabase connection settings.
// The browser client needs public (NEXT_PUBLIC_*) values; the server can also
// fall back to the server-only SUPABASE_URL that the project already injects.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''

export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// When the anon key / public URL are absent (e.g. before Entra ID + Supabase
// secrets are wired up) the app runs in a clearly-labeled preview mode instead
// of crashing the whole tree.
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
