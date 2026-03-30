import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Contrato, ProdutoContratadoView } from '@/types/database'

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const statusBadge: Record<string, { label: string; className: string }> = {
  ativo:        { label: 'Ativo',        className: 'bg-emerald-50 text-emerald-700' },
  em_renovacao: { label: 'Em renovação', className: 'bg-blue-50 text-blue-700' },
  pausado:      { label: 'Pausado',      className: 'bg-amber-50 text-amber-700' },
  cancelado:    { label: 'Cancelado',    className: 'bg-red-50 text-red-700' },
  encerrado:    { label: 'Encerrado',    className: 'bg-slate-100 text-slate-500' },
}

export default async function ContratosPage() {
  const supabase = await createClient()

  const hoje = new Date()
  const em30dias = new Date(hoje)
  em30dias.setDate(em30dias.getDate() + 30)

  const [{ data: contratos }, { data: clientes }, { data: itensAVencer }, { data: produtosPorContrato }] = await Promise.all([
    supabase.from('contratos').select('*').order('data_ativacao', { ascending: false }),
    supabase.from('clientes').select('id, razao_social'),
    supabase
      .from('produtos_contratados')
      .select('*')
      .eq('item_status', 'ativo')
      .not('data_fim_item', 'is', null)
      .gte('data_fim_item', hoje.toISOString().split('T')[0])
      .lte('data_fim_item', em30dias.toISOString().split('T')[0])
      .order('data_fim_item'),
    supabase
      .from('produtos_contratados')
      .select('contrato_id, valor_efetivo')
      .eq('item_status', 'ativo'),
  ])

  const clienteMap = Object.fromEntries((clientes ?? []).map((c) => [c.id, c.razao_social]))

  const mrrPorContrato: Record<string, number> = {}
  for (const item of (produtosPorContrato ?? [])) {
    if (item.contrato_id) {
      mrrPorContrato[item.contrato_id] = (mrrPorContrato[item.contrato_id] ?? 0) + (item.valor_efetivo ?? 0)
    }
  }

  const ativos   = (contratos ?? []).filter((c) => c.status === 'ativo').length
  const aVencer  = (contratos ?? []).filter((c) => {
    if (!c.data_fim || c.status !== 'ativo') return false
    const d = daysUntil(c.data_fim)
    return d >= 0 && d <= 30
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-slate-900">Contratos</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">Todos os contratos da operação</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Total</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-slate-900">{(contratos ?? []).length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Ativos</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-emerald-700">{ativos}</p>
        </div>
        <div className={`rounded-xl border px-5 py-[18px] ${aVencer > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">A vencer em 30d</p>
          <p className={`mt-[6px] mb-0.5 text-[26px] font-bold leading-tight ${aVencer > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{aVencer}</p>
        </div>
      </div>

      {(itensAVencer ?? []).length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              {itensAVencer!.length} produto{itensAVencer!.length > 1 ? 's' : ''} vencendo nos próximos 30 dias
            </p>
          </div>
          <div className="space-y-1.5">
            {(itensAVencer as ProdutoContratadoView[]).map((item, i) => {
              const days = daysUntil(item.data_fim_item!)
              const clienteNome = clienteMap[item.cliente_id ?? ''] ?? 'Cliente desconhecido'
              return (
                <div key={item.id ?? i} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <div>
                    <Link
                      href={`/clientes/${item.cliente_id}?tab=produtos`}
                      className="text-sm font-medium text-slate-700 hover:text-blue-600"
                    >
                      {clienteNome}
                    </Link>
                    <p className="text-xs text-slate-500">{item.produto_nome}</p>
                  </div>
                  <span className={`text-xs font-medium ${days <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                    {new Date(item.data_fim_item!).toLocaleDateString('pt-BR')} · {days}d
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white">
        {(contratos ?? []).length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">Nenhum contrato registrado ainda</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Tipo</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Início</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Vencimento</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Valor</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(contratos as Contrato[]).map((c) => {
                const badge = statusBadge[c.status] ?? statusBadge.encerrado
                const days = c.data_fim ? daysUntil(c.data_fim) : null
                const isAlert = c.status === 'ativo' && days !== null && days <= 30 && days >= 0
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <Link href={`/clientes/${c.cliente_id}?tab=contratos`} className="font-medium text-slate-700 hover:text-blue-600">
                        {clienteMap[c.cliente_id] ?? '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.tipo}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(c.data_ativacao).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3">
                      {c.data_fim ? (
                        <span className={isAlert ? 'font-medium text-amber-600' : 'text-slate-500'}>
                          {new Date(c.data_fim).toLocaleDateString('pt-BR')}
                          {isAlert && <span className="ml-1.5 text-xs">({days}d)</span>}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-blue-700">
                      {mrrPorContrato[c.id]
                        ? mrrPorContrato[c.id].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : <span className="text-slate-300 font-normal">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
