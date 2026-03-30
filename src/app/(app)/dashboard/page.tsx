import Link from 'next/link'
import { Users, Wallet, AlertTriangle, Star, RefreshCw, BarChart2 } from 'lucide-react'
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
  ] = await Promise.all([
    supabase.from('clientes').select('id, razao_social, status, created_at, data_inativacao'),
    supabase
      .from('produtos_contratados')
      .select('valor_efetivo, cliente_id, data_fim_item, produto_tipo')
      .eq('item_status', 'ativo'),
    supabase
      .from('contratos')
      .select('id, cliente_id, tipo, data_fim, status')
      .eq('status', 'ativo'),
    supabase
      .from('mrr_historico')
      .select('competencia, mrr, clientes_ativos')
      .order('competencia', { ascending: true })
      .limit(12),
    supabase
      .from('nps_registros')
      .select('cliente_id, score, data_registro, responsavel:profiles(nome)')
      .order('data_registro', { ascending: false }),
    supabase
      .from('faturas')
      .select('id, cliente_id, saldo_devedor, valor_total, valor_pago, status')
      .in('status', ['atrasado', 'pendente', 'parcial']),
    supabase
      .from('renovacoes')
      .select('valor_anterior, valor_novo, created_at')
      .gte('created_at', inicioMes)
      .lte('created_at', fimMes),
  ])

  // KPIs principais
  const mrrTotal = (produtosAtivos ?? [])
    .filter((p) => p.produto_tipo !== 'pontual')
    .reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)
  const arrTotal = mrrTotal * 12

  const clientesAtivos = (clientes ?? []).filter((c) => c.status === 'ativo').length
  const clientesInadimp = (clientes ?? []).filter((c) => ['inadimplente', 'suspenso'].includes(c.status))
  const clientesNovos = (clientes ?? []).filter((c) => c.created_at >= inicioMes).length
  const clientesInativados = (clientes ?? []).filter(
    (c) => c.data_inativacao && c.data_inativacao >= inicioMes && c.data_inativacao <= fimMes
  )

  // Churn MRR: produtos de clientes inativados no mês
  const churnClienteIds = new Set(clientesInativados.map((c) => c.id))
  const churnMrr = (produtosAtivos ?? [])
    .filter((p) => churnClienteIds.has(p.cliente_id))
    .reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)

  // Expansion / Contraction MRR via renovações
  const expansionMrr = (renovacoes ?? [])
    .filter((r) => (r.valor_novo ?? 0) > (r.valor_anterior ?? 0))
    .reduce((s, r) => s + ((r.valor_novo ?? 0) - (r.valor_anterior ?? 0)), 0)

  const contractionMrr = (renovacoes ?? [])
    .filter((r) => (r.valor_novo ?? 0) < (r.valor_anterior ?? 0))
    .reduce((s, r) => s + ((r.valor_anterior ?? 0) - (r.valor_novo ?? 0)), 0)

  // NRR: usa MRR do mês anterior (último registro histórico)
  const mrrAnterior = mrrHistorico && mrrHistorico.length >= 2
    ? mrrHistorico[mrrHistorico.length - 2].mrr
    : mrrTotal
  const nrr = mrrAnterior > 0
    ? ((mrrAnterior + expansionMrr - contractionMrr - churnMrr) / mrrAnterior) * 100
    : 0

  // Taxa de renovação
  const contratosVencendo = ((contratos ?? []) as Contrato[]).filter((c) => {
    if (!c.data_fim) return false
    const d = daysUntil(c.data_fim)
    return d >= 0 && d <= 30
  })

  // Em aberto total
  const emAberto = (faturas ?? []).reduce(
    (s, f) => s + (f.saldo_devedor ?? Math.max(0, f.valor_total - f.valor_pago)),
    0
  )

  // NPS Global
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

  // Projeção de receita (próximos 3 meses)
  const itensAtivos = produtosAtivos ?? []
  const projecao = [1, 2, 3].map((offset) => {
    const target = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1)
    const targetStr = target.toISOString().split('T')[0]
    const garantidos = itensAtivos.filter(
      (p) => p.produto_tipo !== 'pontual' && (!p.data_fim_item || p.data_fim_item >= targetStr)
    )
    const emRisco = itensAtivos.filter(
      (p) =>
        p.produto_tipo !== 'pontual' &&
        p.data_fim_item &&
        p.data_fim_item >= targetStr &&
        p.data_fim_item <
          new Date(target.getFullYear(), target.getMonth() + 1, 0).toISOString().split('T')[0]
    )
    return {
      label: target.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      mrr: garantidos.reduce((s, p) => s + (p.valor_efetivo ?? 0), 0),
      clientes: new Set(garantidos.map((p) => p.cliente_id)).size,
      risco: emRisco.reduce((s, p) => s + (p.valor_efetivo ?? 0), 0),
    }
  })

  const nrrColor = nrr >= 100 ? 'text-emerald-700' : nrr >= 80 ? 'text-amber-600' : 'text-red-600'
  const npsColor = (npsMedia ?? 0) >= 8 ? 'text-emerald-700' : (npsMedia ?? 0) >= 6 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">Visão geral da operação</p>
        </div>
        <Link
          href="/dashboard/analitico"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <BarChart2 className="h-4 w-4" />
          Análise de Receita
        </Link>
      </div>

      {/* KPIs Row 1: MRR, ARR, LTV, NRR */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">MRR Total</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{fmt(mrrTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">ARR: {fmt(arrTotal)}</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Clientes Ativos</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{clientesAtivos}</p>
          <p className="mt-1 text-xs text-slate-400">+{clientesNovos} novos este mês</p>
        </div>

        <div className={`rounded-xl border p-5 shadow-sm ${emAberto > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Em Aberto</p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${emAberto > 0 ? 'bg-red-100' : 'bg-slate-50'}`}>
              <AlertTriangle className={`h-4 w-4 ${emAberto > 0 ? 'text-red-600' : 'text-slate-400'}`} />
            </div>
          </div>
          <p className={`mt-3 text-2xl font-semibold ${emAberto > 0 ? 'text-red-700' : 'text-slate-900'}`}>{fmt(emAberto)}</p>
          <p className="mt-1 text-xs text-slate-400">{clientesInadimp.length} clientes inadimplentes</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">NRR</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
              <RefreshCw className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <p className={`mt-3 text-2xl font-semibold ${nrrColor}`}>
            {mrrAnterior > 0 ? fmtPct(nrr) : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {nrr >= 100 ? 'crescimento orgânico' : nrr >= 80 ? 'saudável' : 'atenção'}
          </p>
        </div>
      </div>

      {/* KPIs Row 2: Churn, Expansion, Contraction, Renovação */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Churn Clientes</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{clientesInativados.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">inativados este mês</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Churn MRR</p>
          <p className={`mt-2 text-xl font-semibold ${churnMrr > 0 ? 'text-red-600' : 'text-slate-900'}`}>{fmt(churnMrr)}</p>
          <p className="mt-0.5 text-xs text-slate-400">receita perdida</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Expansion MRR</p>
          <p className={`mt-2 text-xl font-semibold ${expansionMrr > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>{fmt(expansionMrr)}</p>
          <p className="mt-0.5 text-xs text-slate-400">via reajustes e novos produtos</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">A vencer em 30d</p>
          <p className={`mt-2 text-xl font-semibold ${contratosVencendo.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{contratosVencendo.length}</p>
          <p className="mt-0.5 text-xs text-slate-400">contratos</p>
        </div>
      </div>

      {/* MRR Chart */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">MRR Histórico</h2>
          <span className="text-xs text-slate-400">últimos 12 meses</span>
        </div>
        <div className="p-5">
          <MrrHistoricoChart dados={mrrHistorico ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Projeção de Receita */}
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Projeção de Receita</h2>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {projecao.map((p, i) => (
              <div key={i} className="px-4 py-4 text-center">
                <p className="text-xs font-medium text-slate-400 capitalize">{p.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{fmt(p.mrr)}</p>
                <p className="mt-0.5 text-xs text-slate-400">{p.clientes} clientes</p>
                {p.risco > 0 && (
                  <p className="mt-1 text-xs text-amber-600">{fmt(p.risco)} em risco</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* NPS Global */}
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">NPS Global</h2>
            {npsMedia !== null && (
              <span className={`text-lg font-bold ${npsColor}`}>
                {npsMedia.toFixed(1)}
                <Star className="inline h-3.5 w-3.5 ml-0.5 mb-0.5" />
              </span>
            )}
          </div>
          {npsAlertas.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-slate-400">
                {npsMedia === null ? 'Nenhum NPS registrado' : 'Nenhum cliente em alerta NPS'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {npsAlertas.slice(0, 5).map((n) => (
                <li key={n.clienteId}>
                  <Link
                    href={`/clientes/${n.clienteId}?tab=nps`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      n.score <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {n.score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-700 hover:text-blue-600">{n.clienteNome}</p>
                      <p className="text-xs text-slate-400">{n.responsavel}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(n.data_registro).toLocaleDateString('pt-BR')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inadimplentes */}
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Clientes inadimplentes / suspensos</h2>
          </div>
          {clientesInadimp.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-slate-400">Nenhum cliente inadimplente</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {clientesInadimp.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/clientes/${c.id}?tab=financeiro`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-semibold text-red-600">
                      {c.razao_social.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-700 hover:text-blue-600 flex-1 truncate">{c.razao_social}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.status === 'suspenso' ? 'bg-red-100 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {c.status === 'suspenso' ? 'Suspenso' : 'Inadimplente'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Contratos a vencer */}
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Contratos a vencer em 30 dias</h2>
          </div>
          {contratosVencendo.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-slate-400">Nenhum contrato próximo do vencimento</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {contratosVencendo.slice(0, 6).map((c: Contrato) => {
                const days = daysUntil(c.data_fim!)
                const cliente = (clientes ?? []).find((cl) => cl.id === c.cliente_id)
                return (
                  <li key={c.id}>
                    <Link href={`/clientes/${c.cliente_id}?tab=contratos`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-semibold text-amber-600">
                        {(cliente?.razao_social ?? 'CL').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-700 hover:text-blue-600">{cliente?.razao_social ?? 'Cliente'}</p>
                        <p className="text-xs text-slate-400">{c.tipo}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        days <= 7 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {days === 0 ? 'Hoje' : `${days}d`}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
