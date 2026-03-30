'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { adicionarProdutoCliente } from '@/app/actions/contratos'
import type { ProdutoAgencia, ProdutoOferta } from '@/types/database'

interface AdicionarProdutoModalProps {
  open: boolean
  onClose: () => void
  contratoId: string | null
  clienteId: string
  catalogo: ProdutoAgencia[]
  ofertasMap: Record<string, ProdutoOferta[]>
}

export function AdicionarProdutoModal({
  open,
  onClose,
  contratoId,
  clienteId,
  catalogo,
  ofertasMap,
}: AdicionarProdutoModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [produtoId, setProdutoId] = useState('')

  const ofertasDisponiveis = produtoId
    ? (ofertasMap[produtoId] ?? []).filter((o) => o.ativo)
    : []

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await adicionarProdutoCliente(contratoId, clienteId, formData)
      if (result.error) { setError(result.error) } else { onClose() }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Adicionar produto</h3>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Produto *</label>
            <select
              name="produto_agencia_id"
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Selecione um produto…</option>
              {catalogo.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {ofertasDisponiveis.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Variante / Plano (opcional)</label>
              <select
                name="oferta_id"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Sem variante específica</option>
                {ofertasDisponiveis.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome} — {o.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    {o.periodicidade ? `/${o.periodicidade}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Valor negociado (R$) *</label>
              <input
                name="valor_negociado"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Data de início *</label>
              <input
                name="data_inicio"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
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
              {isPending ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
