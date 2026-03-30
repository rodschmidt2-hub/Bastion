'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

type MrrPonto = {
  competencia: string
  mrr: number
  clientes_ativos: number
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtLabel(comp: string) {
  const [year, month] = comp.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold text-slate-700 mb-1">{fmtLabel(label)}</p>
      <p className="text-emerald-700">MRR: {fmt(payload[0]?.value ?? 0)}</p>
      <p className="text-slate-500">Clientes: {payload[1]?.value ?? 0}</p>
    </div>
  )
}

export function MrrHistoricoChart({ dados }: { dados: MrrPonto[] }) {
  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-slate-400">
        Sem dados históricos de MRR ainda
      </div>
    )
  }

  const data = dados.map((d) => ({ ...d, label: fmtLabel(d.competencia) }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="competencia"
          tickFormatter={fmtLabel}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="mrr"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3, fill: '#10b981' }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="clientes_ativos"
          stroke="#93c5fd"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="4 2"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
