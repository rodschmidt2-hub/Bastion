'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Renovacao } from '@/types/database'

type RenovacaoWithResponsavel = Renovacao & {
  renovado_por_perfil: { nome: string | null } | null
}

interface RenovacoesHistoricoProps {
  itemId: string
  renovacoes: RenovacaoWithResponsavel[]
}

export function RenovacoesHistorico({ itemId, renovacoes }: RenovacoesHistoricoProps) {
  const [open, setOpen] = useState(false)

  const count = renovacoes.length

  return (
    <div className="border-t border-slate-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-400 hover:text-slate-600"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        Histórico de renovações
        {count > 0 && (
          <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-2">
          {count === 0 ? (
            <p className="text-xs text-slate-400">Nenhuma renovação registrada</p>
          ) : (
            renovacoes.map((r) => (
              <div key={r.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">
                    {new Date(r.data_anterior).toLocaleDateString('pt-BR')}
                    {' → '}
                    {new Date(r.data_nova).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-slate-400">
                    {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="mt-0.5 text-slate-500">
                  {r.renovado_por_perfil?.nome ?? 'Usuário desconhecido'}
                  {r.observacoes && ` · ${r.observacoes}`}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
