'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { signInWithEntraId } from '@/app/actions/auth'

function MicrosoftMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

export function LoginForm({
  configured,
  showConfigError,
}: {
  configured: boolean
  showConfigError: boolean
}) {
  const [pending, setPending] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
      {(!configured || showConfigError) && (
        <div className="mb-5 flex gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-pretty text-muted-foreground">
            O login SSO ainda não está ativo neste ambiente. Configure o
            provedor <strong className="text-foreground">Microsoft Entra ID</strong> no
            Supabase e defina as variáveis públicas para habilitar o acesso.
          </p>
        </div>
      )}

      <form action={signInWithEntraId} onSubmit={() => setPending(true)}>
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <MicrosoftMark />
          )}
          {pending ? 'Redirecionando…' : 'Entrar com a conta Microsoft'}
        </button>
      </form>
    </div>
  )
}
