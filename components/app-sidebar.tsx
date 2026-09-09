'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Boxes,
  CalendarClock,
  ClipboardList,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Sprout,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { NavItem } from '@/lib/auth/rbac'

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  ClipboardList,
  Boxes,
  Package,
  CalendarClock,
  Gauge,
  GraduationCap,
  Users,
  ShieldCheck,
}

export function AppSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sprout className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-foreground">Biotrop</p>
          <p className="text-xs text-muted-foreground">Manutenção</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Navegação principal">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.ready ? item.href : '#'}
              aria-disabled={!item.ready}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/15 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                !item.ready && 'pointer-events-none opacity-45',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {!item.ready && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Em breve
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
