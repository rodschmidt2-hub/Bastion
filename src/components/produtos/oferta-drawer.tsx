'use client'

import { useState, useTransition, useRef } from 'react'
import { X } from 'lucide-react'
import { createOferta, updateOferta } from '@/app/actions/ofertas'
import type { ProdutoOferta } from '@/types/database'

interface OfertaDrawerProps {
  open: boolean
  onClose: () => void
  produtoId: string
  oferta?: ProdutoOferta | null
  onSuccess?: () => void
}

const indiceOptions = [
  { value: 'igpm',  label: 'IGP-M' },
  { value: 'ipca',  label: 'IPCA' },
  { value: 'inpc',  label: 'INPC' },
  { value: 'fixo',  label: 'Fixo (%)' },
  { value: 'nenhum', label: 'Nenhum' },
]

export function OfertaDrawer({ open, onClose, produtoId, oferta, onSuccess }: OfertaDrawerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError]            = useState<string | null>(null)
  const [multaTipo, setMultaTipo]    = useState(oferta?.multa_tipo ?? '')
  const [indice, setIndice]          = useState(oferta?.indice_reajuste ?? 'nenhum')
  const [renovAuto, setRenovAuto]    = useState(oferta?.renovacao_automatica ?? true)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = oferta
        ? await updateOferta(oferta.id, produtoId, formData)
        : await createOferta(produtoId, formData)

      if (result.error) { setError(result.error) } else { onSuccess ? onSuccess() : onClose() }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-black/10" onClick={onClose} />
      <div className="flex w-full max-w-sm flex-col bg-white shadow-2xl border-l border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">
            {oferta ? 'Editar variante' : 'Nova variante'}
          </h3>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Nome *</label>
              <input name="nome" required defaultValue={oferta?.nome ?? ''}
                placeholder="Ex: Basic, Pro, Enterprise"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Valor (R$) *</label>
                <input name="valor" type="number" step="0.01" min="0" required
                  defaultValue={oferta?.valor ?? ''}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Periodicidade</label>
                <select name="periodicidade" defaultValue={oferta?.periodicidade ?? 'mensal'}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Carência (meses)</label>
                <input name="carencia_meses" type="number" min="0"
                  defaultValue={oferta?.carencia_meses ?? 0}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Aviso cancel. (dias)</label>
                <input name="prazo_aviso_cancelamento" type="number" min="0"
                  defaultValue={oferta?.prazo_aviso_cancelamento ?? 30}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>

            {/* Multa */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Tipo de multa</label>
              <select name="multa_tipo" value={multaTipo}
                onChange={(e) => setMultaTipo(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">Sem multa</option>
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Fixo (R$)</option>
                <option value="meses">Meses de contrato</option>
              </select>
            </div>
            {multaTipo && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Valor da multa {multaTipo === 'percentual' ? '(%)' : multaTipo === 'fixo' ? '(R$)' : '(meses)'}
                </label>
                <input name="multa_valor" type="number" step="0.01" min="0"
                  defaultValue={oferta?.multa_valor ?? ''}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            )}

            {/* Reajuste */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Índice de reajuste</label>
              <select name="indice_reajuste" value={indice}
                onChange={(e) => setIndice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                {indiceOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {indice === 'fixo' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">% reajuste fixo</label>
                <input name="perc_reajuste_fixo" type="number" step="0.01" min="0"
                  defaultValue={oferta?.perc_reajuste_fixo ?? ''}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            )}

            {/* Renovação automática */}
            <input type="hidden" name="renovacao_automatica" value={renovAuto ? 'true' : 'false'} />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 select-none">
              <button type="button" onClick={() => setRenovAuto((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition ${renovAuto ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${renovAuto ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
              Renovação automática
            </label>

          </div>

          <div className="border-t border-slate-100 px-5 py-4">
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={isPending}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {isPending ? 'Salvando...' : oferta ? 'Salvar' : 'Criar variante'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
