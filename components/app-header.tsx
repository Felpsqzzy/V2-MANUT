import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import type { SessionUser } from '@/lib/auth/session'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card/40 px-6 py-3">
      <div className="min-w-0">
        {!user.isReal && (
          <span className="mb-0.5 inline-block rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            Modo pré-visualização
          </span>
        )}
        <p className="truncate text-sm text-muted-foreground">
          Bem-vindo, <span className="text-foreground">{user.displayName}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{user.displayName}</p>
          <p className="text-xs text-muted-foreground">{user.role ?? 'Sem cargo'}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
          {initials(user.displayName) || 'BT'}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            title="Sair"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Sair da conta</span>
          </button>
        </form>
      </div>
    </header>
  )
}
