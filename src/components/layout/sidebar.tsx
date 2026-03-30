'use client'

import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  FolderOpen,
  Settings,
  LogOut,
  UserCog,
  Package,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { NavItem } from './nav-item'
import type { UserRole } from '@/types/database'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clientes', icon: Users, label: 'Clientes' },
  { href: '/contratos', icon: FileText, label: 'Contratos' },
  { href: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { href: '/documentos', icon: FolderOpen, label: 'Documentos' },
]

interface SidebarProps {
  role?: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-100 bg-white">
      <div className="flex h-14 items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-xs font-bold text-white">B</span>
          </div>
          <span className="text-sm font-semibold text-slate-900">Bastion</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
        {role === 'admin' && (
          <NavItem href="/produtos" icon={Package} label="Produtos" />
        )}
        {role === 'admin' && (
          <NavItem href="/usuarios" icon={UserCog} label="Usuários" />
        )}
      </nav>

      <div className="border-t border-slate-100 px-3 py-3 space-y-0.5">
        <NavItem href="/configuracoes" icon={Settings} label="Configurações" />
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all duration-150 hover:bg-slate-50 hover:text-slate-800"
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-400" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
