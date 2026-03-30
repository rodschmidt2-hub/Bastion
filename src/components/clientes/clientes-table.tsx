'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Pencil, ArrowRight } from 'lucide-react'
import { ClienteDrawer } from './cliente-drawer'
import { HealthScoreBadge } from './health-score-badge'
import type { Cliente, ClienteStatus, ContatoCliente, Profile } from '@/types/database'

const statusBadge: Record<string, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700' },
  inadimplente: { label: 'Inadimplente', className: 'bg-red-50 text-red-700' },
  pausado: { label: 'Pausado', className: 'bg-amber-50 text-amber-700' },
  cancelado: { label: 'Cancelado', className: 'bg-slate-100 text-slate-500' },
  inativo: { label: 'Inativo', className: 'bg-slate-100 text-slate-500' },
  suspenso: { label: 'Suspenso', className: 'bg-orange-50 text-orange-700' },
}

const segmentoLabel: Record<string, string> = {
  solo: 'Solo',
  rede: 'Rede',
  especialidade: 'Especialidade',
}

function NpsBadge({ score }: { score: number | undefined }) {
  if (score === undefined) return <span className="text-xs text-slate-300">—</span>
  const [cls, label] = score >= 9
    ? ['bg-emerald-50 text-emerald-700', 'Promotor']
    : score >= 7
    ? ['bg-amber-50 text-amber-700', 'Neutro']
    : ['bg-red-50 text-red-700', 'Detrator']
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {score} · {label}
    </span>
  )
}

interface ClientesTableProps {
  clientes: Cliente[]
  responsaveis: Pick<Profile, 'id' | 'nome' | 'email'>[]
  contatoMap: Record<string, ContatoCliente>
  npsMap: Record<string, number>
  healthScoreMap: Record<string, { score: number; pontualidade: number; nps: number; longevidade: number; suspenso: boolean }>
}

export function ClientesTable({ clientes, responsaveis, contatoMap, npsMap, healthScoreMap }: ClientesTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClienteStatus | ''>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  const filtered = clientes.filter((c) => {
    const matchSearch = c.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj ?? '').includes(search)
    const matchStatus = !statusFilter || c.status === statusFilter
    return matchSearch && matchStatus
  })

  function openNew() {
    setEditingCliente(null)
    setDrawerOpen(true)
  }

  function openEdit(cliente: Cliente) {
    setEditingCliente(cliente)
    setDrawerOpen(true)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou CNPJ..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ClienteStatus | '')}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inadimplente">Inadimplente</option>
            <option value="pausado">Pausado</option>
            <option value="inativo">Inativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-xl bg-slate-50 p-4">
            <Search className="h-6 w-6 text-slate-300" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">
            {clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum resultado encontrado'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {clientes.length === 0 ? 'Clique em "Novo cliente" para começar' : 'Tente ajustar os filtros'}
          </p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Segmento</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Responsável</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">NPS</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Health</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((cliente) => {
              const badge = statusBadge[cliente.status as ClienteStatus] ?? statusBadge.cancelado
              const responsavel = responsaveis.find((r) => r.id === cliente.responsavel_id)
              const contatoPrincipal = contatoMap[cliente.id]
              const initials = cliente.razao_social.slice(0, 2).toUpperCase()

              return (
                <tr key={cliente.id} className="group hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <Link href={`/clientes/${cliente.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 hover:text-blue-600">{cliente.razao_social}</p>
                        {contatoPrincipal ? (
                          <p className="text-xs text-slate-400">
                            {contatoPrincipal.nome}
                            {contatoPrincipal.whatsapp && ` · ${contatoPrincipal.whatsapp}`}
                          </p>
                        ) : (
                          cliente.cnpj && <p className="text-xs text-slate-400">{cliente.cnpj}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {cliente.segmento ? segmentoLabel[cliente.segmento] : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        cliente.status === 'ativo' ? 'bg-emerald-500' :
                        cliente.status === 'inadimplente' ? 'bg-red-500' :
                        cliente.status === 'pausado' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {responsavel ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                          {(responsavel.nome ?? responsavel.email).slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-600">{responsavel.nome ?? responsavel.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <NpsBadge score={npsMap[cliente.id]} />
                  </td>
                  <td className="px-5 py-3.5">
                    {healthScoreMap[cliente.id] ? (
                      <HealthScoreBadge data={healthScoreMap[cliente.id]} />
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(cliente)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Ver perfil <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <ClienteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cliente={editingCliente}
        responsaveis={responsaveis}
      />
    </>
  )
}
