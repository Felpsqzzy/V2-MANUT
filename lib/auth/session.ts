import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { NAV_ITEMS, type NavItem } from './rbac'

export type SessionUser = {
  id: string
  email: string
  displayName: string
  role: string | null
  // Whether this is a real Supabase session or the preview placeholder.
  isReal: boolean
}

// Profile shape is intentionally loose: the underlying `profiles` table is
// inherited from the existing database, so we read defensively.
type ProfileRow = Record<string, unknown> | null

function pickString(row: ProfileRow, keys: string[]): string | null {
  if (!row) return null
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) {
    // Preview placeholder so the authenticated shell is reviewable before the
    // Entra ID / Supabase secrets are wired up.
    return {
      id: 'preview',
      email: 'preview@biotrop.com.br',
      displayName: 'Usuário de Pré-visualização',
      role: 'Administrador',
      isReal: false,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const row = profile as ProfileRow

  return {
    id: user.id,
    email: user.email ?? pickString(row, ['email']) ?? '',
    displayName:
      pickString(row, ['full_name', 'name', 'display_name']) ??
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      'Usuário',
    role: pickString(row, ['role', 'role_name', 'cargo']),
    isReal: true,
  }
}

export async function hasPermission(code: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true // preview: show everything
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase.rpc('has_permission', {
    p_permission_code: code,
    p_user_id: user.id,
  })
  if (error) return false
  return Boolean(data)
}

export async function getVisibleNav(): Promise<NavItem[]> {
  if (!isSupabaseConfigured) return NAV_ITEMS
  const results = await Promise.all(
    NAV_ITEMS.map((item) =>
      item.permission ? hasPermission(item.permission) : Promise.resolve(true),
    ),
  )
  return NAV_ITEMS.filter((_, index) => results[index])
}
