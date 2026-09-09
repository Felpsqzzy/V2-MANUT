import { redirect } from 'next/navigation'
import { Sprout } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  // A real signed-in user should never see the login page.
  if (isSupabaseConfigured) {
    const user = await getSessionUser()
    if (user?.isReal) redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sprout className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance">
            Biotrop Manutenção
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Acesse a plataforma com sua conta corporativa Microsoft.
          </p>
        </div>

        <LoginForm configured={isSupabaseConfigured} showConfigError={error === 'config'} />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Acesso restrito a colaboradores autorizados da Biotrop.
        </p>
      </div>
    </main>
  )
}
