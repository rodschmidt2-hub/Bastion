import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notificarRenovacaoProxima } from '@/app/actions/notificacoes'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const hoje = new Date()

  const { data: agencias } = await admin.from('agencias').select('id')
  if (!agencias?.length) return NextResponse.json({ success: true, alertas: 0 })

  let alertas = 0

  for (const agencia of agencias) {
    // Busca configuração de alertas (default: [30, 10] dias antes do vencimento)
    const { data: config } = await admin
      .from('sistema_config')
      .select('valor')
      .eq('agencia_id', agencia.id)
      .eq('chave', 'alerta_renovacao_dias')
      .single()

    const diasAlerta: number[] = config ? JSON.parse(config.valor) : [30, 10]

    // Busca itens com data_fim_item definida (contratos com prazo)
    const { data: itens } = await admin
      .from('contrato_itens')
      .select('id, contrato_id, data_fim_item, produto_id, agencia_id')
      .eq('agencia_id', agencia.id)
      .eq('status', 'ativo')
      .not('data_fim_item', 'is', null)

    if (!itens?.length) continue

    for (const item of itens) {
      const dataFim = new Date(item.data_fim_item!)
      const diasRestantes = Math.ceil(
        (dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (!diasAlerta.includes(diasRestantes)) continue

      // Verifica se já existe evento de alerta para este item neste dia
      const { data: eventoExistente } = await admin
        .from('eventos_cliente')
        .select('id')
        .eq('agencia_id', agencia.id)
        .contains('metadata', { contrato_item_id: item.id, tipo_alerta: 'renovacao', dias: diasRestantes })
        .gte('created_at', hoje.toISOString().split('T')[0])
        .single()

      if (eventoExistente) continue

      // Busca cliente via contrato
      const { data: contrato } = await admin
        .from('contratos')
        .select('cliente_id')
        .eq('id', item.contrato_id)
        .single()

      if (!contrato) continue

      // Cria evento na timeline do cliente
      await admin.from('eventos_cliente').insert({
        agencia_id: agencia.id,
        cliente_id: contrato.cliente_id,
        tipo:       'alerta_renovacao',
        descricao:  `Contrato vence em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`,
        metadata:   { contrato_item_id: item.id, dias: diasRestantes, tipo_alerta: 'renovacao' },
        criado_por: null,
      })

      // Envia notificação por e-mail
      const { data: cliente } = await admin
        .from('clientes')
        .select('razao_social, decisor_email, resp_financeiro_email')
        .eq('id', contrato.cliente_id)
        .single()

      if (cliente) {
        const toEmail = cliente.resp_financeiro_email ?? cliente.decisor_email
        if (toEmail) {
          const { data: produto } = await admin
            .from('produtos_agencia')
            .select('nome')
            .eq('id', item.produto_id)
            .maybeSingle()

          await notificarRenovacaoProxima({
            agenciaId:     agencia.id,
            clienteId:     contrato.cliente_id,
            toEmail,
            clienteNome:   cliente.razao_social,
            produtoNome:   produto?.nome ?? 'produto',
            dataRenovacao: item.data_fim_item!,
            diasRestantes,
          })
        }
      }

      alertas++
    }
  }

  return NextResponse.json({ success: true, alertas })
}
