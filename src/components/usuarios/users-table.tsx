'use client'

import { useState, useTransition } from 'react'
import { updateUserRole, toggleUserActive } from '@/app/actions/users'
import type { Profile, UserRole } from '@/types/database'

const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  comercial: 'Comercial',
  financeiro: 'Financeiro',
  operacional: 'Operacional',
}

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-violet-50 text-violet-700',
  gestor: 'bg-blue-50 text-blue-700',
  comercial: 'bg-emerald-50 text-emerald-700',
  financeiro: 'bg-amber-50 text-amber-700',
  operacional: 'bg-slate-100 text-slate-600',
}

interface UsersTableProps {
  users: Profile[]
  currentUserId: string
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100">
          <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Usuário</th>
          <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Perfil</th>
          <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
          <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Ações</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
          />
        ))}
      </tbody>
    </table>
  )
}

function UserRow({ user, isSelf }: { user: Profile; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition()
  const initials = (user.nome ?? user.email).slice(0, 2).toUpperCase()

  function handleRoleChange(role: UserRole) {
    startTransition(async () => { await updateUserRole(user.id, role) })
  }

  function handleToggleActive() {
    startTransition(async () => { await toggleUserActive(user.id, !user.ativo) })
  }

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <div>
            <p className="font-medium text-slate-800">{user.nome || '—'}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          {isSelf && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Você</span>
          )}
        </div>
      </td>

      <td className="px-5 py-3.5">
        <select
          value={user.role}
          disabled={isSelf || isPending}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          className={`rounded-lg border-0 px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed ${roleBadge[user.role as UserRole] ?? roleBadge.operacional}`}
        >
          <option value="admin">Admin</option>
          <option value="gestor">Gestor</option>
        </select>
      </td>

      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            user.ativo
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${user.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {user.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>

      <td className="px-5 py-3.5 text-right">
        {!isSelf && (
          <button
            onClick={handleToggleActive}
            disabled={isPending}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed"
          >
            {user.ativo ? 'Desativar' : 'Reativar'}
          </button>
        )}
      </td>
    </tr>
  )
}
