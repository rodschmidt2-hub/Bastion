'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function gerarFatura(clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const competencia = formData.get('competencia') as string
  if (!competencia) return { error: 'Competência é obrigatória' }

  const dataVencimento = formData.get('data_vencimento') as string
  if (!dataVencimento) return { error: 'Data de vencimento é obrigatória' }

  const tipo = (formData.get('tipo') as string) || 'regular'

  // Busca todos os itens ativos do cliente via view
  const { data: itens } = await supabase
    .from('produtos_contratados')
    .select('id, produto_nome, valor_efetivo, produto_tipo')
    .eq('cliente_id', clienteId)
    .eq('item_status', 'ativo')
    .neq('produto_tipo', 'pontual')

  const valorTotal = (itens ?? []).reduce((s, i) => s + (i.valor_efetivo ?? 0), 0)

  const numero_fatura = `FAT-${Date.now().toString(36).toUpperCase()}`

  const { data: fatura, error: fatErr } = await supabase
    .from('faturas')
    .insert({
      agencia_id:      profile.agencia_id,
      cliente_id:      clienteId,
      numero_fatura,
      competencia,
      tipo,
      data_vencimento: dataVencimento,
      valor_total:     valorTotal,
      status:          'pendente',
    })
    .select('id')
    .single()

  if (fatErr) return { error: fatErr.message }

  // Cria fatura_itens para cada produto ativo
  if (itens && itens.length > 0) {
    const faturaItens = itens.map((i) => ({
      agencia_id:       profile.agencia_id,
      fatura_id:        fatura.id,
      contrato_item_id: i.id,
      descricao:        i.produto_nome ?? 'Produto',
      valor:            i.valor_efetivo ?? 0,
    }))
    await supabase.from('fatura_itens').insert(faturaItens)
  }

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/financeiro')
  return { success: true }
}

export async function registrarPagamento(faturaId: string, clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const valorStr = formData.get('valor') as string
  if (!valorStr) return { error: 'Valor é obrigatório' }
  const valor = parseFloat(valorStr)

  const dataStr = formData.get('data_pagamento') as string
  if (!dataStr) return { error: 'Data é obrigatória' }

  // Cria o pagamento
  const { error: pagErr } = await supabase.from('pagamentos').insert({
    agencia_id:      profile.agencia_id,
    fatura_id:       faturaId,
    data_pagamento:  dataStr,
    valor_pago:      valor,
    forma_pagamento: (formData.get('forma_pagamento') as any) || 'pix',
    comprovante_url: (formData.get('comprovante_url') as string) || null,
    registrado_por:  profile.id,
    status:          'confirmado',
  })

  if (pagErr) return { error: pagErr.message }

  // Atualiza valor_pago da fatura
  const { data: fatura } = await supabase
    .from('faturas')
    .select('valor_total, valor_pago')
    .eq('id', faturaId)
    .single()

  if (fatura) {
    const novoValorPago = (fatura.valor_pago ?? 0) + valor
    const saldo = (fatura.valor_total ?? 0) - novoValorPago
    const novoStatus = saldo <= 0 ? 'pago' : novoValorPago > 0 ? 'parcial' : 'pendente'

    await supabase
      .from('faturas')
      .update({ valor_pago: novoValorPago, status: novoStatus })
      .eq('id', faturaId)
  }

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/financeiro')
  return { success: true }
}

export async function marcarFaturasAtrasadas() {
  const supabase = await createClient()
  const hoje = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('faturas')
    .update({ status: 'atrasado' })
    .eq('status', 'pendente')
    .lt('data_vencimento', hoje)

  if (error) return { error: error.message }
  return { success: true }
}

export async function verificarSuspensao() {
  const supabase = await createClient()
  const hoje = new Date()

  // Busca faturas atrasadas com vencimento há mais de dias_ate_suspensao
  const { data: faturas } = await supabase
    .from('faturas')
    .select('cliente_id, data_vencimento')
    .eq('status', 'atrasado')

  if (!faturas) return { success: true }

  // Busca clientes com limite de suspensão
  const clienteIds = [...new Set(faturas.map((f) => f.cliente_id))]
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, dias_ate_suspensao')
    .in('id', clienteIds)
    .eq('status', 'ativo')

  if (!clientes) return { success: true }

  const parasuspender: string[] = []

  for (const cliente of clientes) {
    const faturasDoCliente = faturas.filter((f) => f.cliente_id === cliente.id)
    const diasLimite = cliente.dias_ate_suspensao ?? 30

    const deveSuspender = faturasDoCliente.some((f) => {
      const venc = new Date(f.data_vencimento)
      const diasAtraso = Math.floor((hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24))
      return diasAtraso > diasLimite
    })

    if (deveSuspender) parasuspender.push(cliente.id)
  }

  if (parasuspender.length > 0) {
    await supabase
      .from('clientes')
      .update({ status: 'suspenso' as any })
      .in('id', parasuspender)
  }

  return { success: true, suspensos: parasuspender.length }
}
