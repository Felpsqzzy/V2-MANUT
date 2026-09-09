import {
  Boxes,
  CalendarClock,
  ClipboardList,
  Package,
  type LucideIcon,
} from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'

type Stat = {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

const STATS: Stat[] = [
  { label: 'Ordens abertas', value: '—', hint: 'Módulo em desenvolvimento', icon: ClipboardList },
  { label: 'Ativos cadastrados', value: '—', hint: 'Módulo em desenvolvimento', icon: Boxes },
  { label: 'Itens em estoque', value: '—', hint: 'Módulo em desenvolvimento', icon: Package },
  { label: 'Planos de PCM', value: '—', hint: 'Módulo em desenvolvimento', icon: CalendarClock },
]

export default async function DashboardPage() {
  const user = await getSessionUser()

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Painel de manutenção
        </h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Visão geral da operação. Os módulos serão liberados conforme avançamos
          nas próximas entregas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Identidade e acesso (M1)</h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Esta é a fundação da plataforma: autenticação corporativa via Microsoft
          Entra ID e controle de acesso baseado em papéis (RBAC) reaproveitando o
          banco de dados existente.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Sessão atual
            </dt>
            <dd className="mt-1 text-sm">{user?.email}</dd>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Papel
            </dt>
            <dd className="mt-1 text-sm">{user?.role ?? 'Não atribuído'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
