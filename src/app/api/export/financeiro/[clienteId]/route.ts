import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvCell(v: any): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function fmtMoney(v: number): string {
  return v.toFixed(2).replace('.', ',')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const de = searchParams.get('de') // YYYY-MM
  const ate = searchParams.get('ate') // YYYY-MM

  let query = supabase
    .from('faturas')
    .select('*, fatura_itens(id, descricao, valor), pagamentos(id, data_pagamento, valor_pago, forma_pagamento)')
    .eq('cliente_id', clienteId)
    .order('competencia', { ascending: true })

  if (de) query = query.gte('competencia', de)
  if (ate) query = query.lte('competencia', ate)

  const { data: faturas, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: cliente } = await supabase
    .from('clientes')
    .select('razao_social')
    .eq('id', clienteId)
    .single()

  const nomeCliente = (cliente?.razao_social ?? 'cliente').replace(/[^a-zA-Z0-9]/g, '-')
  const periodo = de && ate ? `${de}_${ate}` : new Date().toISOString().slice(0, 7)

  const BOM = '\uFEFF'
  const header = ['Competência', 'Nº Fatura', 'Data Emissão', 'Data Vencimento', 'Valor Total', 'Valor Pago', 'Saldo Devedor', 'Status', 'Tipo', 'Pagamento Data', 'Pagamento Valor', 'Pagamento Forma'].join(';')

  const rows: string[] = [header]

  for (const f of faturas ?? []) {
    const saldo = f.saldo_devedor ?? Math.max(0, f.valor_total - f.valor_pago)
    const pagamentos = (f.pagamentos as any[]) ?? []

    if (pagamentos.length === 0) {
      rows.push([
        f.competencia,
        f.numero_fatura,
        new Date(f.created_at).toLocaleDateString('pt-BR'),
        new Date(f.data_vencimento).toLocaleDateString('pt-BR'),
        fmtMoney(f.valor_total),
        fmtMoney(f.valor_pago),
        fmtMoney(saldo),
        f.status,
        f.tipo,
        '', '', '',
      ].map(csvCell).join(';'))
    } else {
      for (const p of pagamentos) {
        rows.push([
          f.competencia,
          f.numero_fatura,
          new Date(f.created_at).toLocaleDateString('pt-BR'),
          new Date(f.data_vencimento).toLocaleDateString('pt-BR'),
          fmtMoney(f.valor_total),
          fmtMoney(f.valor_pago),
          fmtMoney(saldo),
          f.status,
          f.tipo,
          new Date(p.data_pagamento).toLocaleDateString('pt-BR'),
          fmtMoney(p.valor_pago),
          p.forma_pagamento ?? '',
        ].map(csvCell).join(';'))
      }
    }
  }

  const csv = BOM + rows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="extrato-${nomeCliente}-${periodo}.csv"`,
    },
  })
}
