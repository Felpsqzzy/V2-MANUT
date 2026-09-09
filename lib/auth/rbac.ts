// Navigation catalog for the maintenance platform. Each entry is gated by a
// permission code that maps to the inherited `has_permission()` RPC in Supabase.
// `permission: null` means always visible to any authenticated user.
export type NavItem = {
  label: string
  href: string
  icon: string
  permission: string | null
  ready: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', permission: null, ready: true },
  { label: 'Ordens de Serviço', href: '/ordens', icon: 'ClipboardList', permission: 'os.view', ready: false },
  { label: 'Ativos & Equipamentos', href: '/ativos', icon: 'Boxes', permission: 'assets.view', ready: false },
  { label: 'Almoxarifado', href: '/almoxarifado', icon: 'Package', permission: 'inventory.view', ready: false },
  { label: 'PCM', href: '/pcm', icon: 'CalendarClock', permission: 'pcm.view', ready: false },
  { label: 'Utilidades', href: '/utilidades', icon: 'Gauge', permission: 'utilities.view', ready: false },
  { label: 'Treinamentos', href: '/treinamentos', icon: 'GraduationCap', permission: 'training.view', ready: false },
  { label: 'Reuniões', href: '/reunioes', icon: 'Users', permission: 'meetings.view', ready: false },
  { label: 'Administração', href: '/admin', icon: 'ShieldCheck', permission: 'admin.manage', ready: false },
]
