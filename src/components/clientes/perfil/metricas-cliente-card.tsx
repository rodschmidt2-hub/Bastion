'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { updateCustoAquisicao } from '@/app/actions/clientes-metricas'
import { TooltipInfo } from '@/components/ui/tooltip-info'

type MetricasData = {
  mrr: number
  ltv: number
  cac: number | null
  margem: number | null
  tenureMeses: number
  dataInicioRelac: string | null
  createdAt: string
  userRole: string
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Semaforo({ ratio }: { ratio: number | null }) {
  if (ratio === null) return <span className="text-slate-300">—</span>
  const [cls, label] = ratio >= 5
    ? ['bg-emerald-50 text-emerald-700 ring-emerald-200', 'Ótimo']
    : ratio >= 3
    ? ['bg-amber-50 text-amber-700 ring-amber-200', 'Ok']
    : ['bg-red-50 text-red-700 ring-red-200', 'Ruim']
  return (
    <div className="group relative inline-flex">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
        {ratio.toFixed(1)}× <span className="font-normal opacity-70">{label}</span>
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 w-48 rounded-lg border border-slate-200 bg-white shadow-lg p-2 text-xs text-slate-600">
        {'< 3× ruim · 3–5× ok · > 5× ótimo'}
      </div>
    </div>
  )
}

const TOOLTIPS: Record<string, string> = {
  'Ticket Médio (MRR)': 'Receita mensal recorrente atual deste cliente. Soma de todos os produtos ativos com periodicidade mensal.',
  'ARR do Cliente': 'Annual Recurring Revenue — projeção anual da receita deste cliente (MRR × 12).',
  'LTV Acumulado': 'Total efetivamente recebido deste cliente desde o início. Calculado com base nas faturas pagas.',
  'Margem de Contribuição': 'Percentual da receita que sobra após descontar o custo base dos produtos entregues.',
  'Payback Period': 'Meses necessários para recuperar o custo de aquisição (CAC ÷ MRR). Até 12 meses é considerado bom.',
  'Tenure': 'Tempo total de relacionamento em meses, contado desde a data de início ou cadastro do cliente.',
  'CAC': 'Customer Acquisition Cost — custo para adquirir este cliente (prospecção, vendas, onboarding). Editável pelo admin.',
  'LTV / CAC': 'Relação entre o valor gerado (LTV) e o custo de aquisição (CAC). Abaixo de 3× exige atenção.',
}

export function MetricasClienteCard({ clienteId, data }: { clienteId: string; data: MetricasData }) {
  const [isPending, startTransition] = useTransition()
  const [editingCac, setEditingCac] = useState(false)
  const [cacInput, setCacInput] = useState(data.cac !== null ? String(data.cac) : '')
  const [error, setError] = useState<string | null>(null)

  const arr = data.mrr * 12
  const ltvcac = data.cac && data.cac > 0 ? data.ltv / data.cac : null
  const payback = data.mrr > 0 && data.cac !== null ? Math.ceil(data.cac / data.mrr) : null

  function handleSaveCac() {
    const valor = cacInput === '' ? null : parseFloat(cacInput)
    setError(null)
    startTransition(async () => {
      const result = await updateCustoAquisicao(clienteId, valor)
      if (result.error) { setError(result.error) } else { setEditingCac(false) }
    })
  }

  const metricas = [
    { label: 'Ticket Médio (MRR)', value: data.mrr > 0 ? fmt(data.mrr) : '—' },
    { label: 'ARR do Cliente', value: data.mrr > 0 ? fmt(arr) : '—' },
    { label: 'LTV Acumulado', value: data.ltv > 0 ? fmt(data.ltv) : '—' },
    { label: 'Margem de Contribuição', value: data.margem !== null ? fmt(data.margem) : '—' },
    { label: 'Payback Period', value: payback !== null ? `${payback} meses` : '—' },
    { label: 'Tenure', value: `${data.tenureMeses} meses` },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">Métricas do Cliente</h3>

      <div className="grid grid-cols-2 gap-3">
        {metricas.map((m) => (
          <div key={m.label} className="rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="flex items-center gap-1">
              <p className="text-xs text-slate-400">{m.label}</p>
              {TOOLTIPS[m.label] && <TooltipInfo text={TOOLTIPS[m.label]} />}
            </div>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{m.value}</p>
          </div>
        ))}

        {/* CAC — editável */}
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-1">
            <p className="text-xs text-slate-400">CAC</p>
            <TooltipInfo text={TOOLTIPS['CAC']} />
          </div>
          {editingCac ? (
            <div className="mt-0.5 flex items-center gap-1">
              <input
                type="number"
                value={cacInput}
                onChange={(e) => setCacInput(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0,00"
                className="w-full rounded border border-slate-200 px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-200"
                autoFocus
              />
              <button onClick={handleSaveCac} disabled={isPending} className="text-emerald-600 hover:text-emerald-700">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditingCac(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="text-sm font-semibold text-slate-800">
                {data.cac !== null ? fmt(data.cac) : '—'}
              </p>
              {data.userRole === 'admin' && (
                <button onClick={() => setEditingCac(true)} className="text-slate-300 hover:text-slate-500">
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* LTV/CAC */}
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-1">
            <p className="text-xs text-slate-400">LTV / CAC</p>
            <TooltipInfo text={TOOLTIPS['LTV / CAC']} />
          </div>
          <div className="mt-1">
            <Semaforo ratio={ltvcac} />
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
