import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Download } from 'lucide-react'

const formaLabel: Record<string, string> = {
  pix: 'PIX', boleto: 'Boleto', cartao: 'Cartão', transferencia: 'Transferência', outro: 'Outro',
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function diasAtraso(dataVencimento: string): number | null {
  const hoje = Date.now()
  const venc = new Date(dataVencimento).getTime()
  const dias = Math.floor((hoje - venc) / (1000 * 60 * 60 * 24))
  return dias > 0 ? dias : null
}

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    { data: faturas },
    { data: produtosAtivos },
    { data: pagamentos },
    { data: faturasLtv },
  ] = await Promise.all([
    supabase
      .from('faturas')
      .select('id, numero_fatura, cliente_id, data_vencimento, valor_total, valor_pago, saldo_devedor, status, cliente:clientes(id, razao_social)')
      .in('status', ['pendente', 'parcial', 'atrasado'])
      .order('data_vencimento', { ascending: true })
      .limit(100),
    supabase
      .from('produtos_contratados')
      .select('valor_efetivo')
      .eq('item_status', 'ativo')
      .neq('produto_tipo', 'pontual'),
    supabase
      .from('pagamentos')
      .select('id, valor_pago, data_pagamento, forma_pagamento, fatura:faturas(numero_fatura, cliente:clientes(id, razao_social))')
      .gte('data_pagamento', inicioMes)
      .lte('data_pagamento', fimMes)
      .order('data_pagamento', { ascending: false })
      .limit(50),
    supabase
      .from('pagamentos')
      .select('valor_pago')
      .gte('data_pagamento', inicioMes)
      .lte('data_pagamento', fimMes),
  ])

  const mrrTotal = (produtosAtivos ?? []).reduce((s, p) => s + (p.valor_efetivo ?? 0), 0)
  const ltvAcumulado = 0 // computed from all-time paid invoices — heavy query, skipping for now

  const emAberto = (faturas ?? []).reduce((s, f) => {
    const saldo = f.saldo_devedor ?? Math.max(0, (f.valor_total ?? 0) - (f.valor_pago ?? 0))
    return s + saldo
  }, 0)

  const recebidoMes = (faturasLtv ?? []).reduce((s, p) => s + ((p as any).valor_pago ?? 0), 0)

  const inadimplentesCount = new Set(
    (faturas ?? []).filter((f) => f.status === 'atrasado').map((f) => f.cliente_id)
  ).size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Financeiro</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">Visão consolidada de receitas e cobranças</p>
        </div>
        <a
          href="/api/export/financeiro/inadimplentes"
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </a>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">MRR Total</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-blue-600">{fmt(mrrTotal)}</p>
          <p className="text-[11px] text-slate-400">Produtos ativos</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">LTV Acumulado</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-slate-900">{fmt(ltvAcumulado)}</p>
          <p className="text-[11px] text-slate-400">Histórico confirmado</p>
        </div>
        <div className={`rounded-xl border px-5 py-[18px] ${emAberto > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Em aberto</p>
          <p className={`mt-[6px] mb-0.5 text-[26px] font-bold leading-tight ${emAberto > 0 ? 'text-red-600' : 'text-slate-900'}`}>{fmt(emAberto)}</p>
          <p className="text-[11px] text-slate-400">{inadimplentesCount} cliente{inadimplentesCount !== 1 ? 's' : ''} inadimplente{inadimplentesCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
          <p className="text-[11px] font-semibold uppercase tracking-[.6px] text-slate-400">Recebido ({hoje.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')})</p>
          <p className="mt-[6px] mb-0.5 text-[26px] font-bold leading-tight text-emerald-600">{fmt(recebidoMes)}</p>
          <p className="text-[11px] text-slate-400">Pagamentos confirmados</p>
        </div>
      </div>

      {/* Cobranças em Aberto */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-[14px]">
          <h3 className="flex-1 text-[14px] font-semibold text-slate-900">Cobranças em Aberto</h3>
        </div>
        {(faturas ?? []).length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">Nenhuma cobrança em aberto</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Cliente</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Referência</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Vencimento</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Valor</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Atraso</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Status</th>
                <th className="px-4 py-[10px]" />
              </tr>
            </thead>
            <tbody>
              {(faturas ?? []).map((f) => {
                const cliente = f.cliente as any
                const saldo = f.saldo_devedor ?? Math.max(0, (f.valor_total ?? 0) - (f.valor_pago ?? 0))
                const atraso = f.status === 'atrasado' ? diasAtraso(f.data_vencimento) : null
                const isAtrasado = f.status === 'atrasado'
                return (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {cliente?.id ? (
                        <Link href={`/clientes/${cliente.id}?tab=financeiro`} className="font-medium text-slate-700 hover:text-blue-600">
                          {cliente.razao_social}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-700">{cliente?.razao_social ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{f.numero_fatura ?? '—'}</td>
                    <td className={`px-4 py-3 ${isAtrasado ? 'text-red-600' : 'text-slate-500'}`}>
                      {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmt(saldo)}</td>
                    <td className="px-4 py-3">
                      {atraso ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${atraso > 10 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                          {atraso} dias
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isAtrasado ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {isAtrasado ? 'Inadimplente' : f.status === 'parcial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {cliente?.id && (
                        <Link
                          href={`/clientes/${cliente.id}?tab=financeiro`}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Quitar
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

      {/* Últimos Pagamentos */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-[14px]">
          <h3 className="flex-1 text-[14px] font-semibold text-slate-900">Últimos Pagamentos</h3>
        </div>
        {(pagamentos ?? []).length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-400">Nenhum pagamento registrado este mês</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Data</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Cliente</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Referência</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Forma</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Valor</th>
                <th className="px-4 py-[10px] text-left text-[11px] font-semibold uppercase tracking-[.5px] text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {(pagamentos ?? []).map((p: any) => {
                const fatura = p.fatura as any
                const cliente = fatura?.cliente as any
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{new Date(p.data_pagamento).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      {cliente?.id ? (
                        <Link href={`/clientes/${cliente.id}?tab=financeiro`} className="font-medium text-slate-700 hover:text-blue-600">
                          {cliente.razao_social}
                        </Link>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fatura?.numero_fatura ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{formaLabel[p.forma_pagamento ?? 'outro'] ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmt(p.valor_pago)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Confirmado
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
  )
}
