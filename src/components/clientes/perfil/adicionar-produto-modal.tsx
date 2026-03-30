'use client'

import { useState, useTransition } from 'react'
import { X, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react'
import { adicionarProdutoCliente } from '@/app/actions/contratos'
import type { ProdutoAgencia, ProdutoOferta, UserRole } from '@/types/database'

interface AdicionarProdutoModalProps {
  open: boolean
  onClose: () => void
  contratoId: string | null
  clienteId: string
  catalogo: ProdutoAgencia[]
  ofertasMap: Record<string, ProdutoOferta[]>
  userRole?: UserRole
}

export function AdicionarProdutoModal({
  open,
  onClose,
  contratoId,
  clienteId,
  catalogo,
  ofertasMap,
  userRole,
}: AdicionarProdutoModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [produtoId, setProdutoId] = useState('')
  const [valorNegociado, setValorNegociado] = useState('')
  const [showNegociacao, setShowNegociacao] = useState(false)

  const podeNegociarEspecial = userRole === 'gestor' || userRole === 'admin'
  const ofertasDisponiveis = produtoId
    ? (ofertasMap[produtoId] ?? []).filter((o) => o.ativo)
    : []

  function handleProdutoChange(id: string) {
    setProdutoId(id)
    const produto = catalogo.find(p => p.id === id)
    setValorNegociado(produto?.valor_padrao != null ? String(produto.valor_padrao) : '')
  }

  function handleOfertaChange(ofertaId: string) {
    if (!ofertaId) {
      const produto = catalogo.find(p => p.id === produtoId)
      setValorNegociado(produto?.valor_padrao != null ? String(produto.valor_padrao) : '')
    } else {
      const oferta = ofertasDisponiveis.find(o => o.id === ofertaId)
      if (oferta) setValorNegociado(String(oferta.valor))
    }
  }

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
          {/* Produto */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Produto *</label>
            <select
              name="produto_agencia_id"
              value={produtoId}
              onChange={(e) => handleProdutoChange(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Selecione um produto…</option>
              {catalogo.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Variante */}
          {ofertasDisponiveis.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Variante / Plano</label>
              <select
                name="oferta_id"
                onChange={(e) => handleOfertaChange(e.target.value)}
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

          {/* Valor e data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Valor negociado (R$) *</label>
              <input
                name="valor_negociado"
                type="number"
                step="0.01"
                min="0"
                required
                value={valorNegociado}
                onChange={(e) => setValorNegociado(e.target.value)}
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

          {/* Negociação especial — apenas gestor/admin */}
          {podeNegociarEspecial && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50">
              <button
                type="button"
                onClick={() => setShowNegociacao(!showNegociacao)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold text-amber-700"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Negociação especial
                </span>
                {showNegociacao ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showNegociacao && (
                <div className="space-y-3 border-t border-amber-200 px-3 pb-3 pt-3">
                  <p className="text-[11px] text-amber-600">
                    Override do valor para este cliente. Substitui o valor negociado no cálculo de MRR.
                  </p>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Valor especial (R$)</label>
                    <input
                      name="valor_especial"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Motivo *</label>
                    <input
                      name="valor_especial_motivo"
                      type="text"
                      placeholder="Ex: Cliente fidelidade, parceria estratégica…"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
