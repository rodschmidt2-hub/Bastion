import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await createAdminClient()
  const hoje = new Date()
  const competencia = hoje.toISOString().slice(0, 7) // "2026-03"

  // Para cada agência, busca o prazo de geração configurado (padrão: 7 dias antes)
  const { data: agencias } = await admin.from('agencias').select('id')
  if (!agencias?.length) return NextResponse.json({ success: true, geradas: 0 })

  let geradas = 0
  let erros = 0

  for (const agencia of agencias) {
    // Busca configuração de dias_geracao_fatura (default 7)
    const { data: config } = await admin
      .from('sistema_config')
      .select('valor')
      .eq('agencia_id', agencia.id)
      .eq('chave', 'dias_geracao_fatura')
      .single()

    const diasGeracao = config ? parseInt(config.valor, 10) : 7

    // Calcula a competência alvo (gera fatura X dias antes do vencimento)
    const dataAlvo = new Date(hoje)
    dataAlvo.setDate(dataAlvo.getDate() + diasGeracao)
    const competenciaAlvo = dataAlvo.toISOString().slice(0, 7)

    // Busca clientes ativos com contratos na agência
    const { data: clientes } = await admin
      .from('clientes')
      .select('id, dia_vencimento')
      .eq('agencia_id', agencia.id)
      .eq('status', 'ativo')

    if (!clientes?.length) continue

    for (const cliente of clientes) {
      // Verifica se já existe fatura para esta competência
      const { data: faturaExistente } = await admin
        .from('faturas')
        .select('id')
        .eq('agencia_id', agencia.id)
        .eq('cliente_id', cliente.id)
        .eq('competencia', competenciaAlvo)
        .eq('tipo', 'regular')
        .single()

      if (faturaExistente) continue

      // Busca itens ativos do cliente (apenas recorrentes e híbridos)
      const { data: itens } = await admin
        .from('produtos_contratados')
        .select('id, produto_nome, valor_efetivo, produto_tipo')
        .eq('agencia_id', agencia.id)
        .eq('cliente_id', cliente.id)
        .eq('item_status', 'ativo')
        .neq('produto_tipo', 'pontual')

      if (!itens?.length) continue

      const valorTotal = itens.reduce((s, i) => s + (i.valor_efetivo ?? 0), 0)
      if (valorTotal <= 0) continue

      // Calcula data de vencimento (usa dia_vencimento do cliente)
      const diaVenc = cliente.dia_vencimento ?? 10
      const [anoAlvo, mesAlvo] = competenciaAlvo.split('-').map(Number)
      const dataVencimento = new Date(anoAlvo, mesAlvo - 1, diaVenc)
        .toISOString().split('T')[0]

      const numero_fatura = `FAT-${agencia.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

      const { data: fatura, error: fatErr } = await admin
        .from('faturas')
        .insert({
          agencia_id:      agencia.id,
          cliente_id:      cliente.id,
          numero_fatura,
          competencia:     competenciaAlvo,
          tipo:            'regular',
          data_vencimento: dataVencimento,
          valor_total:     valorTotal,
          status:          'pendente',
        })
        .select('id')
        .single()

      if (fatErr || !fatura) { erros++; continue }

      // Cria fatura_itens
      await admin.from('fatura_itens').insert(
        itens.map((i) => ({
          agencia_id:       agencia.id,
          fatura_id:        fatura.id,
          contrato_item_id: i.id,
          descricao:        i.produto_nome ?? 'Produto',
          valor:            i.valor_efetivo ?? 0,
        }))
      )

      geradas++
    }
  }

  return NextResponse.json({ success: true, geradas, erros, competencia })
}
