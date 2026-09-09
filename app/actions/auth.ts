'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'

/**
 * Starts the Microsoft Entra ID (Azure) SSO flow through Supabase Auth.
 * Requires the Azure provider to be configured in Supabase and the anon key to
 * be present in the environment.
 */
export async function signInWithEntraId() {
  if (!isSupabaseConfigured) {
    redirect('/login?error=config')
  }

  const supabase = await createClient()
  const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'openid email profile offline_access',
      redirectTo,
    },
  })

  if (error || !data?.url) {
    redirect('/auth/error')
  }

  redirect(data.url)
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/login')
}
