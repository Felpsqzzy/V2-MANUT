import Link from 'next/link'
import { AlertOctagon } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-primary">
          <AlertOctagon className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-semibold">Não foi possível concluir o login</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          Houve uma falha ao autenticar com a conta Microsoft. Tente novamente
          ou contate o administrador do sistema.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Voltar ao login
        </Link>
      </div>
    </main>
  )
}
