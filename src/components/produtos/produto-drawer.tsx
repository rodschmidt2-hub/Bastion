'use client'

import { useState, useTransition, useRef } from 'react'
import { X, Plus, Pencil, Power } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createProduto, updateProduto } from '@/app/actions/produtos'
import { toggleOfertaAtivo } from '@/app/actions/ofertas'
import { OfertaDrawer } from './oferta-drawer'
import type { ProdutoAgencia, ProdutoOferta } from '@/types/database'

interface ModeloSimples {
  id: string
  nome: string
  tipo: string
}

interface ProdutoDrawerProps {
  open: boolean
  onClose: () => void
  produto?: ProdutoAgencia | null
  ofertas?: ProdutoOferta[]
  categorias?: string[]
  modelos?: ModeloSimples[]
}

export function ProdutoDrawer({ open, onClose, produto, ofertas = [], categorias = [], modelos = [] }: ProdutoDrawerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [togglePending, startToggleTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState<string>(produto?.tipo ?? 'recorrente')
  const [ofertaOpen, setOfertaOpen] = useState(false)
  const [editingOferta, setEditingOferta] = useState<ProdutoOferta | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleToggleOferta(o: ProdutoOferta) {
    startToggleTransition(async () => {
      await toggleOfertaAtivo(o.id, !o.ativo)
      router.refresh()
    })
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = produto
        ? await updateProduto(produto.id, formData)
        : await createProduto(formData)

      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  if (!open) return null

  const showPeriodicidade = tipo === 'recorrente' || tipo === 'hibrido'

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="flex w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {produto ? 'Editar produto' : 'Novo produto'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {produto ? 'Atualize os dados do produto' : 'Preencha os dados do produto'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome *</label>
              <input
                name="nome"
                required
                defaultValue={produto?.nome ?? ''}
                placeholder="Ex: Gestão de Redes Sociais"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Categoria</label>
              <select
                name="categoria"
                defaultValue={produto?.categoria ?? ''}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo *</label>
                <select
                  name="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="recorrente">Recorrente</option>
                  <option value="pontual">Pontual</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>

              {showPeriodicidade ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Periodicidade *</label>
                  <select
                    name="periodicidade"
                    defaultValue={produto?.periodicidade ?? 'mensal'}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              ) : (
                <input type="hidden" name="periodicidade" value="" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Valor base (R$)</label>
                <input
                  name="valor_padrao"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={produto?.valor_padrao ?? ''}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Custo base (R$)
                  <span className="ml-1 text-xs font-normal text-slate-400">(interno)</span>
                </label>
                <input
                  name="custo_base"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={produto?.custo_base ?? ''}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Modelo de documento associado */}
            {modelos.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Modelo de documento
                  <span className="ml-1 text-xs font-normal text-slate-400">(contrato padrão)</span>
                </label>
                <select
                  name="modelo_id"
                  defaultValue={produto?.modelo_id ?? ''}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Sem modelo associado</option>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Variantes — só exibe ao editar */}
            {produto && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Variantes / Planos</h3>
                  <button
                    type="button"
                    onClick={() => { setEditingOferta(null); setOfertaOpen(true) }}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nova variante
                  </button>
                </div>
                {ofertas.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhuma variante cadastrada</p>
                ) : (
                  <div className="space-y-2">
                    {ofertas.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2">
                        <div>
                          <p className={`text-sm font-medium ${o.ativo ? 'text-slate-700' : 'text-slate-400'}`}>{o.nome}</p>
                          <p className="text-xs text-slate-400">
                            {o.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            {o.periodicidade ? ` · ${o.periodicidade}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setEditingOferta(o); setOfertaOpen(true) }}
                            className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
                            title="Editar variante"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleOferta(o)}
                            disabled={togglePending}
                            className={`rounded p-1.5 transition hover:bg-white ${o.ativo ? 'text-slate-400 hover:text-amber-500' : 'text-slate-300 hover:text-emerald-600'}`}
                            title={o.ativo ? 'Desativar' : 'Ativar'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-4">
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}
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
                {isPending ? 'Salvando...' : produto ? 'Salvar alterações' : 'Criar produto'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {produto && (
        <OfertaDrawer
          open={ofertaOpen}
          onClose={() => setOfertaOpen(false)}
          produtoId={produto.id}
          oferta={editingOferta}
          onSuccess={() => { setOfertaOpen(false); router.refresh() }}
        />
      )}
    </div>
  )
}
