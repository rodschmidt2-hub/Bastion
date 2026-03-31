import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]
  const mesAtual = hojeStr.slice(0, 7) // "2026-03"

  // Busca itens ativos que têm oferta com reajuste configurado
  const { data: itens } = await admin
    .from('contrato_itens')
    .select(`
      id,
      agencia_id,
      contrato_id,
      valor_negociado,
      data_inicio_item,
      produto_id,
      oferta_id,
      produto_ofertas (
        indice_reajuste,
        perc_reajuste_fixo,
        renovacao_automatica
      )
    `)
    .eq('status', 'ativo')
    .not('oferta_id', 'is', null)

  if (!itens?.length) return NextResponse.json({ success: true, reajustados: 0 })

  let reajustados = 0

  for (const item of itens) {
    const oferta = item.produto_ofertas as any
    if (!oferta) continue

    // Apenas itens com reajuste configurado
    if (!oferta.indice_reajuste || oferta.indice_reajuste === 'nenhum') continue

    const dataInicio = new Date(item.data_inicio_item)

    // Verifica se hoje é o aniversário anual do contrato
    const mesAniversario = dataInicio.getMonth()
    const diaAniversario = dataInicio.getDate()
    const ehAniversario =
      hoje.getMonth() === mesAniversario &&
      hoje.getDate() === diaAniversario &&
      hoje.getFullYear() > dataInicio.getFullYear()

    if (!ehAniversario) continue

    // Verifica se já foi reajustado este mês
    const { data: reajusteExistente } = await admin
      .from('renovacoes')
      .select('id')
      .eq('contrato_item_id', item.id)
      .gte('created_at', `${mesAtual}-01`)
      .single()

    if (reajusteExistente) continue

    // Calcula novo valor
    let percReajuste = 0

    if (oferta.indice_reajuste === 'fixo') {
      percReajuste = oferta.perc_reajuste_fixo ?? 0
    } else {
      // Para índices externos (IGPM, IPCA, INPC): usa 5% como fallback
      // Em produção, integrar com API do IBGE/FGV
      percReajuste = 5.0
    }

    if (percReajuste <= 0) continue

    const valorAnterior = item.valor_negociado
    const valorNovo = parseFloat((valorAnterior * (1 + percReajuste / 100)).toFixed(2))

    // Atualiza valor do item
    const { error: updateErr } = await admin
      .from('contrato_itens')
      .update({ valor_negociado: valorNovo })
      .eq('id', item.id)

    if (updateErr) continue

    // Busca cliente via contrato para evento
    const { data: contrato } = await admin
      .from('contratos')
      .select('cliente_id')
      .eq('id', item.contrato_id)
      .single()

    if (contrato) {
      await admin.from('eventos_cliente').insert({
        agencia_id: item.agencia_id,
        cliente_id: contrato.cliente_id,
        tipo:       'reajuste',
        descricao:  `Reajuste aplicado: ${percReajuste}% (${oferta.indice_reajuste.toUpperCase()}) — de R$ ${valorAnterior.toFixed(2)} para R$ ${valorNovo.toFixed(2)}`,
        metadata:   {
          contrato_item_id: item.id,
          indice:           oferta.indice_reajuste,
          perc:             percReajuste,
          valor_anterior:   valorAnterior,
          valor_novo:       valorNovo,
        },
        criado_por: null,
      })
    }

    reajustados++
  }

  return NextResponse.json({ success: true, reajustados, data: hojeStr })
}
