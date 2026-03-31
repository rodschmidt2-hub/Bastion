'use client'

import { ArrowUpCircle, ArrowDownCircle, ArrowRightCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface AlteracaoProduto {
  id: string
  created_at: string
  produto_anterior: string
  produto_novo: string
  valor_anterior: number
  valor_novo: number
  delta: number
  tipo: 'upsell' | 'downsell' | 'lateral'
  motivo: string | null
  alterado_por_nome: string | null
}

interface AlteracoesHistoricoProps {
  itemId: string
  alteracoes: AlteracaoProduto[]
}

export function AlteracoesHistorico({ alteracoes }: AlteracoesHistoricoProps) {
  const [expanded, setExpanded] = useState(false)

  if (alteracoes.length === 0) return null

  const visible = expanded ? alteracoes : alteracoes.slice(0, 2)

  return (
    <div className="border-t border-slate-50 bg-slate-50/30 px-4 py-2 space-y-1">
      {visible.map((a) => {
        const date = new Date(a.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: '2-digit',
        })

        const tipoConfig = {
          upsell:   { icon: ArrowUpCircle,    color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Upsell' },
          downsell: { icon: ArrowDownCircle,  color: 'text-red-500',     bg: 'bg-red-50',     label: 'Downsell' },
          lateral:  { icon: ArrowRightCircle, color: 'text-slate-500',   bg: 'bg-slate-100',  label: 'Troca' },
        }[a.tipo]

        const Icon = tipoConfig.icon
        const deltaStr = a.delta > 0
          ? `+${a.delta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          : a.delta < 0
          ? a.delta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : '—'

        return (
          <div key={a.id} className="flex items-start gap-2 py-1 text-xs text-slate-500">
            <span className={`mt-0.5 shrink-0 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${tipoConfig.color} ${tipoConfig.bg}`}>
              <Icon className="h-3 w-3" />
              {tipoConfig.label}
            </span>
            <span className="leading-4">
              <span className="font-medium text-slate-600">{a.produto_anterior}</span>
              {' → '}
              <span className="font-medium text-slate-600">{a.produto_novo}</span>
              {' '}
              <span className={a.delta > 0 ? 'text-emerald-600' : a.delta < 0 ? 'text-red-500' : ''}>
                {deltaStr}
              </span>
              {a.alterado_por_nome && (
                <span className="text-slate-400"> · {a.alterado_por_nome}</span>
              )}
              <span className="text-slate-400"> · {date}</span>
              {a.motivo && (
                <span className="text-slate-400"> · {a.motivo}</span>
              )}
            </span>
          </div>
        )
      })}

      {alteracoes.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 py-0.5"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Ver menos</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> +{alteracoes.length - 2} alterações</>
          )}
        </button>
      )}
    </div>
  )
}
