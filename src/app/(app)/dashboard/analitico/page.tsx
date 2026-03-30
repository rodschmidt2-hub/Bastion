import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function BarraHorizontal({ label, valor, total, cor = 'bg-blue-500' }: { label: string; valor: number; total: number; cor?: string }) {
  const pct = total > 0 ? (valor / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0 text-xs text-slate-600 truncate text-right">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 shrink-0 text-xs text-right">
        <span className="font-medium text-slate-700">{fmt(valor)}</span>
        <span className="text-slate-400 ml-1">({pct.toFixed(0)}%)</span>
      </div>
    </div>
  )
}

export default async function AnaliticoDashboardPage() {
  const supabase = await createClient()

  const [
    { data: itensAtivos },
    { data: clientes },
    { data: profiles },
    { data: pagamentosTotal },
  ] = await Promise.all([
    supabase
      .from('produtos_contratados')
      .select('valor_efetivo, produto_tipo, produto_categoria:produtos_agencia(categoria, custo_base), cliente_id, clientes(segmento, responsavel_id, custo_aquisicao, data_inicio_relac, created_at)')
      .eq('item_status', 'ativo'),
    supabase.from('clientes').select('id, razao_social, segmento, responsavel_id, custo_aquisicao, data_inicio_relac, created_at, status'),
    supabase.from('profiles').select('id, nome, email'),
    supabase.from('pagamentos').select('valor_pago, status, fatura:faturas!inner(cliente_id)').eq('status', 'confirmado'),
  ])

  const itens = itensAtivos ?? []
  const mrrTotal = itens.filter((i) => i.produto_tipo !== 'pontual').reduce((s, i) => s + (i.valor_efetivo ?? 0), 0)

  // MRR por categoria
  const porCategoria: Record<string, number> = {}
  for (const i of itens) {
    if (i.produto_tipo === 'pontual') continue
    const cat = (i.produto_categoria as any)?.categoria ?? 'Sem categoria'
    porCategoria[cat] = (porCategoria[cat] ?? 0) + (i.valor_efetivo ?? 0)
  }
  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])

  // MRR por segmento
  const porSegmento: Record<string, number> = {}
  for (const i of itens) {
    if (i.produto_tipo === 'pontual') continue
    const seg = (i.clientes as any)?.segmento ?? 'Não informado'
    porSegmento[seg] = (porSegmento[seg] ?? 0) + (i.valor_efetivo ?? 0)
  }
  const segmentos = Object.entries(porSegmento).sort((a, b) => b[1] - a[1])

  // MRR por responsável
  const porResponsavel: Record<string, number> = {}
  for (const i of itens) {
    if (i.produto_tipo === 'pontual') continue
    const respId = (i.clientes as any)?.responsavel_id
    const resp = profiles?.find((p) => p.id === respId)
    const nome = resp?.nome ?? resp?.email ?? 'Não atribuído'
    porResponsavel[nome] = (porResponsavel[nome] ?? 0) + (i.valor_efetivo ?? 0)
  }
  const responsaveis = Object.entries(porResponsavel).sort((a, b) => b[1] - a[1])

  // Concentração por cliente
  const mrrPorCliente: Record<string, { nome: string; mrr: number }> = {}
  for (const i of itens) {
    if (i.produto_tipo === 'pontual') continue
    const cid = i.cliente_id
    const c = clientes?.find((cl) => cl.id === cid)
    if (!mrrPorCliente[cid]) mrrPorCliente[cid] = { nome: c?.razao_social ?? '—', mrr: 0 }
    mrrPorCliente[cid].mrr += i.valor_efetivo ?? 0
  }
  const top5 = Object.values(mrrPorCliente).sort((a, b) => b.mrr - a.mrr).slice(0, 5)
  const maxConcentracao = top5.length > 0 && mrrTotal > 0 ? (top5[0].mrr / mrrTotal) * 100 : 0

  // Recorrente vs Pontual
  const mrrRecorrente = itens.filter((i) => i.produto_tipo !== 'pontual').reduce((s, i) => s + (i.valor_efetivo ?? 0), 0)
  const mrrPontual = itens.filter((i) => i.produto_tipo === 'pontual').reduce((s, i) => s + (i.valor_efetivo ?? 0), 0)

  // Margem de contribuição total
  const margem = itens.reduce((s, i) => {
    const custo = (i.produto_categoria as any)?.custo_base ?? 0
    return s + (i.valor_efetivo ?? 0) - custo
  }, 0)

  // LTV por cliente (via pagamentos)
  const ltvPorCliente: Record<string, number> = {}
  for (const p of pagamentosTotal ?? []) {
    const cid = (p.fatura as any)?.cliente_id
    if (cid) ltvPorCliente[cid] = (ltvPorCliente[cid] ?? 0) + p.valor_pago
  }

  // CAC médio (clientes com custo_aquisicao definido)
  const clientesComCac = (clientes ?? []).filter((c) => c.custo_aquisicao && c.custo_aquisicao > 0)
  const cacMedio = clientesComCac.length > 0
    ? clientesComCac.reduce((s, c) => s + (c.custo_aquisicao ?? 0), 0) / clientesComCac.length
    : null

  // LTV médio
  const ltvValores = Object.values(ltvPorCliente)
  const ltvMedio = ltvValores.length > 0 ? ltvValores.reduce((s, v) => s + v, 0) / ltvValores.length : null

  // LTV/CAC médio
  const ltvcacMedio = cacMedio && ltvMedio ? ltvMedio / cacMedio : null

  // Payback médio
  const ticketMedio = mrrTotal > 0 && Object.keys(mrrPorCliente).length > 0
    ? mrrTotal / Object.keys(mrrPorCliente).length
    : null
  const paybackMedio = cacMedio && ticketMedio ? Math.ceil(cacMedio / ticketMedio) : null

  // Tenure médio
  const tenureMedioMeses = (clientes ?? [])
    .filter((c) => c.status === 'ativo')
    .map((c) => {
      const inicio = new Date(c.data_inicio_relac ?? c.created_at)
      return Math.floor((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30))
    })
  const tenureMedio = tenureMedioMeses.length > 0
    ? Math.round(tenureMedioMeses.reduce((s, v) => s + v, 0) / tenureMedioMeses.length)
    : null

  const ltvcacColor = ltvcacMedio === null
    ? 'text-slate-400'
    : ltvcacMedio >= 5 ? 'text-emerald-700' : ltvcacMedio >= 3 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600">← Dashboard</Link>
        <h1 className="text-[20px] font-bold text-slate-900">Análise de Receita</h1>
      </div>

      {/* Métricas de base */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Margem Total</p>
          <p className={`mt-[6px] mb-0.5 text-[26px] font-bold leading-tight ${margem >= 0 ? 'text-slate-900' : 'text-red-600'}`}>{fmt(margem)}</p>
          <p className="text-[11px] text-slate-400">receita − custo base</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">CAC Médio</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-slate-900">{cacMedio !== null ? fmt(cacMedio) : '—'}</p>
          <p className="text-[11px] text-slate-400">{clientesComCac.length} clientes com CAC</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">LTV/CAC Médio</p>
          <p className={`mt-[6px] mb-0.5 text-[26px] font-bold leading-tight ${ltvcacColor}`}>
            {ltvcacMedio !== null ? `${ltvcacMedio.toFixed(1)}×` : '—'}
          </p>
          <p className="text-[11px] text-slate-400">
            {ltvcacMedio === null ? 'sem dados' : ltvcacMedio >= 5 ? 'ótimo' : ltvcacMedio >= 3 ? 'ok' : 'ruim'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Tenure Médio</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-slate-900">{tenureMedio !== null ? `${tenureMedio} meses` : '—'}</p>
          <p className="text-[11px] text-slate-400">
            {paybackMedio !== null ? `Payback: ${paybackMedio} meses` : 'payback sem dados'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* MRR por Categoria */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">MRR por Categoria</h2>
          </div>
          <div className="p-5 space-y-3">
            {categorias.length === 0 ? (
              <p className="text-sm text-slate-400">Sem dados</p>
            ) : categorias.map(([cat, val]) => (
              <BarraHorizontal key={cat} label={cat} valor={val} total={mrrTotal} cor="bg-blue-400" />
            ))}
          </div>
        </div>

        {/* MRR por Segmento */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">MRR por Segmento</h2>
          </div>
          <div className="p-5 space-y-3">
            {segmentos.length === 0 ? (
              <p className="text-sm text-slate-400">Sem dados</p>
            ) : segmentos.map(([seg, val]) => (
              <BarraHorizontal key={seg} label={seg} valor={val} total={mrrTotal} cor="bg-purple-400" />
            ))}
          </div>
        </div>

        {/* MRR por Responsável */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">MRR por Responsável</h2>
          </div>
          <div className="p-5 space-y-3">
            {responsaveis.length === 0 ? (
              <p className="text-sm text-slate-400">Sem dados</p>
            ) : responsaveis.map(([nome, val]) => (
              <BarraHorizontal key={nome} label={nome} valor={val} total={mrrTotal} cor="bg-emerald-400" />
            ))}
          </div>
        </div>

        {/* Concentração + Recorrente/Pontual */}
        <div className="space-y-4">
          {/* Concentração */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Concentração de Receita</h2>
              {maxConcentracao > 20 && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Concentrado
                </span>
              )}
            </div>
            <div className="p-5 space-y-2.5">
              {top5.map((c) => (
                <BarraHorizontal key={c.nome} label={c.nome} valor={c.mrr} total={mrrTotal} cor="bg-amber-400" />
              ))}
            </div>
          </div>

          {/* Recorrente vs Pontual */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Recorrente vs Pontual</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Recorrente</span>
                <span className="font-semibold text-slate-900">{fmt(mrrRecorrente)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${mrrTotal > 0 ? (mrrRecorrente / (mrrRecorrente + mrrPontual)) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Pontual</span>
                <span className="font-semibold text-slate-900">{fmt(mrrPontual)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
