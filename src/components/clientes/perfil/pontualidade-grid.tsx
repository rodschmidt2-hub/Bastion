type PontualidadeItem = {
  competencia: string
  status: 'pontual' | 'atraso_leve' | 'atraso_grave' | 'pendente'
}

function getColor(status: PontualidadeItem['status']) {
  return {
    pontual: 'bg-emerald-400',
    atraso_leve: 'bg-amber-400',
    atraso_grave: 'bg-red-500',
    pendente: 'bg-slate-200',
  }[status]
}

function getLabel(status: PontualidadeItem['status']) {
  return {
    pontual: 'Pago no prazo',
    atraso_leve: '1–5 dias de atraso',
    atraso_grave: '> 5 dias de atraso',
    pendente: 'Pendente',
  }[status]
}

export function PontualidadeGrid({ itens }: { itens: PontualidadeItem[] }) {
  const pontual = itens.filter((i) => i.status === 'pontual').length
  const total = itens.length
  const score = total > 0 ? Math.round((pontual / total) * 100) : null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Pontualidade Histórica</h3>
        {score !== null && (
          <span className={`text-sm font-semibold ${score >= 80 ? 'text-emerald-700' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {score}%
          </span>
        )}
      </div>

      {itens.length === 0 ? (
        <p className="text-sm text-slate-400">Sem faturas para calcular pontualidade</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {itens.map((item) => (
              <div
                key={item.competencia}
                title={`${item.competencia} · ${getLabel(item.status)}`}
                className={`h-4 w-4 rounded-sm ${getColor(item.status)}`}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 inline-block" />No prazo</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" />Leve atraso</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block" />Grave</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-200 inline-block" />Pendente</span>
          </div>
        </>
      )}
    </div>
  )
}
