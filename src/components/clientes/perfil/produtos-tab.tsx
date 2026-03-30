'use client'

import { useState, useTransition, Fragment } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { atualizarStatusContratoItem } from '@/app/actions/contratos'
import { AdicionarProdutoModal } from './adicionar-produto-modal'
import { RenovacaoModal } from './renovacao-modal'
import { RenovacoesHistorico } from './renovacoes-historico'
import type { ProdutoContratadoView, ProdutoAgencia, ProdutoOferta, ProdutoStatus, Contrato, Renovacao } from '@/types/database'

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function VencimentoBadge({ dataFim, produtoTipo }: { dataFim: string | null; produtoTipo: string | null }) {
  if (produtoTipo === 'pontual') return null
  if (!dataFim) return <span className="text-xs text-slate-400">Sem vencimento</span>

  const days = daysUntil(dataFim)
  const label = new Date(dataFim).toLocaleDateString('pt-BR')

  if (days < 0) {
    return <span className="text-xs font-medium text-red-600">{label} <span className="text-red-400">(vencido)</span></span>
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        {label} · {days}d
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        {label} · {days}d
      </span>
    )
  }
  return <span className="text-xs text-slate-500">{label}</span>
}

const statusBadge: Record<string, string> = {
  ativo:           'bg-emerald-50 text-emerald-700',
  pausado:         'bg-amber-50 text-amber-700',
  cancelado:       'bg-slate-100 text-slate-500',
  em_cancelamento: 'bg-red-50 text-red-600',
}
const statusLabel: Record<string, string> = {
  ativo:           'Ativo',
  pausado:         'Pausado',
  cancelado:       'Cancelado',
  em_cancelamento: 'Em cancelamento',
}

interface ProdutosTabProps {
  clienteId: string
  contratoAtivo: Contrato | null
  produtos: ProdutoContratadoView[]
  catalogo: ProdutoAgencia[]
  ofertasMap: Record<string, ProdutoOferta[]>
  renovacoesMap: Record<string, any[]>
}

export function ProdutosTab({ clienteId, contratoAtivo, produtos, catalogo, ofertasMap, renovacoesMap }: ProdutosTabProps) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [renovandoItem, setRenovandoItem] = useState<ProdutoContratadoView | null>(null)

  const mrr = produtos
    .filter((p) => p.item_status === 'ativo')
    .reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)

  function handleStatusChange(item: ProdutoContratadoView, status: string) {
    if (!item.id) return
    startTransition(async () => {
      await atualizarStatusContratoItem(item.id!, clienteId, status as ProdutoStatus)
    })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">MRR desta conta</p>
          <p className="text-2xl font-semibold text-slate-900">
            {mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          disabled={!contratoAtivo}
          title={!contratoAtivo ? 'Cliente não possui contrato ativo' : undefined}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Adicionar produto
        </button>
      </div>

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-slate-400">Nenhum produto contratado ainda</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Produto</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Periodicidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Vencimento</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {produtos.map((p, i) => (
                <Fragment key={p.id ?? i}>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.produto_nome ?? '—'}</p>
                      {p.categoria && <p className="text-xs text-slate-400">{p.categoria}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {(p.valor_efetivo ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 capitalize">
                      {p.periodicidade ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <VencimentoBadge dataFim={p.data_fim_item} produtoTipo={p.produto_tipo} />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.item_status ?? 'ativo'}
                        disabled={isPending}
                        onChange={(e) => handleStatusChange(p, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-blue-100 ${statusBadge[p.item_status ?? 'ativo'] ?? statusBadge.ativo}`}
                      >
                        <option value="ativo">Ativo</option>
                        <option value="pausado">Pausado</option>
                        <option value="em_cancelamento">Em cancelamento</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {p.produto_tipo !== 'pontual' && p.id && (
                        <button
                          onClick={() => setRenovandoItem(p)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          title="Renovar"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Renovar
                        </button>
                      )}
                    </td>
                  </tr>
                  {p.produto_tipo !== 'pontual' && p.id && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <RenovacoesHistorico
                          itemId={p.id}
                          renovacoes={renovacoesMap[p.id] ?? []}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {contratoAtivo && (
        <AdicionarProdutoModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          contratoId={contratoAtivo.id}
          clienteId={clienteId}
          catalogo={catalogo}
          ofertasMap={ofertasMap}
        />
      )}

      {renovandoItem && (
        <RenovacaoModal
          open={!!renovandoItem}
          onClose={() => setRenovandoItem(null)}
          item={renovandoItem}
          clienteId={clienteId}
        />
      )}
    </div>
  )
}
