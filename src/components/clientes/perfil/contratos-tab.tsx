'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, X, AlertTriangle } from 'lucide-react'
import { createContrato, updateContratoStatus } from '@/app/actions/contratos'
import type { Contrato, ContratoStatus } from '@/types/database'

const statusBadge: Record<ContratoStatus, { label: string; className: string }> = {
  ativo:        { label: 'Ativo',        className: 'bg-emerald-50 text-emerald-700' },
  em_renovacao: { label: 'Em renovação', className: 'bg-blue-50 text-blue-700' },
  pausado:      { label: 'Pausado',      className: 'bg-amber-50 text-amber-700' },
  cancelado:    { label: 'Cancelado',    className: 'bg-red-50 text-red-700' },
  encerrado:    { label: 'Encerrado',    className: 'bg-slate-100 text-slate-500' },
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

interface ContratosTabProps {
  clienteId: string
  contratos: Contrato[]
}

export function ContratosTab({ clienteId, contratos }: ContratosTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

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

  const alertas = contratos.filter((c) => {
    const days = daysUntil(c.data_fim)
    return c.status === 'ativo' && days !== null && days <= 30 && days >= 0
  })

  return (
    <div className="p-6 space-y-5">
      {alertas.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Atenção — contratos próximos do vencimento</span>
          </div>
          {alertas.map((c) => {
            const days = daysUntil(c.data_fim)!
            return (
              <p key={c.id} className="text-sm text-amber-700">
                {c.tipo} — vence em <strong>{days} {days === 1 ? 'dia' : 'dias'}</strong>
                {' '}({new Date(c.data_fim!).toLocaleDateString('pt-BR')})
              </p>
            )
          })}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Novo contrato
        </button>
      </div>

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
                <label className="mb-1 block text-xs font-medium text-slate-600">Valor (R$)</label>
                <input name="valor" type="number" step="0.01" placeholder="0,00" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
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

      {contratos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-slate-400">Nenhum contrato registrado ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contratos.map((c) => {
            const badge = statusBadge[c.status as ContratoStatus] ?? statusBadge.encerrado
            const days = daysUntil(c.data_fim)
            const isAlert = c.status === 'ativo' && days !== null && days <= 30 && days >= 0

            return (
              <div key={c.id} className={`rounded-xl border p-4 ${isAlert ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{c.tipo}</p>
                      {isAlert && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(c.data_ativacao).toLocaleDateString('pt-BR')}
                      {c.data_fim && ` — ${new Date(c.data_fim).toLocaleDateString('pt-BR')}`}
                    </p>
                    {isAlert && (
                      <p className="mt-1 text-xs font-medium text-amber-600">Vence em {days} {days === 1 ? 'dia' : 'dias'}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.documento_url && (
                      <a href={c.documento_url} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50">Ver doc</a>
                    )}
                    <select
                      value={c.status}
                      disabled={isPending}
                      onChange={(e) => handleStatus(c.id, e.target.value as ContratoStatus)}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${badge.className}`}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="em_renovacao">Em renovação</option>
                      <option value="pausado">Pausado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="encerrado">Encerrado</option>
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
