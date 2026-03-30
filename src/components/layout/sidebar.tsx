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

interface SidebarProps {
  role?: UserRole
  nome?: string
}

const roleLabel: Record<string, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
}

export function Sidebar({ role, nome }: SidebarProps) {
  const initials = (nome ?? 'U').slice(0, 2).toUpperCase()
  const isAdmin = role === 'admin'

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-100 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm">
            <span className="text-sm font-bold text-white">B</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">Bastion</p>
            <p className="text-[10px] text-slate-400 leading-tight">Agência</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {/* Principal */}
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[.6px] text-slate-400">
          Principal
        </p>
        <div className="space-y-0.5 mb-4">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/clientes" icon={Users} label="Clientes" />
        </div>

        {/* Operação */}
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[.6px] text-slate-400">
          Operação
        </p>
        <div className="space-y-0.5 mb-4">
          <NavItem href="/contratos" icon={FileText} label="Contratos" />
          <NavItem href="/financeiro" icon={Wallet} label="Financeiro" />
          <NavItem href="/documentos" icon={FolderOpen} label="Documentos" />
          {isAdmin && <NavItem href="/produtos" icon={Package} label="Catálogo de Produtos" />}
        </div>

        {/* Administração */}
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[.6px] text-slate-400">
          Administração
        </p>
        <div className="space-y-0.5">
          {isAdmin && <NavItem href="/usuarios" icon={UserCog} label="Usuários" />}
          <NavItem href="/configuracoes" icon={Settings} label="Configurações" />
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-100 px-2 py-2">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">{nome ?? 'Usuário'}</p>
            {role && <p className="text-[10px] text-slate-400">{roleLabel[role] ?? role}</p>}
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Sair"
              className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
