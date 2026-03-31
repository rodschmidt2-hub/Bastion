'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, MoreHorizontal } from 'lucide-react'
import { ClienteDrawer } from './cliente-drawer'
import type { Cliente, ClienteStatus, ContatoCliente, Profile } from '@/types/database'

const statusBadge: Record<string, { label: string; dot: string; badge: string }> = {
  ativo:        { label: 'Ativo',        dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  inadimplente: { label: 'Inadimplente', dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700' },
  pausado:      { label: 'Pausado',      dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700' },
  suspenso:     { label: 'Suspenso',     dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700' },
  cancelado:    { label: 'Cancelado',    dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-500' },
  inativo:      { label: 'Inativo',      dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-500' },
}

const segmentoLabel: Record<string, string> = {
  solo: 'Solo',
  rede: 'Rede',
  especialidade: 'Especialidade',
}

const porteLabel: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
}

function formatMes(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const year = String(d.getFullYear()).slice(2)
  return `${month.charAt(0).toUpperCase() + month.slice(1)}/${year}`
}

function formatMRR(value: number | undefined): string {
  if (!value) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface ClientesTableProps {
  clientes: Cliente[]
  responsaveis: Pick<Profile, 'id' | 'nome' | 'email'>[]
  contatoMap: Record<string, ContatoCliente>
  mrrMap: Record<string, number>
}

export function ClientesTable({ clientes, responsaveis, contatoMap, mrrMap }: ClientesTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClienteStatus | ''>('')
  const [segmentoFilter, setSegmentoFilter] = useState('')
  const [responsavelFilter, setResponsavelFilter] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch =
      c.razao_social.toLowerCase().includes(q) ||
      (c.cnpj ?? '').includes(q) ||
      (c.cidade ?? '').toLowerCase().includes(q)
    const matchStatus = !statusFilter || c.status === statusFilter
    const matchSegmento = !segmentoFilter || c.segmento === segmentoFilter
    const matchResponsavel = !responsavelFilter || c.responsavel_id === responsavelFilter
    return matchSearch && matchStatus && matchSegmento && matchResponsavel
  })

  function openNew() {
    setEditingCliente(null)
    setDrawerOpen(true)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ, cidade..."
            className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ClienteStatus | '')}
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="inadimplente">Inadimplente</option>
          <option value="pausado">Pausado</option>
          <option value="suspenso">Suspenso</option>
          <option value="cancelado">Cancelado</option>
        </select>

        {/* Segmento */}
        <select
          value={segmentoFilter}
          onChange={(e) => setSegmentoFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todos os segmentos</option>
          <option value="solo">Solo</option>
          <option value="rede">Rede</option>
          <option value="especialidade">Especialidade</option>
        </select>

        {/* Responsável */}
        <select
          value={responsavelFilter}
          onChange={(e) => setResponsavelFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todos os responsáveis</option>
          {responsaveis.map((r) => (
            <option key={r.id} value={r.id}>{r.nome ?? r.email}</option>
          ))}
        </select>

        <div className="ml-auto">
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            + Novo cliente
          </button>
        </div>
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
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Contato Principal</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Responsável</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">MRR</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Desde</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((cliente) => {
              const badge = statusBadge[cliente.status as ClienteStatus] ?? statusBadge.cancelado
              const responsavel = responsaveis.find((r) => r.id === cliente.responsavel_id)
              const contato = contatoMap[cliente.id]
              const initials = cliente.razao_social.slice(0, 2).toUpperCase()
              const mrr = mrrMap[cliente.id]
              const isInativo = cliente.status === 'inativo' || cliente.status === 'cancelado'

              // Subtitle: "UF • Segmento • Porte"
              const subtitleParts = [
                cliente.uf,
                cliente.segmento ? segmentoLabel[cliente.segmento] : null,
                cliente.porte ? porteLabel[cliente.porte] : null,
              ].filter(Boolean)

              return (
                <tr key={cliente.id} className={`group hover:bg-slate-50/50 ${isInativo ? 'opacity-70' : ''}`}>
                  {/* Cliente */}
                  <td className="px-5 py-3.5">
                    <Link href={`/clientes/${cliente.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 hover:text-blue-600">{cliente.razao_social}</p>
                        {subtitleParts.length > 0 && (
                          <p className="text-xs text-slate-400">{subtitleParts.join(' • ')}</p>
                        )}
                      </div>
                    </Link>
                  </td>

                  {/* Contato Principal */}
                  <td className="px-5 py-3.5">
                    {contato ? (
                      <div>
                        <p className="text-sm text-slate-700">{contato.nome}</p>
                        <p className="text-xs text-slate-400">
                          {[contato.cargo, contato.whatsapp].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* Responsável */}
                  <td className="px-5 py-3.5">
                    {responsavel ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-semibold text-white">
                          {(responsavel.nome ?? responsavel.email).slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-600">{responsavel.nome ?? responsavel.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  {/* MRR */}
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-semibold ${mrr ? 'text-slate-800' : 'text-slate-300'}`}>
                      {formatMRR(mrr)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </td>

                  {/* Desde */}
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {formatMes(cliente.created_at)}
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Ver perfil"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {filtered.length > 0 && (
        <div className="border-t border-slate-50 px-5 py-3 text-center text-xs text-slate-400">
          Mostrando {filtered.length} de {clientes.length} clientes
        </div>
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
