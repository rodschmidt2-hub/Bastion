'use client'

import { useState, useTransition, Fragment } from 'react'
import { Plus, X, CreditCard } from 'lucide-react'
import { gerarFatura, registrarPagamento } from '@/app/actions/faturas'
import { ExportCsvButton } from '@/components/financeiro/export-csv-button'

// ─── Types ────────────────────────────────────────────────────────────────────

type Fatura = {
  id: string
  numero_fatura: string
  competencia: string
  data_vencimento: string
  valor_total: number
  valor_pago: number
  saldo_devedor: number | null
  status: string
  tipo: string
  itens?: { id: string; descricao: string; valor: number }[]
  pagamentos?: { id: string; data_pagamento: string; valor_pago: number; forma_pagamento: string | null }[]
}

type PontualidadeItem = {
  competencia: string
  status: 'pontual' | 'atraso_leve' | 'atraso_grave' | 'pendente'
}

type RenovacaoEnriquecida = {
  id: string
  created_at: string
  produto_nome: string | null
  valor_anterior: number | null
  valor_novo: number | null
  data_nova: string
  renovado_por_nome?: string | null
}

interface FinanceiroTabProps {
  clienteId: string
  faturas: Fatura[]
  mrr: number
  notaFinanceira?: string | null
  pontualidade?: PontualidadeItem[]
  renovacoes?: RenovacaoEnriquecida[]
  metricas?: {
    ltv: number
    cac: number | null
    margem: number | null
    tenureMeses: number
    dataInicioRelac: string | null
    createdAt: string
    userRole: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtK(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}k`
  return String(Math.round(v))
}

function diasAte(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff
}

function mesAno(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function mesAnoHeader(dateStr: string) {
  const s = mesAno(dateStr)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  pendente:  { label: 'Pendente',  cls: 'bg-amber-50 text-amber-700' },
  parcial:   { label: 'Parcial',   cls: 'bg-blue-50 text-blue-700' },
  pago:      { label: 'Pago',      cls: 'bg-emerald-50 text-emerald-700' },
  atrasado:  { label: 'Atrasado',  cls: 'bg-red-50 text-red-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500' },
}

const formaLabel: Record<string, string> = {
  pix: 'PIX', boleto: 'Boleto', cartao: 'Cartão', transferencia: 'Transferência', outro: 'Outro',
}

// ─── Modal Pagamento ───────────────────────────────────────────────────────────

function PagamentoModal({ faturaId, clienteId, onClose }: { faturaId: string; clienteId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await registrarPagamento(faturaId, clienteId, formData)
      if (result.error) { setError(result.error) } else { onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Registrar pagamento</h3>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button>
        </div>
        <form action={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Data *</label>
              <input name="data_pagamento" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Valor (R$) *</label>
              <input name="valor" type="number" step="0.01" min="0.01" required placeholder="0,00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Forma de pagamento</label>
            <select name="forma_pagamento" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
              <option value="pix">PIX</option>
              <option value="boleto">Boleto</option>
              <option value="cartao">Cartão</option>
              <option value="transferencia">Transferência</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Comprovante (URL)</label>
            <input name="comprovante_url" type="url" placeholder="https://..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending ? 'Registrando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

type TlFilter = 'todos' | 'cobrancas' | 'pagamentos' | 'renovacoes'

type TlEvent =
  | { tipo: 'fatura'; date: Date; fatura: Fatura }
  | { tipo: 'pagamento'; date: Date; valor: number; forma: string | null; competencia: string }
  | { tipo: 'renovacao'; date: Date; renovacao: RenovacaoEnriquecida }

function buildTimeline(faturas: Fatura[], renovacoes: RenovacaoEnriquecida[]): TlEvent[] {
  const events: TlEvent[] = []
  for (const f of faturas) {
    events.push({ tipo: 'fatura', date: new Date(f.data_vencimento), fatura: f })
    for (const p of f.pagamentos ?? []) {
      events.push({ tipo: 'pagamento', date: new Date(p.data_pagamento), valor: p.valor_pago, forma: p.forma_pagamento, competencia: f.competencia })
    }
  }
  for (const r of renovacoes) {
    events.push({ tipo: 'renovacao', date: new Date(r.created_at), renovacao: r })
  }
  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}

function groupByMonth(events: TlEvent[]): [string, TlEvent[]][] {
  const map = new Map<string, TlEvent[]>()
  for (const ev of events) {
    const key = mesAnoHeader(ev.date.toISOString())
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  }
  return Array.from(map.entries())
}

function TlDot({ color }: { color: 'green' | 'blue' | 'red' | 'amber' | 'slate' }) {
  const cls = {
    green: 'bg-emerald-500', blue: 'bg-blue-500', red: 'bg-red-500',
    amber: 'bg-amber-500', slate: 'bg-slate-300',
  }[color]
  return (
    <div className="flex flex-col items-center">
      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${cls}`} />
      <div className="w-px flex-1 bg-slate-100 mt-1" />
    </div>
  )
}

function TimelineEvent({ ev, onPagar }: { ev: TlEvent; onPagar?: (id: string) => void }) {
  if (ev.tipo === 'fatura') {
    const f = ev.fatura
    const badge = statusBadge[f.status] ?? statusBadge.pendente
    const isAtrasado = f.status === 'atrasado'
    const isPendente = f.status === 'pendente' || f.status === 'parcial'
    const dotColor = isAtrasado ? 'red' : f.status === 'pago' ? 'green' : 'amber'
    const itensDesc = (f.itens ?? []).map(i => i.descricao).join(' + ')

    return (
      <div className="flex gap-3 pb-4">
        <TlDot color={dotColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-800">Fatura {f.competencia}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                {badge.label}{isAtrasado ? ` · ${Math.abs(diasAte(f.data_vencimento))}d` : ''}
              </span>
            </div>
            {f.status !== 'pago' && (
              <span className="text-sm font-semibold text-red-600">{fmt(f.valor_total)}</span>
            )}
            {f.status === 'pago' && (
              <span className="text-sm font-semibold text-slate-400">{fmt(f.valor_total)}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Venceu {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}
            {itensDesc && ` · ${itensDesc}`}
          </p>
          {(isPendente || isAtrasado) && onPagar && (
            <button
              onClick={() => onPagar(f.id)}
              className="mt-2 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <CreditCard className="h-3 w-3" /> Quitar fatura
            </button>
          )}
        </div>
      </div>
    )
  }

  if (ev.tipo === 'pagamento') {
    return (
      <div className="flex gap-3 pb-4">
        <TlDot color="green" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">
              Pagamento recebido — Fatura {ev.competencia}
            </span>
            <span className="text-sm font-semibold text-emerald-600">+ {fmt(ev.valor)}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {ev.date.toLocaleDateString('pt-BR')}
            {ev.forma && ` · ${formaLabel[ev.forma] ?? ev.forma}`}
          </p>
        </div>
      </div>
    )
  }

  // renovacao
  const r = ev.renovacao
  const temReajuste = r.valor_anterior !== null && r.valor_novo !== null && r.valor_anterior !== r.valor_novo
  const perc = temReajuste
    ? (((r.valor_novo! - r.valor_anterior!) / r.valor_anterior!) * 100).toFixed(1)
    : null

  return (
    <div className="flex gap-3 pb-4">
      <TlDot color="blue" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800">
            Renovação{r.produto_nome ? ` — ${r.produto_nome}` : ''}
          </span>
          {perc && (
            <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
              +{perc}% reajuste
            </span>
          )}
          {!perc && (
            <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Renovado
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-400">
          {ev.date.toLocaleDateString('pt-BR')}
          {temReajuste && ` · ${fmt(r.valor_anterior!)} → ${fmt(r.valor_novo!)}`}
          {` · Renovado até ${new Date(r.data_nova).toLocaleDateString('pt-BR')}`}
        </p>
      </div>
    </div>
  )
}

// ─── Pontualidade Card (sidebar) ───────────────────────────────────────────────

function PontualidadeCard({ itens }: { itens: PontualidadeItem[] }) {
  const pontual = itens.filter(i => i.status === 'pontual').length
  const atrasado = itens.filter(i => i.status === 'atraso_leve').length
  const grave = itens.filter(i => i.status === 'atraso_grave').length
  const total = itens.length
  const score = total > 0 ? Math.round((pontual / total) * 100) : null
  const scoreColor = score === null ? 'text-slate-400' : score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'

  function dotColor(s: PontualidadeItem['status']) {
    return { pontual: 'bg-emerald-500', atraso_leve: 'bg-amber-400', atraso_grave: 'bg-red-500', pendente: 'bg-slate-200' }[s]
  }
  function dotIcon(s: PontualidadeItem['status']) {
    return { pontual: '✓', atraso_leve: '!', atraso_grave: '✗', pendente: '·' }[s]
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-slate-700">Pontualidade</p>
        {score !== null && <span className={`text-sm font-bold ${scoreColor}`}>{score}%</span>}
      </div>
      <p className="text-xs text-slate-400 mb-3">Últimos {total} pagamentos</p>
      {itens.length === 0 ? (
        <p className="text-xs text-slate-400">Sem histórico</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {itens.map((item, i) => (
              <div
                key={i}
                title={`${item.competencia}`}
                className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white ${dotColor(item.status)}`}
              >
                {dotIcon(item.status)}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500 inline-block" />Em dia ({pontual})</span>
            {atrasado > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400 inline-block" />Atrasado ({atrasado})</span>}
            {grave > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-500 inline-block" />Não pago ({grave})</span>}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function FinanceiroTab({
  clienteId, faturas, mrr, notaFinanceira, pontualidade, renovacoes = [], metricas,
}: FinanceiroTabProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagandoFatura, setPagandoFatura] = useState<string | null>(null)
  const [tlFilter, setTlFilter] = useState<TlFilter>('todos')

  // Computed values
  const ltv = metricas?.ltv ?? faturas.filter(f => f.status === 'pago').reduce((s, f) => s + f.valor_total, 0)
  const emAberto = faturas
    .filter(f => ['pendente', 'parcial', 'atrasado'].includes(f.status))
    .reduce((s, f) => s + (f.saldo_devedor ?? (f.valor_total - f.valor_pago)), 0)
  const arr = mrr * 12
  const cac = metricas?.cac ?? null
  const tenureMeses = metricas?.tenureMeses ?? 0
  const ltvCac = cac && cac > 0 ? ltv / cac : null
  const payback = cac && mrr > 0 ? Math.ceil(cac / mrr) : null
  const anoAtual = new Date().getFullYear()
  const anoAnterior = anoAtual - 1
  const pagoAtual = faturas.filter(f => f.status === 'pago' && new Date(f.data_vencimento).getFullYear() === anoAtual).reduce((s, f) => s + f.valor_total, 0)
  const pagoAnterior = faturas.filter(f => f.status === 'pago' && new Date(f.data_vencimento).getFullYear() === anoAnterior).reduce((s, f) => s + f.valor_total, 0)
  const ticketMedio = tenureMeses > 0 ? Math.round(ltv / tenureMeses) : mrr
  const crescAnual = pagoAnterior > 0 ? Math.round(((pagoAtual - pagoAnterior) / pagoAnterior) * 100) : null

  // Próxima fatura (pendente/atrasada mais próxima)
  const proximaFatura = faturas
    .filter(f => ['pendente', 'atrasado', 'parcial'].includes(f.status))
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())[0] ?? null

  // Timeline
  const allEvents = buildTimeline(faturas, renovacoes)
  const filteredEvents = allEvents.filter(ev => {
    if (tlFilter === 'cobrancas') return ev.tipo === 'fatura'
    if (tlFilter === 'pagamentos') return ev.tipo === 'pagamento'
    if (tlFilter === 'renovacoes') return ev.tipo === 'renovacao'
    return true
  })
  const grouped = groupByMonth(filteredEvents)

  // Histórico de reajustes
  const reajustes = renovacoes
    .filter(r => r.valor_anterior !== null && r.valor_novo !== null && r.valor_anterior !== r.valor_novo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  function handleGerarFatura(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await gerarFatura(clienteId, formData)
      if (result.error) { setError(result.error) } else { setShowForm(false) }
    })
  }

  const ltvCacColor = ltvCac === null ? 'bg-slate-300' : ltvCac >= 3 ? 'bg-emerald-500' : ltvCac >= 1.5 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="p-6 space-y-5">

      {/* ── KPI Row 1 ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-[14px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">LTV Acumulado</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-slate-900">{fmt(ltv)}</p>
          <p className="text-[11px] text-slate-400">{tenureMeses} meses de relacionamento</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-[14px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-blue-400">ARR do Cliente</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-blue-700">{fmt(arr)}</p>
          <p className="text-[11px] text-blue-400">MRR {fmt(mrr)} × 12</p>
        </div>
        {emAberto > 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-[14px]">
            <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-red-400">Em Aberto</p>
            <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-red-700">{fmt(emAberto)}</p>
            {proximaFatura && (
              <p className="text-[11px] text-red-400">
                {proximaFatura.status === 'atrasado'
                  ? `${Math.abs(diasAte(proximaFatura.data_vencimento))} dias de atraso`
                  : `Fatura ${proximaFatura.competencia}`}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-[14px]">
            <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Em Aberto</p>
            <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-slate-900">{fmt(0)}</p>
            <p className="text-[11px] text-emerald-600">Em dia ✓</p>
          </div>
        )}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-[14px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Margem</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-slate-900">
            {metricas?.margem != null ? `${metricas.margem.toFixed(0)}%` : '—'}
          </p>
          <p className="text-[11px] text-slate-400">Contribuição líquida</p>
        </div>
      </div>

      {/* ── KPI Row 2 ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.4fr] gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-[14px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">CAC</p>
          <p className="mt-[6px] mb-0.5 text-[20px] font-bold leading-tight text-slate-900">{cac != null ? fmt(cac) : '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-[14px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">LTV / CAC</p>
          <div className="mt-[6px] mb-0.5 flex items-center gap-2">
            <p className={`text-[20px] font-bold leading-tight ${ltvCac !== null && ltvCac >= 3 ? 'text-emerald-700' : ltvCac !== null && ltvCac >= 1.5 ? 'text-amber-600' : 'text-slate-900'}`}>
              {ltvCac != null ? `${ltvCac.toFixed(1)}×` : '—'}
            </p>
            {ltvCac !== null && <span className={`h-2.5 w-2.5 rounded-full ${ltvCacColor}`} />}
          </div>
          <p className="text-[11px] text-slate-400">Benchmark: ≥ 3×</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-[14px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Payback</p>
          <p className="mt-[6px] mb-0.5 text-[20px] font-bold leading-tight text-amber-600">
            {payback != null ? `~${payback} ${payback === 1 ? 'mês' : 'meses'}` : '—'}
          </p>
          <p className="text-[11px] text-slate-400">CAC ÷ MRR</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-[14px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Tenure</p>
          <p className="mt-[6px] mb-0.5 text-[20px] font-bold leading-tight text-slate-900">{tenureMeses} meses</p>
          <p className="text-[11px] text-slate-400">
            {metricas?.dataInicioRelac
              ? `Desde ${new Date(metricas.dataInicioRelac).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
              : 'Desde o cadastro'}
          </p>
        </div>
        {/* Notas Financeiras */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-[14px]">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">Notas Financeiras</p>
          <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-3">
            {notaFinanceira || 'Sem notas registradas.'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5">Visível apenas internamente</p>
        </div>
      </div>

      {/* ── Próxima Fatura Banner ─────────────────────────────────────────── */}
      {proximaFatura && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(90deg, #1e40af 0%, #2563eb 100%)' }}>
          <div className="flex items-stretch gap-5 p-5 text-white">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.6px] opacity-70 mb-2">
                {proximaFatura.status === 'atrasado' ? '⚠ Fatura em Atraso' : 'Próxima Fatura'}
              </p>
              <p className="text-3xl font-extrabold mb-3">{fmt(proximaFatura.valor_total)}</p>
              {/* Breakdown dos itens */}
              {(proximaFatura.itens ?? []).length > 0 && (
                <div className="rounded-lg bg-white/10 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[.6px] opacity-60 mb-2">Breakdown</p>
                  {(proximaFatura.itens ?? []).map(item => (
                    <div key={item.id} className="flex justify-between text-xs opacity-90">
                      <span className="opacity-80">↳ {item.descricao}</span>
                      <span className="font-semibold">{fmt(item.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold border-t border-white/20 pt-2 mt-1">
                    <span>Total da Fatura</span>
                    <span>{fmt(proximaFatura.valor_total)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-center gap-3">
              <div className="rounded-xl bg-white/15 px-5 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[.6px] opacity-70">Vencimento</p>
                <p className="text-xl font-extrabold mt-0.5">
                  {new Date(proximaFatura.data_vencimento).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs opacity-70 mt-0.5">
                  {diasAte(proximaFatura.data_vencimento) < 0
                    ? `${Math.abs(diasAte(proximaFatura.data_vencimento))} dias de atraso`
                    : `em ${diasAte(proximaFatura.data_vencimento)} dias`}
                </p>
              </div>
              <button
                onClick={() => setPagandoFatura(proximaFatura.id)}
                className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
              >
                + Registrar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions row ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Histórico Financeiro</h3>
        <div className="flex items-center gap-2">
          <ExportCsvButton clienteId={clienteId} />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" /> Gerar fatura
          </button>
        </div>
      </div>

      {/* Gerar Fatura Form */}
      {showForm && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Nova fatura</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <form action={handleGerarFatura} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Competência (mês) *</label>
                <input name="competencia" type="month" required defaultValue={new Date().toISOString().slice(0, 7)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Vencimento *</label>
                <input name="data_vencimento" type="date" required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
              <select name="tipo" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                <option value="regular">Regular</option>
                <option value="cortesia">Cortesia</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {isPending ? 'Gerando...' : 'Gerar fatura'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Main Grid (timeline + sidebar) ───────────────────────────────── */}
      <div className="grid grid-cols-[1fr_260px] gap-5 items-start">

        {/* Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Header com filter tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 flex-wrap gap-2">
            <p className="text-xs font-semibold text-slate-700">Timeline Financeira</p>
            <div className="flex items-center gap-1">
              {(['todos', 'cobrancas', 'pagamentos', 'renovacoes'] as TlFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setTlFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    tlFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {{ todos: 'Todos', cobrancas: 'Cobranças', pagamentos: 'Pagamentos', renovacoes: 'Renovações' }[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-4">
            {filteredEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Nenhum evento encontrado</p>
            ) : (
              grouped.map(([month, events]) => (
                <div key={month}>
                  <p className="mb-3 border-b border-slate-100 pb-1 text-[10px] font-bold uppercase tracking-[.6px] text-slate-400">
                    {month}
                  </p>
                  {events.map((ev, i) => (
                    <TimelineEvent
                      key={i}
                      ev={ev}
                      onPagar={ev.tipo === 'fatura' ? setPagandoFatura : undefined}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar direita */}
        <div className="space-y-3">

          {/* Pontualidade */}
          {pontualidade && pontualidade.length > 0 && (
            <PontualidadeCard itens={pontualidade} />
          )}

          {/* Resumo Anual */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-700 mb-3">Resumo Anual</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Pago em {anoAtual}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">{fmt(pagoAtual)}</span>
                  {crescAnual !== null && crescAnual !== 0 && (
                    <span className={`text-[10px] font-semibold ${crescAnual > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {crescAnual > 0 ? '↑' : '↓'} {Math.abs(crescAnual)}%
                    </span>
                  )}
                </div>
              </div>
              {pagoAnterior > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Pago em {anoAnterior}</span>
                  <span className="text-slate-400">{fmt(pagoAnterior)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs border-t border-slate-50 pt-2">
                <span className="text-slate-500">LTV Total</span>
                <span className="font-semibold text-slate-800">{fmt(ltv)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ticket médio</span>
                <span className="font-semibold text-slate-800">{fmt(ticketMedio)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Cliente há</span>
                <span className="font-semibold text-slate-800">{tenureMeses} meses</span>
              </div>
            </div>
          </div>

          {/* Histórico de Reajustes */}
          {reajustes.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-700 mb-3">Histórico de Reajustes</p>
              <div className="space-y-2">
                {reajustes.map(r => {
                  const perc = (((r.valor_novo! - r.valor_anterior!) / r.valor_anterior!) * 100).toFixed(1)
                  const mesRef = new Date(r.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                    .replace('.', '').replace(/^\w/, c => c.toUpperCase())
                  return (
                    <div key={r.id} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-semibold text-slate-700">
                          {r.produto_nome ?? 'Produto'} — {mesRef}
                        </p>
                        <span className="text-xs font-bold text-violet-700">+{perc}%</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {fmt(r.valor_anterior!)} → {fmt(r.valor_novo!)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {pagandoFatura && (
        <PagamentoModal
          faturaId={pagandoFatura}
          clienteId={clienteId}
          onClose={() => setPagandoFatura(null)}
        />
      )}
    </div>
  )
}
