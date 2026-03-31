'use client'

import { useState, useTransition, Fragment } from 'react'
import { Plus, RefreshCw, Trash2, ArrowLeftRight, ShieldAlert } from 'lucide-react'
import { TooltipInfo } from '@/components/ui/tooltip-info'
import { atualizarStatusContratoItem, removerProdutoCliente } from '@/app/actions/contratos'
import { AdicionarProdutoModal } from './adicionar-produto-modal'
import { RenovacaoModal } from './renovacao-modal'
import { RenovacoesHistorico } from './renovacoes-historico'
import { AlterarProdutoModal } from './alterar-produto-modal'
import { AlteracoesHistorico } from './alteracoes-historico'
import type { ProdutoContratadoView, ProdutoAgencia, ProdutoOferta, ProdutoStatus, Contrato, Renovacao, UserRole } from '@/types/database'

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
  alteracoesMap: Record<string, any[]>
  userRole?: UserRole
}

export function ProdutosTab({ clienteId, contratoAtivo, produtos, catalogo, ofertasMap, renovacoesMap, alteracoesMap, userRole }: ProdutosTabProps) {
  const [isPending, startTransition] = useTransition()
  const [showAdd, setShowAdd] = useState(false)
  const [renovandoItem, setRenovandoItem] = useState<ProdutoContratadoView | null>(null)
  const [alterandoItem, setAlterandoItem] = useState<ProdutoContratadoView | null>(null)

  const podeAlterar = userRole === 'gestor' || userRole === 'admin'

  const mrr = produtos
    .filter((p) => p.item_status === 'ativo')
    .reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)

  function handleStatusChange(item: ProdutoContratadoView, status: string) {
    if (!item.id) return
    startTransition(async () => {
      await atualizarStatusContratoItem(item.id!, clienteId, status as ProdutoStatus)
    })
  }

  function handleRemover(item: ProdutoContratadoView) {
    if (!item.id) return
    if (!confirm(`Remover "${item.produto_nome}" desta conta?`)) return
    startTransition(async () => {
      await removerProdutoCliente(item.id!, clienteId)
    })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">MRR desta conta</p>
            <TooltipInfo text="Soma da receita mensal recorrente de todos os produtos ativos deste cliente." />
          </div>
          <p className="mt-[6px] text-[26px] font-bold leading-tight text-slate-900">
            {mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Adicionar produto
        </button>
      </div>

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-slate-400">Nenhum produto contratado ainda</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
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
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium text-slate-700">
                        {(p.valor_efetivo ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      {(p as any).valor_especial != null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200 mt-0.5">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          Negociação especial
                        </span>
                      )}
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
                      <div className="flex items-center gap-2">
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
                        {podeAlterar && p.id && p.item_status === 'ativo' && (
                          <button
                            onClick={() => setAlterandoItem(p)}
                            className="flex items-center gap-1 rounded-lg border border-blue-100 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            title="Alterar produto"
                          >
                            <ArrowLeftRight className="h-3 w-3" />
                            Alterar
                          </button>
                        )}
                        {p.id && (
                          <button
                            onClick={() => handleRemover(p)}
                            disabled={isPending}
                            className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            title="Remover produto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
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
                  {p.id && (alteracoesMap[p.id] ?? []).length > 0 && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <AlteracoesHistorico
                          itemId={p.id}
                          alteracoes={(alteracoesMap[p.id] ?? []).map((a: any) => ({
                            id: a.id,
                            created_at: a.created_at,
                            produto_anterior: a.produto_anterior,
                            produto_novo: a.produto_novo,
                            valor_anterior: a.valor_anterior,
                            valor_novo: a.valor_novo,
                            delta: a.delta ?? (a.valor_novo - a.valor_anterior),
                            tipo: a.tipo,
                            motivo: a.motivo,
                            alterado_por_nome: a.alterado_por_perfil?.nome ?? null,
                          }))}
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

      <AdicionarProdutoModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        contratoId={contratoAtivo?.id ?? null}
        clienteId={clienteId}
        catalogo={catalogo}
        ofertasMap={ofertasMap}
        userRole={userRole}
      />

      {renovandoItem && (
        <RenovacaoModal
          open={!!renovandoItem}
          onClose={() => setRenovandoItem(null)}
          item={renovandoItem}
          clienteId={clienteId}
        />
      )}

      {alterandoItem && (
        <AlterarProdutoModal
          open={!!alterandoItem}
          onClose={() => setAlterandoItem(null)}
          item={alterandoItem}
          clienteId={clienteId}
          catalogo={catalogo}
          ofertasMap={ofertasMap}
        />
      )}
    </div>
  )
}
