'use client'

import { useState, useTransition } from 'react'
import { saveConfiguracoes } from '@/app/actions/configuracoes'
import type { SistemaConfigMap } from '@/app/actions/configuracoes'

interface Props {
  config: SistemaConfigMap
}

export function AgenciaConfigForm({ config }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveConfiguracoes(formData)
      if (result.error) { setError(result.error) }
      else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">

      {/* Faturamento */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Faturamento</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Gerar fatura com antecedência</p>
              <p className="text-xs text-slate-400">Dias antes do vencimento para criar a fatura</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                name="dias_geracao_fatura"
                type="number"
                min={1}
                max={30}
                defaultValue={config.dias_geracao_fatura}
                className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-xs text-slate-400">dias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inadimplência */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Inadimplência</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Suspender cliente após</p>
              <p className="text-xs text-slate-400">Dias de atraso para suspensão automática</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                name="dias_suspensao_inadimplencia"
                type="number"
                min={1}
                defaultValue={config.dias_suspensao_inadimplencia}
                className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-xs text-slate-400">dias</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Multa por atraso</p>
                <p className="text-xs text-slate-400">Percentual aplicado no vencimento</p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  name="multa_atraso_default"
                  type="number"
                  step="0.1"
                  min={0}
                  defaultValue={config.multa_atraso_default}
                  className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Juros diário</p>
                <p className="text-xs text-slate-400">Por dia de atraso</p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  name="juros_atraso_diario_default"
                  type="number"
                  step="0.001"
                  min={0}
                  defaultValue={config.juros_atraso_diario_default}
                  className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                />
                <span className="text-xs text-slate-400">%/dia</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renovações */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Renovações</h3>
        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Alertas de vencimento</p>
            <p className="text-xs text-slate-400">Criar alerta na timeline do cliente X dias antes</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              name="alerta_renovacao_1"
              type="number"
              min={1}
              defaultValue={config.alerta_renovacao_dias[0] ?? 30}
              className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="text-xs text-slate-400">e</span>
            <input
              name="alerta_renovacao_2"
              type="number"
              min={1}
              defaultValue={config.alerta_renovacao_dias[1] ?? 10}
              className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="text-xs text-slate-400">dias antes</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {saved && <p className="text-sm text-emerald-600">Configurações salvas</p>}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </form>
  )
}
