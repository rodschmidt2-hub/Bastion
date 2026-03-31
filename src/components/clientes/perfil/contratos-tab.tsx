'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, X, AlertTriangle, FileText, CheckCircle2, Clock } from 'lucide-react'
import { createContrato, updateContratoStatus, assinarContrato } from '@/app/actions/contratos'
import { TooltipInfo } from '@/components/ui/tooltip-info'
import type { Contrato, ContratoStatus, ProdutoContratadoView } from '@/types/database'

const statusMap: Record<ContratoStatus, { label: string; badge: string }> = {
  ativo:        { label: 'Ativo',        badge: 'bg-emerald-50 text-emerald-700' },
  em_renovacao: { label: 'Em renovação', badge: 'bg-amber-50 text-amber-700' },
  pausado:      { label: 'Pausado',      badge: 'bg-amber-50 text-amber-700' },
  cancelado:    { label: 'Cancelado',    badge: 'bg-red-50 text-red-700' },
  encerrado:    { label: 'Encerrado',    badge: 'bg-slate-100 text-slate-500' },
}

const itemStatusMap: Record<string, { dot: string; badge: string; label: string }> = {
  ativo:     { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', label: 'Ativo' },
  pausado:   { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700',     label: 'Pausado' },
  cancelado: { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-500',    label: 'Cancelado' },
  encerrado: { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-500',    label: 'Encerrado' },
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR')
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

interface ContratosTabProps {
  clienteId: string
  contratos: Contrato[]
  produtos: ProdutoContratadoView[]
}

export function ContratosTab({ clienteId, contratos, produtos }: ContratosTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [signPending, startSignTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleAssinar(contratoId: string) {
    startSignTransition(async () => {
      await assinarContrato(clienteId, contratoId)
    })
  }

  // Group produtos by contrato_id
  const produtosPorContrato = produtos.reduce<Record<string, ProdutoContratadoView[]>>((acc, p) => {
    if (!p.contrato_id) return acc
    if (!acc[p.contrato_id]) acc[p.contrato_id] = []
    acc[p.contrato_id].push(p)
    return acc
  }, {})

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createContrato(clienteId, formData)
      if (result.error) { setError(result.error) } else { setShowForm(false) }
    })
  }

  function handleStatus(contratoId: string, status: ContratoStatus) {
    startTransition(async () => { await updateContratoStatus(clienteId, contratoId, status) })
  }

  const ativos = contratos.filter(c => c.status !== 'encerrado' && c.status !== 'cancelado')
  const historico = contratos.filter(c => c.status === 'encerrado' || c.status === 'cancelado')
  const temContratoAtivo = contratos.some(c => c.status === 'ativo')

  const mrrTotal = contratos
    .filter(c => c.status === 'ativo')
    .reduce((s, c) => {
      const ps = produtosPorContrato[c.id] ?? []
      return s + ps.filter(p => p.item_status === 'ativo').reduce((a, p) => a + (p.valor_efetivo ?? 0), 0)
    }, 0)

  return (
    <div className="p-6 space-y-5">
      {/* Alerta: sem contrato ativo */}
      {!temContratoAtivo && contratos.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            Cliente sem contrato ativo — verifique o status dos contratos abaixo.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {contratos.length} {contratos.length === 1 ? 'contrato' : 'contratos'}
          {mrrTotal > 0 && ` · ${fmt(mrrTotal)}/mês em vigor`}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Novo contrato
        </button>
      </div>

      {/* Form novo contrato */}
      {showForm && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Novo contrato</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <form ref={formRef} action={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Tipo de contrato</label>
                <input name="tipo" defaultValue="Prestação de Serviços" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Forma de pagamento</label>
                <select name="forma_pagamento" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao">Cartão</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Data início *</label>
                <input name="data_inicio" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Data fim</label>
                <input name="data_fim" type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">URL do documento</label>
              <input name="documento_url" type="url" placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Observações</label>
              <textarea name="observacoes" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{isPending ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}

      {contratos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-slate-400">Nenhum contrato registrado ainda</p>
        </div>
      )}

      {/* Contratos ativos/vigentes */}
      {ativos.map((c) => {
        const s = statusMap[c.status as ContratoStatus] ?? statusMap.encerrado
        const days = daysUntil(c.data_fim)
        const isExpiring = c.status === 'ativo' && days !== null && days <= 30 && days >= 0
        const ps = produtosPorContrato[c.id] ?? []
        const mrrContrato = ps.filter(p => p.item_status === 'ativo').reduce((a, p) => a + (p.valor_efetivo ?? 0), 0)

        return (
          <div key={c.id} className={`rounded-xl border overflow-hidden ${isExpiring ? 'border-amber-200' : 'border-slate-200'}`}>
            {/* Header do contrato */}
            <div className={`flex items-center gap-3 px-5 py-4 border-b ${isExpiring ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'}`}>
              <FileText className="h-5 w-5 shrink-0 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{c.tipo}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {fmtDate(c.data_ativacao)}
                  {c.data_fim && ` → `}
                  {c.data_fim && (
                    <span className={isExpiring ? 'text-amber-600 font-semibold' : ''}>
                      {fmtDate(c.data_fim)}
                      {isExpiring && ` ⚠️ vence em ${days} ${days === 1 ? 'dia' : 'dias'}`}
                    </span>
                  )}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}>{s.label}</span>
              {/* Badge assinatura */}
              {(c as any).is_assinado ? (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Assinado
                  <TooltipInfo text="Contrato marcado como assinado. Necessário para ativar o cliente." />
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1">
                  <button
                    onClick={() => handleAssinar(c.id)}
                    disabled={signPending}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Clock className="h-3 w-3" /> Marcar como assinado
                  </button>
                  <TooltipInfo text="Contrato ainda não assinado. Sem assinatura, o cliente não pode ser ativado." />
                </span>
              )}

              {/* ClickSign placeholder */}
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                ClickSign — em breve
              </span>

              {c.documento_url && (
                <a href={c.documento_url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">
                  📄 Ver PDF
                </a>
              )}
              <select
                value={c.status}
                disabled={isPending}
                onChange={(e) => handleStatus(c.id, e.target.value as ContratoStatus)}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none"
              >
                <option value="ativo">Ativo</option>
                <option value="em_renovacao">Em renovação</option>
                <option value="pausado">Pausado</option>
                <option value="cancelado">Cancelado</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>

            {/* Serviços incluídos */}
            {ps.length > 0 && (
              <div className={`px-5 py-4 ${isExpiring ? 'bg-amber-50/30' : 'bg-slate-50/50'}`}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[.6px] text-slate-400">Serviços Incluídos</p>
                <div className="space-y-2">
                  {ps.map((p) => {
                    const is = itemStatusMap[p.item_status ?? 'ativo'] ?? itemStatusMap.ativo
                    const metaParts = [
                      p.produto_tipo ? (p.produto_tipo === 'pontual' ? 'Pontual' : 'Recorrente') : null,
                      p.periodicidade ? p.periodicidade.charAt(0).toUpperCase() + p.periodicidade.slice(1) : null,
                      p.data_inicio_item ? `Desde ${fmtDate(p.data_inicio_item)}` : null,
                      p.data_fim_item ? `Vence ${fmtDate(p.data_fim_item)}` : null,
                    ].filter(Boolean).join(' · ')

                    return (
                      <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${is.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{p.produto_nome ?? '—'}</p>
                          {metaParts && <p className="text-xs text-slate-400 mt-0.5">{metaParts}</p>}
                        </div>
                        <p className="text-sm font-bold text-slate-800 shrink-0">
                          {p.valor_efetivo != null ? `${fmt(p.valor_efetivo)}/mês` : '—'}
                        </p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${is.badge}`}>{is.label}</span>
                      </div>
                    )
                  })}
                </div>

                {mrrContrato > 0 && (
                  <div className={`mt-4 flex items-center justify-between border-t pt-3 ${isExpiring ? 'border-amber-200' : 'border-slate-200'}`}>
                    <span className={`flex items-center gap-1 text-xs font-medium ${isExpiring ? 'text-amber-700' : 'text-slate-500'}`}>
                      Fatura mensal gerada por este contrato
                      <TooltipInfo text="Soma dos valores efetivos de todos os produtos recorrentes ativos neste contrato." />
                    </span>
                    <span className="text-base font-extrabold text-slate-900">{fmt(mrrContrato)}/mês</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className={`flex items-center justify-between border-t px-5 py-3 ${isExpiring ? 'border-amber-100 bg-amber-50/20' : 'border-slate-100 bg-white'}`}>
              <p className="text-xs text-slate-400">
                {c.data_fim && mrrContrato > 0
                  ? `Valor total (até ${fmtDate(c.data_fim)}): ${fmt(mrrContrato * 12)}`
                  : (c as any).observacao ?? ''}
              </p>
              {(c.status === 'ativo' || c.status === 'em_renovacao') && (
                <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  Renovar Contrato
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Histórico (encerrados/cancelados) */}
      {historico.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.6px] text-slate-400">Histórico</p>
          <div className="space-y-3">
            {historico.map((c) => {
              const s = statusMap[c.status as ContratoStatus] ?? statusMap.encerrado
              const ps = produtosPorContrato[c.id] ?? []

              return (
                <div key={c.id} className="rounded-xl border border-slate-200 overflow-hidden opacity-70">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white">
                    <FileText className="h-4 w-4 shrink-0 text-slate-300" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-600">{c.tipo}</p>
                      <p className="text-xs text-slate-400">
                        {fmtDate(c.data_ativacao)}
                        {c.data_fim && ` → ${fmtDate(c.data_fim)}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}>{s.label}</span>
                  </div>

                  {ps.length > 0 && (
                    <div className="px-5 py-4 bg-slate-50">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.6px] text-slate-400">Serviços que constavam</p>
                      <div className="space-y-2">
                        {ps.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                            <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-500">{p.produto_nome ?? '—'}</p>
                              <p className="text-xs text-slate-400">
                                {p.data_fim_item ? `Encerrado em ${fmtDate(p.data_fim_item)}` : 'Encerrado'}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-400">
                              {p.valor_efetivo != null ? fmt(p.valor_efetivo) : '—'}
                            </p>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">Encerrado</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
