import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notificarFaturaVencida } from '@/app/actions/notificacoes'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]

  // 1. Busca faturas pendentes vencidas antes de atualizar (para notificações)
  const { data: faturasVencidas } = await admin
    .from('faturas')
    .select('id, agencia_id, cliente_id, valor_total')
    .eq('status', 'pendente')
    .lt('data_vencimento', hojeStr)

  // 2. Marca como atrasado
  await admin
    .from('faturas')
    .update({ status: 'atrasado' })
    .eq('status', 'pendente')
    .lt('data_vencimento', hojeStr)

  // 3. Envia notificações de fatura vencida
  for (const f of faturasVencidas ?? []) {
    const { data: cliente } = await admin
      .from('clientes')
      .select('razao_social, decisor_email, resp_financeiro_email')
      .eq('id', f.cliente_id)
      .single()
    if (!cliente) continue

    const toEmail = cliente.resp_financeiro_email ?? cliente.decisor_email
    if (!toEmail) continue

    await notificarFaturaVencida({
      agenciaId:   f.agencia_id,
      clienteId:   f.cliente_id,
      faturaId:    f.id,
      toEmail,
      clienteNome: cliente.razao_social,
      valorFatura: f.valor_total,
    })
  }

  // 4. Busca todas as agências para respeitar config por tenant
  const { data: agencias } = await admin.from('agencias').select('id')
  if (!agencias?.length) return NextResponse.json({ success: true, suspensos: 0 })

  let suspensos = 0

  for (const agencia of agencias) {
    // Busca configuração de dias_suspensao_inadimplencia (default 30)
    const { data: config } = await admin
      .from('sistema_config')
      .select('valor')
      .eq('agencia_id', agencia.id)
      .eq('chave', 'dias_suspensao_inadimplencia')
      .single()

    const diasLimite = config ? parseInt(config.valor, 10) : 30

    // Busca clientes ativos com faturas atrasadas além do limite
    const { data: faturas } = await admin
      .from('faturas')
      .select('cliente_id, data_vencimento')
      .eq('agencia_id', agencia.id)
      .eq('status', 'atrasado')

    if (!faturas?.length) continue

    const clienteIds = [...new Set(faturas.map((f) => f.cliente_id))]

    const parasuspender: string[] = []
    for (const clienteId of clienteIds) {
      const faturasDoCliente = faturas.filter((f) => f.cliente_id === clienteId)
      const deveSuspender = faturasDoCliente.some((f) => {
        const diasAtraso = Math.floor(
          (hoje.getTime() - new Date(f.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
        )
        return diasAtraso > diasLimite
      })
      if (deveSuspender) parasuspender.push(clienteId)
    }

    if (parasuspender.length > 0) {
      await admin
        .from('clientes')
        .update({ status: 'suspenso' })
        .in('id', parasuspender)
        .eq('agencia_id', agencia.id)
        .eq('status', 'ativo')

      suspensos += parasuspender.length
    }
  }

  return NextResponse.json({ success: true, suspensos })
}
