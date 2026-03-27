'use client'

import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  FolderOpen,
  Settings,
  LogOut,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { NavItem } from './nav-item'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clientes', icon: Users, label: 'Clientes' },
  { href: '/contratos', icon: FileText, label: 'Contratos' },
  { href: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { href: '/documentos', icon: FolderOpen, label: 'Documentos' },
]

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-14 items-center border-b border-zinc-200 px-4">
        <span className="text-sm font-bold text-zinc-900">Bastion</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="border-t border-zinc-200 px-3 py-3 space-y-1">
        <NavItem href="/configuracoes" icon={Settings} label="Configurações" />
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-sm font-normal text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair
          </Button>
        </form>
      </div>
    </aside>
  )
}
