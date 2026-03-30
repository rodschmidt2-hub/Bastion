import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Download } from 'lucide-react'
import { MrrHistoricoChart } from '@/components/financeiro/mrr-historico-chart'

const formaLabel: Record<string, string> = {
  pix: 'PIX', boleto: 'Boleto', cartao: 'Cartão', transferencia: 'Transferência', outro: 'Outro',
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  pendente:  { label: 'Pendente',  cls: 'bg-amber-50 text-amber-700' },
  parcial:   { label: 'Parcial',   cls: 'bg-blue-50 text-blue-700' },
  pago:      { label: 'Pago',      cls: 'bg-emerald-50 text-emerald-700' },
  atrasado:  { label: 'Atrasado',  cls: 'bg-red-50 text-red-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500' },
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const [{ data: faturas }, { data: clientes }, { data: produtosAtivos }, { data: mrrHistorico }] = await Promise.all([
    supabase
      .from('faturas')
      .select('*, cliente:clientes(id, razao_social), pagamentos(id, valor_pago, data_pagamento, forma_pagamento)')
      .order('data_vencimento', { ascending: false })
      .limit(100),
    supabase.from('clientes').select('id, razao_social, status'),
    supabase
      .from('produtos_contratados')
      .select('valor_efetivo')
      .eq('item_status', 'ativo')
      .neq('produto_tipo', 'pontual'),
    supabase
      .from('mrr_historico')
      .select('competencia, mrr, clientes_ativos')
      .order('competencia', { ascending: true })
      .limit(12),
  ])

  const mrrTotal = (produtosAtivos ?? []).reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)

  const emAberto = (faturas ?? [])
    .filter((f) => ['pendente', 'parcial', 'atrasado'].includes(f.status))
    .reduce((s, f) => s + (f.saldo_devedor ?? Math.max(0, f.valor_total - f.valor_pago)), 0)

  const atrasadas = (faturas ?? []).filter((f) => f.status === 'atrasado').length

  const faturasEmAberto = (faturas ?? []).filter((f) =>
    ['pendente', 'parcial', 'atrasado'].includes(f.status)
  )

  const ultimosPagamentos = (faturas ?? [])
    .flatMap((f) =>
      ((f.pagamentos as any[]) ?? []).map((p: any) => ({
        ...p,
        cliente: (f.cliente as any)?.razao_social ?? '—',
        clienteId: (f.cliente as any)?.id,
        numero_fatura: f.numero_fatura,
      }))
    )
    .sort((a, b) => new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime())
    .slice(0, 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Financeiro</h1>
          <p className="mt-0.5 text-sm text-slate-500">Visão consolidada de receitas e faturas</p>
        </div>
        <a
          href="/api/export/financeiro/inadimplentes"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Exportar inadimplentes
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">MRR Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{fmt(mrrTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">soma de produtos ativos</p>
        </div>
        <div className={`rounded-xl border p-5 shadow-sm ${emAberto > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Em Aberto</p>
          <p className={`mt-2 text-2xl font-semibold ${emAberto > 0 ? 'text-red-700' : 'text-slate-900'}`}>{fmt(emAberto)}</p>
          <p className="mt-1 text-xs text-slate-400">{faturasEmAberto.length} fatura{faturasEmAberto.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`rounded-xl border p-5 shadow-sm ${atrasadas > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Atrasadas</p>
          <p className={`mt-2 text-2xl font-semibold ${atrasadas > 0 ? 'text-red-700' : 'text-slate-900'}`}>{atrasadas}</p>
          <p className="mt-1 text-xs text-slate-400">{atrasadas > 0 ? 'vencidas sem pagamento' : 'tudo em dia'}</p>
        </div>
      </div>

      {/* MRR Chart */}
      {(mrrHistorico ?? []).length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">MRR Histórico</h2>
          </div>
          <div className="p-5">
            <MrrHistoricoChart dados={mrrHistorico ?? []} />
          </div>
        </div>
      )}

      {/* Faturas em aberto */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Faturas em aberto</h2>
        </div>

        {faturasEmAberto.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-400">Nenhuma fatura em aberto</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Nº Fatura</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Vencimento</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Total</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Saldo</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {faturasEmAberto.map((f) => {
                const badge = statusBadge[f.status] ?? statusBadge.pendente
                const saldo = f.saldo_devedor ?? Math.max(0, f.valor_total - f.valor_pago)
                const cliente = f.cliente as any
                return (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800">{cliente?.razao_social ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{f.numero_fatura}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(f.data_vencimento).toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{fmt(f.valor_total)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${saldo > 0 ? 'text-red-600' : 'text-slate-400'}`}>{fmt(saldo)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {cliente?.id && (
                        <Link
                          href={`/clientes/${cliente.id}?tab=financeiro`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          Ver <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Últimos pagamentos */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Últimos pagamentos</h2>
        </div>

        {ultimosPagamentos.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-400">Nenhum pagamento registrado ainda</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Data</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Referência</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Forma</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ultimosPagamentos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-500">{new Date(p.data_pagamento).toLocaleDateString('pt-BR')}</td>
                  <td className="px-5 py-3">
                    {p.clienteId ? (
                      <Link href={`/clientes/${p.clienteId}?tab=financeiro`} className="font-medium text-slate-700 hover:text-blue-600">
                        {p.cliente}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-700">{p.cliente}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{p.numero_fatura}</td>
                  <td className="px-5 py-3 text-slate-500">{formaLabel[p.forma_pagamento ?? 'outro'] ?? '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-700">{fmt(p.valor_pago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
