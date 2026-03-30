import Link from 'next/link'
import { Users, Wallet, AlertTriangle, Star, RefreshCw, TrendingUp, TrendingDown, BarChart2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MrrHistoricoChart } from '@/components/financeiro/mrr-historico-chart'
import type { Contrato } from '@/types/database'

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtPct(v: number) {
  return `${v.toFixed(1)}%`
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">
      {children}
    </p>
  )
}

function KpiCard({
  label,
  value,
  sub,
  color = 'default',
  highlight = false,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  color?: 'default' | 'green' | 'red' | 'amber' | 'blue'
  highlight?: boolean
}) {
  const valueCls = {
    default: 'text-slate-900',
    green: 'text-emerald-700',
    red: 'text-red-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
  }[color]

  return (
    <div className={`rounded-xl border px-5 py-[18px] ${highlight ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">{label}</p>
      <p className={`mt-[6px] mb-0.5 text-[26px] font-bold leading-tight ${valueCls}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  )
}

function KpiCardAlert({
  label,
  value,
  sub,
  variant = 'red',
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  variant?: 'red' | 'amber'
}) {
  const cls = variant === 'red'
    ? 'border-red-200 bg-red-50'
    : 'border-amber-200 bg-amber-50'
  const valCls = variant === 'red' ? 'text-red-700' : 'text-amber-700'
  return (
    <div className={`rounded-xl border px-5 py-[18px] ${cls}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">{label}</p>
      <p className={`mt-[6px] mb-0.5 text-[26px] font-bold leading-tight ${valCls}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    { data: clientes },
    { data: produtosAtivos },
    { data: contratos },
    { data: mrrHistorico },
    { data: npsRegistros },
    { data: faturas },
    { data: renovacoes },
    { data: faturasLtv },
  ] = await Promise.all([
    supabase.from('clientes').select('id, razao_social, status, created_at, data_inativacao, custo_aquisicao, segmento'),
    supabase.from('produtos_contratados').select('valor_efetivo, cliente_id, data_fim_item, produto_tipo, categoria').eq('item_status', 'ativo'),
    supabase.from('contratos').select('id, cliente_id, tipo, data_fim, status').eq('status', 'ativo'),
    supabase.from('mrr_historico').select('competencia, mrr, clientes_ativos').order('competencia', { ascending: true }).limit(12),
    supabase.from('nps_registros').select('cliente_id, score, data_registro, responsavel:profiles(nome)').order('data_registro', { ascending: false }),
    supabase.from('faturas').select('id, cliente_id, saldo_devedor, valor_total, valor_pago, status, data_vencimento').in('status', ['atrasado', 'pendente', 'parcial']),
    supabase.from('renovacoes').select('valor_anterior, valor_novo, created_at').gte('created_at', inicioMes).lte('created_at', fimMes),
    supabase.from('faturas').select('valor_total').eq('status', 'pago'),
  ])

  // ── RECEITA ──────────────────────────────────────────────────────────────
  const mrrRecorrente = (produtosAtivos ?? [])
    .filter((p) => p.produto_tipo !== 'pontual')
    .reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)

  const mrrPontual = (produtosAtivos ?? [])
    .filter((p) => p.produto_tipo === 'pontual')
    .reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)

  const mrrTotal = mrrRecorrente
  const arrTotal = mrrTotal * 12

  const ltvAcumulado = (faturasLtv ?? []).reduce((s, f) => s + (f.valor_total ?? 0), 0)

  const clientesAtivos = (clientes ?? []).filter((c) => c.status === 'ativo').length
  const clientesInadimp = (clientes ?? []).filter((c) => ['inadimplente', 'suspenso'].includes(c.status))
  const clientesNovos = (clientes ?? []).filter((c) => c.created_at >= inicioMes).length
  const clientesInativados = (clientes ?? []).filter(
    (c) => c.data_inativacao && c.data_inativacao >= inicioMes && c.data_inativacao <= fimMes
  )

  const ticketMedio = clientesAtivos > 0 ? mrrTotal / clientesAtivos : 0

  // CAC
  const clientesComCAC = (clientes ?? []).filter((c) => (c as any).custo_aquisicao > 0)
  const cacMedio = clientesComCAC.length > 0
    ? clientesComCAC.reduce((s, c) => s + ((c as any).custo_aquisicao ?? 0), 0) / clientesComCAC.length
    : null

  // ── RETENÇÃO ─────────────────────────────────────────────────────────────
  const mrrAnterior = mrrHistorico && mrrHistorico.length >= 2
    ? mrrHistorico[mrrHistorico.length - 2].mrr
    : mrrTotal

  const expansionMrr = (renovacoes ?? [])
    .filter((r) => (r.valor_novo ?? 0) > (r.valor_anterior ?? 0))
    .reduce((s, r) => s + ((r.valor_novo ?? 0) - (r.valor_anterior ?? 0)), 0)

  const contractionMrr = (renovacoes ?? [])
    .filter((r) => (r.valor_novo ?? 0) < (r.valor_anterior ?? 0))
    .reduce((s, r) => s + ((r.valor_anterior ?? 0) - (r.valor_novo ?? 0)), 0)

  const churnClienteIds = new Set(clientesInativados.map((c) => c.id))
  const churnMrr = (produtosAtivos ?? [])
    .filter((p) => churnClienteIds.has(p.cliente_id))
    .reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)

  const nrr = mrrAnterior > 0
    ? ((mrrAnterior + expansionMrr - contractionMrr - churnMrr) / mrrAnterior) * 100
    : 0

  const contratosVencendo = ((contratos ?? []) as Contrato[]).filter((c) => {
    if (!c.data_fim) return false
    const d = daysUntil(c.data_fim)
    return d >= 0 && d <= 30
  })

  // Taxa de Renovação — % contratos ativos que não estão vencendo
  const totalContratos = (contratos ?? []).length
  const taxaRenovacao = totalContratos > 0
    ? ((totalContratos - contratosVencendo.length) / totalContratos) * 100
    : null

  // ── AQUISIÇÃO E SAÚDE ─────────────────────────────────────────────────────
  const ltvPorCliente = clientesAtivos > 0 ? ltvAcumulado / clientesAtivos : 0
  const ltvCac = cacMedio && ltvPorCliente > 0 ? ltvPorCliente / cacMedio : null
  const paybackMeses = cacMedio && ticketMedio > 0 ? Math.round(cacMedio / ticketMedio) : null

  // NPS
  const ultimaNpsPorCliente: Record<string, { score: number; data_registro: string; responsavel: string; clienteId: string; clienteNome: string }> = {}
  for (const n of (npsRegistros ?? [])) {
    if (!ultimaNpsPorCliente[n.cliente_id]) {
      const cliente = (clientes ?? []).find((c) => c.id === n.cliente_id)
      ultimaNpsPorCliente[n.cliente_id] = {
        score: n.score,
        data_registro: n.data_registro,
        responsavel: (n.responsavel as any)?.nome ?? '—',
        clienteId: n.cliente_id,
        clienteNome: cliente?.razao_social ?? '—',
      }
    }
  }
  const npsArr = Object.values(ultimaNpsPorCliente)
  const npsMedia = npsArr.length > 0 ? npsArr.reduce((s, n) => s + n.score, 0) / npsArr.length : null
  const npsAlertas = npsArr.filter((n) => n.score <= 6).sort((a, b) => a.score - b.score)
  const npsBaixoCount = npsAlertas.length

  // ── ALERTAS ────────────────────────────────────────────────────────────────
  const emAberto = (faturas ?? []).reduce(
    (s, f) => s + (f.saldo_devedor ?? Math.max(0, f.valor_total - f.valor_pago)),
    0
  )

  // ── GRÁFICOS ──────────────────────────────────────────────────────────────
  // MRR por Categoria
  const mrrPorCategoria: Record<string, number> = {}
  for (const p of produtosAtivos ?? []) {
    const cat = (p as any).categoria ?? 'Sem categoria'
    mrrPorCategoria[cat] = (mrrPorCategoria[cat] ?? 0) + (p.valor_efetivo ?? 0)
  }
  const mrrCategoriaArr = Object.entries(mrrPorCategoria)
    .sort(([, a], [, b]) => b - a)

  // Receita por Segmento
  const clienteSegmentoMap = Object.fromEntries(
    (clientes ?? []).map(c => [c.id, (c as any).segmento as string | null])
  )
  const mrrPorSegmento: Record<string, number> = {}
  for (const p of produtosAtivos ?? []) {
    const seg = clienteSegmentoMap[p.cliente_id] ?? 'outro'
    mrrPorSegmento[seg] = (mrrPorSegmento[seg] ?? 0) + (p.valor_efetivo ?? 0)
  }
  const segmentoLabel: Record<string, string> = { solo: 'Solo', rede: 'Rede', especialidade: 'Especialidade', outro: 'Outro' }
  const mrrSegmentoArr = Object.entries(mrrPorSegmento)
    .sort(([, a], [, b]) => b - a)

  // Concentração Top 5
  const mrrPorCliente: Record<string, { nome: string; mrr: number; id: string }> = {}
  for (const p of produtosAtivos ?? []) {
    if (!mrrPorCliente[p.cliente_id]) {
      const c = (clientes ?? []).find(c => c.id === p.cliente_id)
      mrrPorCliente[p.cliente_id] = { nome: c?.razao_social ?? '—', mrr: 0, id: p.cliente_id }
    }
    mrrPorCliente[p.cliente_id].mrr += p.valor_efetivo ?? 0
  }
  const top5 = Object.values(mrrPorCliente)
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, 5)
  const top1Pct = mrrTotal > 0 ? (top5[0]?.mrr ?? 0) / mrrTotal * 100 : 0

  // ── CORES ──────────────────────────────────────────────────────────────────
  const nrrColor: 'green' | 'amber' | 'red' = nrr >= 100 ? 'green' : nrr >= 80 ? 'amber' : 'red'
  const npsColor: 'green' | 'amber' | 'red' = (npsMedia ?? 0) >= 8 ? 'green' : (npsMedia ?? 0) >= 6 ? 'amber' : 'red'
  const mesAtual = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-400 capitalize">{mesAtual}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <Link
            href="/dashboard/analitico"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <BarChart2 className="h-4 w-4" />
            Análise de Receita
          </Link>
        </div>
      </div>

      {/* ── BLOCO 1: RECEITA ── */}
      <div>
        <SectionLabel>Receita</SectionLabel>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-4">
          <KpiCard label="MRR Total" value={fmt(mrrTotal)} sub={`ARR: ${fmt(arrTotal)}`} color="blue" highlight />
          <KpiCard label="ARR" value={fmt(arrTotal)} sub="MRR × 12" color="blue" highlight />
          <KpiCard label="LTV Acumulado" value={fmt(ltvAcumulado)} sub="Histórico confirmado" />
          <KpiCard label="Ticket Médio" value={ticketMedio > 0 ? fmt(ticketMedio) : '—'} sub={`MRR ÷ ${clientesAtivos} clientes ativos`} />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard label="Recorrente (MRR)" value={fmt(mrrRecorrente)} sub="Receita mensal recorrente" color="green" />
          <KpiCard label="Pontual (one-time)" value={fmt(mrrPontual)} sub="Serviços avulsos ativos" />
          <KpiCard label="CAC Médio" value={cacMedio ? fmt(cacMedio) : '—'} sub={cacMedio ? `${clientesComCAC.length} clientes com CAC` : 'Sem dados'} />
          <KpiCard label="Clientes Ativos" value={clientesAtivos} sub={`+${clientesNovos} novos este mês`} />
        </div>
      </div>

      {/* ── BLOCO 2: RETENÇÃO ── */}
      <div>
        <SectionLabel>Retenção e Crescimento</SectionLabel>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard
            label="NRR"
            value={mrrAnterior > 0 ? fmtPct(nrr) : '—'}
            sub={nrr >= 100 ? 'crescimento orgânico' : nrr >= 80 ? 'saudável' : 'atenção'}
            color={nrrColor}
            highlight={nrr >= 100}
          />
          <KpiCard
            label="Expansion MRR"
            value={expansionMrr > 0 ? `+ ${fmt(expansionMrr)}` : fmt(expansionMrr)}
            sub="Upsell + reajustes"
            color={expansionMrr > 0 ? 'green' : 'default'}
          />
          <KpiCard
            label="Contraction MRR"
            value={contractionMrr > 0 ? `- ${fmt(contractionMrr)}` : fmt(contractionMrr)}
            sub="Reduções de serviço"
            color={contractionMrr > 0 ? 'amber' : 'default'}
          />
          <KpiCard
            label="Taxa de Renovação"
            value={taxaRenovacao !== null ? fmtPct(taxaRenovacao) : '—'}
            sub={`${contratosVencendo.length} contrato${contratosVencendo.length !== 1 ? 's' : ''} vencendo em 30d`}
            color={taxaRenovacao !== null && taxaRenovacao >= 80 ? 'green' : 'amber'}
          />
        </div>
      </div>

      {/* ── BLOCO 3: AQUISIÇÃO E SAÚDE ── */}
      <div>
        <SectionLabel>Aquisição e Saúde</SectionLabel>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
            <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">LTV / CAC</p>
            <div className="mt-[6px] mb-0.5 flex items-center gap-2">
              <p className={`text-[26px] font-bold leading-tight ${ltvCac !== null ? (ltvCac >= 3 ? 'text-emerald-700' : ltvCac >= 1.5 ? 'text-amber-600' : 'text-red-600') : 'text-slate-900'}`}>
                {ltvCac !== null ? `${ltvCac.toFixed(1)}×` : '—'}
              </p>
              {ltvCac !== null && (
                <div className={`h-2.5 w-2.5 rounded-full ${ltvCac >= 3 ? 'bg-emerald-400' : ltvCac >= 1.5 ? 'bg-amber-400' : 'bg-red-400'}`} title={ltvCac >= 3 ? 'Saudável' : 'Atenção'} />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">Benchmark mínimo: ≥ 3×</p>
          </div>
          <KpiCard
            label="Payback Period"
            value={paybackMeses !== null ? `${paybackMeses} meses` : '—'}
            sub="CAC ÷ ticket médio"
            color={paybackMeses !== null && paybackMeses <= 12 ? 'green' : paybackMeses !== null ? 'amber' : 'default'}
          />
          <KpiCard
            label="NPS Médio"
            value={npsMedia !== null ? npsMedia.toFixed(1) : '—'}
            sub={npsAlertas.length > 0 ? `${npsAlertas.length} cliente${npsAlertas.length > 1 ? 's' : ''} com NPS ≤ 6 ⚠️` : `${npsArr.length} resposta${npsArr.length !== 1 ? 's' : ''}`}
            color={npsColor}
          />
          <KpiCard
            label="Churn MRR"
            value={churnMrr > 0 ? `- ${fmt(churnMrr)}` : fmt(churnMrr)}
            sub={`${clientesInativados.length} inativado${clientesInativados.length !== 1 ? 's' : ''} este mês`}
            color={churnMrr > 0 ? 'red' : 'default'}
          />
        </div>
      </div>

      {/* ── BLOCO 4: ALERTAS ── */}
      <div>
        <SectionLabel>Alertas</SectionLabel>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {clientesInadimp.length > 0
            ? <KpiCardAlert label="Inadimplentes" value={clientesInadimp.length} sub={`${fmt(emAberto)} em aberto`} variant="red" />
            : <KpiCard label="Inadimplentes" value="0" sub="Nenhum cliente inadimplente" color="green" />
          }
          {contratosVencendo.length > 0
            ? <KpiCardAlert label="Renovações em 30d" value={contratosVencendo.length} sub={`${contratosVencendo.filter(c => daysUntil(c.data_fim!) <= 7).length} críticas (≤ 7 dias)`} variant="amber" />
            : <KpiCard label="Renovações em 30d" value="0" sub="Nenhum contrato crítico" color="green" />
          }
          {emAberto > 0
            ? <KpiCardAlert label="Em Aberto" value={fmt(emAberto)} sub={`${(faturas ?? []).length} fatura${(faturas ?? []).length !== 1 ? 's' : ''} pendente${(faturas ?? []).length !== 1 ? 's' : ''}`} variant="red" />
            : <KpiCard label="Em Aberto" value={fmt(0)} sub="Sem faturas em atraso" color="green" />
          }
          {npsBaixoCount > 0
            ? <KpiCardAlert label="NPS Baixo (≤ 6)" value={npsBaixoCount} sub="Risco de churn — contato urgente" variant="amber" />
            : <KpiCard label="NPS Baixo (≤ 6)" value="0" sub="Sem detratores" color="green" />
          }
        </div>
      </div>

      {/* ── MRR Chart ── */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">MRR Histórico</h2>
          <span className="text-xs text-slate-400">últimos 12 meses</span>
        </div>
        <div className="p-5">
          <MrrHistoricoChart dados={mrrHistorico ?? []} />
        </div>
      </div>

      {/* ── Gráficos de Receita ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* MRR por Categoria */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">MRR por Categoria</h2>
          {mrrCategoriaArr.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {mrrCategoriaArr.map(([cat, val], i) => {
                const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706']
                const color = colors[i % colors.length]
                const pct = mrrTotal > 0 ? (val / mrrTotal) * 100 : 0
                return (
                  <div key={cat} className="flex items-center gap-2.5">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} />
                    <span className="flex-1 text-sm text-slate-700 truncate">{cat}</span>
                    <div className="flex-[2] h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 min-w-[56px] text-right">
                      {val >= 1000 ? `R$ ${(val / 1000).toFixed(1)}k` : fmt(val)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Receita por Segmento */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Receita por Segmento</h2>
          {mrrSegmentoArr.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {mrrSegmentoArr.map(([seg, val], i) => {
                const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669']
                const color = colors[i % colors.length]
                const pct = mrrTotal > 0 ? (val / mrrTotal) * 100 : 0
                return (
                  <div key={seg} className="flex items-center gap-2.5">
                    <span className="flex-1 text-sm text-slate-700">{segmentoLabel[seg] ?? seg}</span>
                    <div className="flex-[2] h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 min-w-[56px] text-right">
                      {val >= 1000 ? `R$ ${(val / 1000).toFixed(1)}k` : fmt(val)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Concentração Top 5 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Concentração de Receita — Top 5</h2>
          {top5.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Sem dados</p>
          ) : (
            <>
              <div className="space-y-3">
                {top5.map((c, i) => {
                  const pct = mrrTotal > 0 ? (c.mrr / mrrTotal) * 100 : 0
                  const barColor = i === 0 && pct >= 20 ? '#ef4444' : i <= 1 ? '#f59e0b' : '#94a3b8'
                  return (
                    <div key={c.id} className="flex items-center gap-2.5 text-xs">
                      <span className={`flex-1 font-medium truncate ${i >= 2 ? 'text-slate-500' : 'text-slate-800'}`}>{c.nome}</span>
                      <div className="flex-[2] h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <span className={`font-bold min-w-[32px] text-right ${i >= 2 ? 'text-slate-400' : 'text-slate-800'}`}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  )
                })}
              </div>
              {top1Pct >= 20 && (
                <p className="mt-4 text-[11px] text-slate-400 border-t border-slate-50 pt-3">
                  ⚠️ {top5[0]?.nome} concentra {top1Pct.toFixed(0)}% do MRR — risco de dependência
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Tabelas de alerta ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Inadimplentes — table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">⚠️ Inadimplentes</h2>
            <Link href="/financeiro" className="text-xs text-blue-600 hover:underline">Ver todos →</Link>
          </div>
          {clientesInadimp.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-slate-400">Nenhum cliente inadimplente</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Em aberto</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Atraso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clientesInadimp.slice(0, 5).map((c) => {
                  const faturasCliente = (faturas ?? []).filter(f => f.cliente_id === c.id)
                  const valorAberto = faturasCliente.reduce((s, f) => s + (f.saldo_devedor ?? Math.max(0, f.valor_total - f.valor_pago)), 0)
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/clientes/${c.id}?tab=financeiro`} className="font-medium text-slate-800 hover:text-blue-600">
                          {c.razao_social}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{fmt(valorAberto)}</td>
                      <td className="px-5 py-3">
                        {(() => {
                          const fat = (faturas ?? []).filter(f => f.cliente_id === c.id && f.status === 'atrasado')
                          if (fat.length === 0) return <span className="text-slate-300 text-xs">—</span>
                          const oldest = fat.reduce((a, b) => new Date(a.data_vencimento) < new Date(b.data_vencimento) ? a : b)
                          const dias = Math.floor((Date.now() - new Date(oldest.data_vencimento).getTime()) / (1000 * 60 * 60 * 24))
                          return (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${dias > 10 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                              {dias} dias
                            </span>
                          )
                        })()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* NPS Baixo — table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">😟 NPS Baixo — Ação Urgente</h2>
          </div>
          {npsAlertas.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-slate-400">
                {npsMedia === null ? 'Nenhum NPS registrado' : 'Nenhum cliente em alerta NPS'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">NPS</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Última nota</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {npsAlertas.slice(0, 5).map((n) => (
                  <tr key={n.clienteId} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/clientes/${n.clienteId}?tab=nps`} className="font-medium text-slate-800 hover:text-blue-600">
                        {n.clienteNome}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${n.score <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {n.score}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {new Date(n.data_registro).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{n.responsavel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Projeção de Receita */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Projeção de Receita</h2>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {[1, 2, 3].map((offset) => {
              const target = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1)
              const targetStr = target.toISOString().split('T')[0]
              const garantidos = (produtosAtivos ?? []).filter(
                (p) => p.produto_tipo !== 'pontual' && (!p.data_fim_item || p.data_fim_item >= targetStr)
              )
              const emRisco = (produtosAtivos ?? []).filter(
                (p) =>
                  p.produto_tipo !== 'pontual' &&
                  p.data_fim_item &&
                  p.data_fim_item >= targetStr &&
                  p.data_fim_item <
                    new Date(target.getFullYear(), target.getMonth() + 1, 0).toISOString().split('T')[0]
              )
              const mrr = garantidos.reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)
              const risco = emRisco.reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)
              const label = target.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
              return (
                <div key={offset} className="px-4 py-4 text-center">
                  <p className="text-xs font-medium text-slate-400 capitalize">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{fmt(mrr)}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Set(garantidos.map(p => p.cliente_id)).size} clientes</p>
                  {risco > 0 && <p className="mt-1 text-xs text-amber-600">{fmt(risco)} em risco</p>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Contratos a vencer */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Contratos a vencer em 30 dias</h2>
          </div>
          {contratosVencendo.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-slate-400">Nenhum contrato próximo do vencimento</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Tipo</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contratosVencendo.slice(0, 5).map((c: Contrato) => {
                  const days = daysUntil(c.data_fim!)
                  const cliente = (clientes ?? []).find((cl) => cl.id === c.cliente_id)
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link href={`/clientes/${c.cliente_id}?tab=contratos`} className="font-medium text-slate-800 hover:text-blue-600">
                          {cliente?.razao_social ?? 'Cliente'}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{c.tipo}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${days <= 7 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {days === 0 ? 'Hoje' : `${days}d`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
