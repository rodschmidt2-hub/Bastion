'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { desativarCliente, reativarCliente } from '@/app/actions/clientes'

interface DesativarModalProps {
  clienteId: string
  modo: 'desativar' | 'reativar'
  onClose: () => void
}

export function DesativarModal({ clienteId, modo, onClose }: DesativarModalProps) {
  const [isPending, startTransition] = useTransition()
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = modo === 'desativar'
        ? await desativarCliente(clienteId, motivo)
        : await reativarCliente(clienteId)
      if (result.error) { setError(result.error) } else { onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">
            {modo === 'desativar' ? 'Desativar cliente' : 'Reativar cliente'}
          </h3>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {modo === 'desativar' ? (
            <>
              <p className="text-sm text-slate-600">
                O cliente será marcado como inativo. Seus contratos continuarão registrados mas não gerarão novas faturas automaticamente.
              </p>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Motivo *</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                  placeholder="Descreva o motivo da desativação..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              O cliente voltará ao status ativo. Você poderá gerar novas faturas normalmente.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || (modo === 'desativar' && !motivo.trim())}
              className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 ${
                modo === 'desativar' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPending ? 'Aguarde...' : modo === 'desativar' ? 'Desativar' : 'Reativar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
