'use client'

import { useTransition, useState } from 'react'
import { X } from 'lucide-react'
import { renovarContratoItem } from '@/app/actions/contratos'
import type { ProdutoContratadoView } from '@/types/database'

interface RenovacaoModalProps {
  open: boolean
  onClose: () => void
  item: ProdutoContratadoView
  clienteId: string
}

export function RenovacaoModal({ open, onClose, item, clienteId }: RenovacaoModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    if (!item.id) return
    setError(null)
    startTransition(async () => {
      const result = await renovarContratoItem(item.id!, clienteId, formData)
      if (result.error) { setError(result.error) } else { onClose() }
    })
  }

  if (!open) return null

  // Sugerir nova data: periodicidade padrão a partir de hoje ou da data_fim_item atual
  const base = item.data_fim_item ? new Date(item.data_fim_item) : new Date()
  const meses = item.periodicidade === 'trimestral' ? 3
    : item.periodicidade === 'semestral' ? 6
    : item.periodicidade === 'anual' ? 12
    : 1
  base.setMonth(base.getMonth() + meses)
  const sugestao = base.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Renovar produto</h3>
            <p className="text-xs text-slate-400 mt-0.5">{item.produto_nome}</p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Novo vencimento *</label>
            <input
              name="data_fim_item"
              type="date"
              required
              defaultValue={sugestao}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Observações</label>
            <textarea
              name="observacoes"
              rows={3}
              placeholder="Ex: Renovado com desconto negociado..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? 'Renovando...' : 'Confirmar renovação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
