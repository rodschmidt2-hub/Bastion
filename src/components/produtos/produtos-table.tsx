'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Power } from 'lucide-react'
import { toggleProdutoAtivo } from '@/app/actions/produtos'
import { ProdutoDrawer } from './produto-drawer'
import type { ProdutoAgencia, ProdutoOferta } from '@/types/database'

const tipoLabel: Record<string, string> = {
  recorrente: 'Recorrente',
  pontual:    'Pontual',
  hibrido:    'Híbrido',
}

const periodicidadeLabel: Record<string, string> = {
  mensal:      'Mensal',
  trimestral:  'Trimestral',
  semestral:   'Semestral',
  anual:       'Anual',
}

interface ProdutosTableProps {
  produtos: ProdutoAgencia[]
  ofertasMap: Record<string, ProdutoOferta[]>
}

export function ProdutosTable({ produtos, ofertasMap }: ProdutosTableProps) {
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editing, setEditing]           = useState<ProdutoAgencia | null>(null)
  const [isPending, startTransition]    = useTransition()

  function openNew() {
    setEditing(null)
    setDrawerOpen(true)
  }

  function openEdit(p: ProdutoAgencia) {
    setEditing(p)
    setDrawerOpen(true)
  }

  function handleToggle(p: ProdutoAgencia) {
    const label = p.ativo ? 'desativar' : 'ativar'
    if (!confirm(`Deseja ${label} o produto "${p.nome}"?`)) return
    startTransition(async () => { await toggleProdutoAtivo(p.id, !p.ativo) })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <p className="text-sm text-slate-500">{produtos.length} produtos no catálogo</p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo produto
        </button>
      </div>

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-slate-600">Nenhum produto cadastrado</p>
          <p className="mt-1 text-xs text-slate-400">Clique em "Novo produto" para começar</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Produto</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Tipo</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Periodicidade</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Valor base</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Custo base</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {produtos.map((p) => (
              <tr key={p.id} className="group hover:bg-slate-50/50">
                <td className="px-5 py-3.5">
                  <p className={`font-medium ${p.ativo ? 'text-slate-800' : 'text-slate-400'}`}>
                    {p.nome}
                  </p>
                  {p.categoria && (
                    <p className="text-xs text-slate-400">{p.categoria}</p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  {tipoLabel[p.tipo] ?? p.tipo}
                </td>
                <td className="px-5 py-3.5 text-slate-500">
                  {p.periodicidade ? periodicidadeLabel[p.periodicidade] ?? p.periodicidade : '—'}
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                  {p.valor_padrao != null
                    ? p.valor_padrao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </td>
                <td className="px-5 py-3.5 text-right text-slate-500">
                  {p.custo_base != null
                    ? p.custo_base.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.ativo
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${p.ativo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggle(p)}
                      disabled={isPending}
                      className={`rounded-lg p-1.5 transition hover:bg-slate-100 ${
                        p.ativo ? 'text-slate-400 hover:text-amber-500' : 'text-slate-400 hover:text-emerald-600'
                      }`}
                      title={p.ativo ? 'Desativar' : 'Ativar'}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ProdutoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        produto={editing}
        ofertas={editing ? (ofertasMap[editing.id] ?? []) : []}
      />
    </>
  )
}
