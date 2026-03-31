'use client'

import { useState, useTransition } from 'react'
import { X, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle } from 'lucide-react'
import { alterarProdutoCliente } from '@/app/actions/contratos'
import type { ProdutoContratadoView, ProdutoAgencia, ProdutoOferta } from '@/types/database'

interface AlterarProdutoModalProps {
  open: boolean
  onClose: () => void
  item: ProdutoContratadoView
  clienteId: string
  catalogo: ProdutoAgencia[]
  ofertasMap: Record<string, ProdutoOferta[]>
}

export function AlterarProdutoModal({
  open,
  onClose,
  item,
  clienteId,
  catalogo,
  ofertasMap,
}: AlterarProdutoModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [produtoId, setProdutoId] = useState('')
  const [valorNegociado, setValorNegociado] = useState('')
  const [encerrarAnterior, setEncerrarAnterior] = useState(true)
  const [dataEncerramento, setDataEncerramento] = useState(
    new Date().toISOString().split('T')[0]
  )

  const valorAtual = item.valor_efetivo ?? item.valor_efetivo ?? 0
  const ofertasDisponiveis = produtoId
    ? (ofertasMap[produtoId] ?? []).filter((o) => o.ativo)
    : []

  const valorNovo = parseFloat(valorNegociado) || 0
  const delta = valorNovo - valorAtual
  const tipoAlteracao: 'upsell' | 'downsell' | 'lateral' | null =
    !valorNegociado ? null :
    delta > 0 ? 'upsell' : delta < 0 ? 'downsell' : 'lateral'

  function handleProdutoChange(id: string) {
    setProdutoId(id)
    const produto = catalogo.find((p) => p.id === id)
    setValorNegociado(produto?.valor_padrao != null ? String(produto.valor_padrao) : '')
  }

  function handleOfertaChange(ofertaId: string) {
    if (!ofertaId) {
      const produto = catalogo.find((p) => p.id === produtoId)
      setValorNegociado(produto?.valor_padrao != null ? String(produto.valor_padrao) : '')
    } else {
      const oferta = ofertasDisponiveis.find((o) => o.id === ofertaId)
      if (oferta) setValorNegociado(String(oferta.valor))
    }
  }

  function handleSubmit(formData: FormData) {
    if (!produtoId) { setError('Selecione o novo produto'); return }
    setError(null)
    formData.set('encerrar_anterior', String(encerrarAnterior))
    formData.set('data_encerramento', dataEncerramento)
    startTransition(async () => {
      const result = await alterarProdutoCliente(item.id!, clienteId, formData)
      if (result.error) { setError(result.error) } else { onClose() }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Alterar produto</h3>
            <p className="text-xs text-slate-400 mt-0.5">Atual: {item.produto_nome}</p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={handleSubmit} className="p-5 space-y-4">
          {/* Novo produto */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Novo produto *</label>
            <select
              name="produto_agencia_id"
              value={produtoId}
              onChange={(e) => handleProdutoChange(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Selecione o produto…</option>
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

          {/* Valor e data início */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Novo valor (R$) *</label>
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
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Início do novo item *</label>
              <input
                name="data_inicio"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Preview do tipo de alteração */}
          {tipoAlteracao && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
              tipoAlteracao === 'upsell' ? 'bg-emerald-50 text-emerald-700' :
              tipoAlteracao === 'downsell' ? 'bg-red-50 text-red-700' :
              'bg-slate-50 text-slate-600'
            }`}>
              {tipoAlteracao === 'upsell' && <ArrowUpCircle className="h-3.5 w-3.5" />}
              {tipoAlteracao === 'downsell' && <ArrowDownCircle className="h-3.5 w-3.5" />}
              {tipoAlteracao === 'lateral' && <ArrowRightCircle className="h-3.5 w-3.5" />}
              <span>
                {tipoAlteracao === 'upsell' && 'Upsell'}
                {tipoAlteracao === 'downsell' && 'Downsell'}
                {tipoAlteracao === 'lateral' && 'Troca lateral'}
                {' — '}
                {valorAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {' → '}
                {valorNovo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {delta !== 0 && ` (${delta > 0 ? '+' : ''}${delta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`}
              </span>
            </div>
          )}

          {/* Encerrar produto anterior */}
          <div className="rounded-lg border border-slate-200 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Encerrar produto atual?</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                  <input
                    type="radio"
                    name="encerrar_radio"
                    checked={encerrarAnterior}
                    onChange={() => setEncerrarAnterior(true)}
                    className="accent-blue-600"
                  />
                  Sim
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                  <input
                    type="radio"
                    name="encerrar_radio"
                    checked={!encerrarAnterior}
                    onChange={() => setEncerrarAnterior(false)}
                    className="accent-blue-600"
                  />
                  Não (manter ambos ativos)
                </label>
              </div>
            </div>
            {encerrarAnterior && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Data de encerramento</label>
                <input
                  type="date"
                  value={dataEncerramento}
                  onChange={(e) => setDataEncerramento(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Motivo (opcional)</label>
            <input
              name="motivo"
              type="text"
              placeholder="Ex: Cliente pediu upgrade, pacote não atendia…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
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
              disabled={isPending || !produtoId}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? 'Salvando...' : 'Confirmar alteração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
