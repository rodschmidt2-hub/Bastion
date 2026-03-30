'use client'

import { useState, useTransition, Fragment } from 'react'
import { Plus, X, CreditCard, ChevronDown, ChevronUp } from 'lucide-react'
import { gerarFatura, registrarPagamento } from '@/app/actions/faturas'
import { ExportCsvButton } from '@/components/financeiro/export-csv-button'
import { MetricasClienteCard } from '@/components/clientes/perfil/metricas-cliente-card'
import { PontualidadeGrid } from '@/components/clientes/perfil/pontualidade-grid'
import { NotaFinanceira } from '@/components/clientes/perfil/nota-financeira'

type Fatura = {
  id: string
  numero_fatura: string
  competencia: string
  data_vencimento: string
  valor_total: number
  valor_pago: number
  saldo_devedor: number | null
  status: string
  tipo: string
  itens?: { id: string; descricao: string; valor: number }[]
  pagamentos?: { id: string; data_pagamento: string; valor_pago: number; forma_pagamento: string | null }[]
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  pendente:  { label: 'Pendente',  cls: 'bg-amber-50 text-amber-700' },
  parcial:   { label: 'Parcial',   cls: 'bg-blue-50 text-blue-700' },
  pago:      { label: 'Pago',      cls: 'bg-emerald-50 text-emerald-700' },
  atrasado:  { label: 'Atrasado',  cls: 'bg-red-50 text-red-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500' },
}

const formaLabel: Record<string, string> = {
  pix: 'PIX', boleto: 'Boleto', cartao: 'Cartão', transferencia: 'Transferência', outro: 'Outro',
}

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

function PagamentoModal({ faturaId, clienteId, onClose }: { faturaId: string; clienteId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await registrarPagamento(faturaId, clienteId, formData)
      if (result.error) { setError(result.error) } else { onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Registrar pagamento</h3>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button>
        </div>
        <form action={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Data *</label>
              <input name="data_pagamento" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Valor (R$) *</label>
              <input name="valor" type="number" step="0.01" min="0.01" required placeholder="0,00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Forma de pagamento</label>
            <select name="forma_pagamento" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
              <option value="pix">PIX</option>
              <option value="boleto">Boleto</option>
              <option value="cartao">Cartão</option>
              <option value="transferencia">Transferência</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Comprovante (URL)</label>
            <input name="comprovante_url" type="url" placeholder="https://..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending ? 'Registrando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type PontualidadeItem = { competencia: string; status: 'pontual' | 'atraso_leve' | 'atraso_grave' | 'pendente' }

interface FinanceiroTabProps {
  clienteId: string
  faturas: Fatura[]
  mrr: number
  notaFinanceira?: string | null
  pontualidade?: PontualidadeItem[]
  metricas?: {
    ltv: number
    cac: number | null
    margem: number | null
    tenureMeses: number
    dataInicioRelac: string | null
    createdAt: string
    userRole: string
  }
}

export function FinanceiroTab({ clienteId, faturas, mrr, notaFinanceira, pontualidade, metricas }: FinanceiroTabProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagandoFatura, setPagandoFatura] = useState<string | null>(null)
  const [expandida, setExpandida] = useState<string | null>(null)

  const ltv = faturas.filter((f) => f.status === 'pago').reduce((s, f) => s + f.valor_total, 0)
  const emAberto = faturas
    .filter((f) => ['pendente', 'parcial', 'atrasado'].includes(f.status))
    .reduce((s, f) => s + (f.saldo_devedor ?? (f.valor_total - f.valor_pago)), 0)

  function handleGerarFatura(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await gerarFatura(clienteId, formData)
      if (result.error) { setError(result.error) } else { setShowForm(false) }
    })
  }

  const competenciaDefault = new Date().toISOString().slice(0, 7)

  return (
    <div className="p-6 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">LTV Acumulado</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{fmt(ltv)}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">MRR</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{fmt(mrr)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${emAberto > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'}`}>
          <p className="text-xs text-slate-400 uppercase tracking-wide">Em aberto</p>
          <p className={`mt-1 text-xl font-semibold ${emAberto > 0 ? 'text-red-700' : 'text-slate-900'}`}>{fmt(emAberto)}</p>
        </div>
      </div>

      {/* Header + Gerar Fatura */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Faturas</h3>
        <div className="flex items-center gap-2">
          <ExportCsvButton clienteId={clienteId} />
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Gerar fatura
          </button>
        </div>
      </div>

      {/* Form Gerar Fatura */}
      {showForm && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Nova fatura</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <form action={handleGerarFatura} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Competência (mês) *</label>
                <input name="competencia" type="month" required defaultValue={competenciaDefault}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Vencimento *</label>
                <input name="data_vencimento" type="date" required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
              <select name="tipo" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                <option value="regular">Regular</option>
                <option value="cortesia">Cortesia</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {isPending ? 'Gerando...' : 'Gerar fatura'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Faturas */}
      {faturas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-slate-400">Nenhuma fatura gerada ainda</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Competência</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Vencimento</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Pago</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Saldo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {faturas.map((f) => {
                const badge = statusBadge[f.status] ?? statusBadge.pendente
                const saldo = f.saldo_devedor ?? (f.valor_total - f.valor_pago)
                const isExpanded = expandida === f.id
                const podeRegistrar = ['pendente', 'parcial', 'atrasado'].includes(f.status)

                return (
                  <Fragment key={f.id}>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{f.competencia}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(f.data_vencimento).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{fmt(f.valor_total)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700">{fmt(f.valor_pago)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${saldo > 0 ? 'text-red-600' : 'text-slate-400'}`}>{fmt(Math.max(0, saldo))}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {podeRegistrar && (
                            <button onClick={() => setPagandoFatura(f.id)}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                              <CreditCard className="h-3 w-3" /> Pagar
                            </button>
                          )}
                          <button onClick={() => setExpandida(isExpanded ? null : f.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100">
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50/50 px-6 py-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Itens · {f.numero_fatura}</p>
                          {(f.itens ?? []).map((item) => (
                            <div key={item.id} className="flex justify-between py-0.5 text-xs text-slate-600">
                              <span>{item.descricao}</span>
                              <span className="font-medium">{fmt(item.valor)}</span>
                            </div>
                          ))}
                          {(f.pagamentos ?? []).length > 0 && (
                            <>
                              <p className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Pagamentos</p>
                              {(f.pagamentos ?? []).map((p) => (
                                <div key={p.id} className="flex justify-between py-0.5 text-xs text-slate-600">
                                  <span>{new Date(p.data_pagamento).toLocaleDateString('pt-BR')} · {formaLabel[p.forma_pagamento ?? 'outro'] ?? '—'}</span>
                                  <span className="font-medium text-emerald-700">{fmt(p.valor_pago)}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Métricas individuais (Story 5.5) */}
      {metricas && (
        <MetricasClienteCard
          clienteId={clienteId}
          data={{ mrr, ...metricas }}
        />
      )}

      {/* Pontualidade (Story 5.2) */}
      {pontualidade && pontualidade.length > 0 && (
        <PontualidadeGrid itens={pontualidade} />
      )}

      {/* Notas financeiras (Story 5.2) */}
      <NotaFinanceira clienteId={clienteId} nota={notaFinanceira ?? null} />

      {pagandoFatura && (
        <PagamentoModal
          faturaId={pagandoFatura}
          clienteId={clienteId}
          onClose={() => setPagandoFatura(null)}
        />
      )}
    </div>
  )
}
