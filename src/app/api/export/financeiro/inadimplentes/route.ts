import { NextResponse } from 'next/server'
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

export async function GET() {
  const supabase = await createClient()

  const { data: faturas } = await supabase
    .from('faturas')
    .select('*, cliente:clientes(id, razao_social, status)')
    .in('status', ['pendente', 'parcial', 'atrasado'])
    .order('data_vencimento', { ascending: true })

  const BOM = '\uFEFF'
  const header = ['Cliente', 'Status Cliente', 'Nº Fatura', 'Competência', 'Vencimento', 'Total', 'Pago', 'Saldo', 'Status Fatura'].join(';')

  const rows: string[] = [header]

  for (const f of faturas ?? []) {
    const cliente = f.cliente as any
    const saldo = f.saldo_devedor ?? Math.max(0, f.valor_total - f.valor_pago)
    rows.push([
      cliente?.razao_social ?? '—',
      cliente?.status ?? '—',
      f.numero_fatura,
      f.competencia,
      new Date(f.data_vencimento).toLocaleDateString('pt-BR'),
      fmtMoney(f.valor_total),
      fmtMoney(f.valor_pago),
      fmtMoney(saldo),
      f.status,
    ].map(csvCell).join(';'))
  }

  const csv = BOM + rows.join('\n')
  const hoje = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inadimplentes-${hoje}.csv"`,
    },
  })
}
