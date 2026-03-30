import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // Vercel cron authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client to bypass RLS and access all agencies
  const admin = await createAdminClient()
  const competencia = new Date().toISOString().slice(0, 7)

  const { data: agencias } = await admin.from('agencias').select('id')
  if (!agencias?.length) return NextResponse.json({ success: true, snapshotted: 0 })

  let count = 0
  for (const agencia of agencias) {
    // Use produtos_contratados VIEW (has produto_tipo and valor_efetivo)
    const { data: itens } = await admin
      .from('produtos_contratados')
      .select('valor_efetivo, cliente_id')
      .eq('item_status', 'ativo')
      .neq('produto_tipo', 'pontual')

    const mrr = (itens ?? []).reduce((s, i) => s + (i.valor_efetivo ?? 0), 0)
    const arr = mrr * 12
    const clientesAtivos = new Set((itens ?? []).map((i) => i.cliente_id).filter(Boolean)).size

    await admin.from('mrr_historico').upsert(
      { agencia_id: agencia.id, competencia, mrr, arr, clientes_ativos: clientesAtivos },
      { onConflict: 'agencia_id,competencia' }
    )
    count++
  }

  return NextResponse.json({ success: true, snapshotted: count, competencia })
}
