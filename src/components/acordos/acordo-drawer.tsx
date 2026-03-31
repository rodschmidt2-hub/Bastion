'use client'

import { useState, useTransition } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { createAcordo } from '@/app/actions/acordos'

interface Fatura {
  id: string
  numero_fatura: string
  competencia: string
  valor_total: number
  valor_pago: number | null
  data_vencimento: string
}

interface AcordoDrawerProps {
  open: boolean
  onClose: () => void
  clienteId: string
  faturasPendentes: Fatura[]
}

export function AcordoDrawer({ open, onClose, clienteId, faturasPendentes }: AcordoDrawerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedFaturas, setSelectedFaturas] = useState<string[]>([])

  const totalSelecionado = faturasPendentes
    .filter((f) => selectedFaturas.includes(f.id))
    .reduce((s, f) => s + ((f.valor_total ?? 0) - (f.valor_pago ?? 0)), 0)

  function toggleFatura(id: string) {
    setSelectedFaturas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    selectedFaturas.forEach((id) => formData.append('fatura_ids[]', id))
    startTransition(async () => {
      const result = await createAcordo(clienteId, formData)
      if (result.error) { setError(result.error) }
      else { onClose() }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Novo acordo</h2>
            <p className="text-xs text-slate-400 mt-0.5">Parcelamento de dívida ou distrato</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo *</label>
              <select
                name="tipo"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="inadimplencia">Inadimplência</option>
                <option value="distrato">Distrato</option>
              </select>
            </div>

            {/* Faturas em aberto para vincular */}
            {faturasPendentes.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Faturas em aberto
                  <span className="ml-1 text-xs font-normal text-slate-400">(selecione para incluir no acordo)</span>
                </label>
                <div className="space-y-1.5 rounded-lg border border-slate-200 p-2">
                  {faturasPendentes.map((f) => {
                    const saldo = (f.valor_total ?? 0) - (f.valor_pago ?? 0)
                    return (
                      <label
                        key={f.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
                          selectedFaturas.includes(f.id) ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 rounded accent-blue-600"
                          checked={selectedFaturas.includes(f.id)}
                          onChange={() => toggleFatura(f.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700">{f.numero_fatura} · {f.competencia}</p>
                          <p className="text-xs text-slate-400">Vence {new Date(f.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className="text-xs font-medium text-red-600">
                          {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {selectedFaturas.length > 0 && (
                  <div className="mt-1.5 flex items-center justify-between px-1">
                    <p className="text-xs text-slate-500">{selectedFaturas.length} fatura(s) selecionada(s)</p>
                    <p className="text-xs font-medium text-slate-700">
                      Total: {totalSelecionado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Valor acordado (R$) *</label>
              <input
                name="valor_acordado"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={totalSelecionado > 0 ? totalSelecionado.toFixed(2) : ''}
                placeholder="0,00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Parcelas *</label>
                <select
                  name="numero_parcelas"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {[1,2,3,4,5,6,8,10,12].map((n) => (
                    <option key={n} value={n}>{n}x</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">1° vencimento *</label>
                <input
                  name="primeiro_vencimento"
                  type="date"
                  required
                  defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Observação</label>
              <textarea
                name="descricao"
                rows={2}
                placeholder="Motivo ou condições especiais..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                As faturas selecionadas serão marcadas como <strong>em acordo</strong> e novas parcelas serão geradas automaticamente.
              </p>
            </div>

          </div>

          <div className="border-t border-slate-100 px-6 py-4">
            {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? 'Criando...' : 'Criar acordo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
