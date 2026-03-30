'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import type { ContratoStatus, ProdutoStatus } from '@/types/database'

export async function createContrato(clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const dataInicio = formData.get('data_inicio') as string
  if (!dataInicio) return { error: 'Data de início é obrigatória' }

  const numero_contrato = `CONT-${Date.now().toString(36).toUpperCase()}`

  const { error } = await supabase.from('contratos').insert({
    agencia_id:      profile.agencia_id,
    cliente_id:      clienteId,
    numero_contrato,
    tipo:            (formData.get('tipo') as string) || 'servico',
    data_assinatura: dataInicio,
    data_ativacao:   dataInicio,
    data_fim:        (formData.get('data_fim') as string) || null,
    forma_pagamento: (formData.get('forma_pagamento') as string) || 'pix',
    status:          'ativo',
    documento_url:   (formData.get('documento_url') as string) || null,
    observacao:      (formData.get('observacoes') as string) || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}

export async function updateContratoStatus(clienteId: string, contratoId: string, status: ContratoStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contratos')
    .update({ status })
    .eq('id', contratoId)
  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}

export async function adicionarProdutoCliente(
  contratoId: string | null,
  clienteId: string,
  formData: FormData,
) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const produtoId = formData.get('produto_agencia_id') as string
  if (!produtoId) return { error: 'Produto é obrigatório' }

  const valorStr = formData.get('valor_negociado') as string
  if (!valorStr) return { error: 'Valor é obrigatório' }

  const ofertaId = (formData.get('oferta_id') as string) || null
  const dataInicio = formData.get('data_inicio') as string
  if (!dataInicio) return { error: 'Data de início é obrigatória' }

  // Auto-cria contrato padrão se o cliente não tiver um ativo
  let resolvedContratoId = contratoId
  if (!resolvedContratoId) {
    const numero_contrato = `CONT-${Date.now().toString(36).toUpperCase()}`
    const { data: novoContrato, error: errContrato } = await supabase
      .from('contratos')
      .insert({
        agencia_id:      profile.agencia_id,
        cliente_id:      clienteId,
        numero_contrato,
        tipo:            'servico',
        data_assinatura: dataInicio,
        data_ativacao:   dataInicio,
        forma_pagamento: 'pix',
        status:          'ativo',
      })
      .select('id')
      .single()
    if (errContrato || !novoContrato) return { error: errContrato?.message ?? 'Erro ao criar contrato' }
    resolvedContratoId = novoContrato.id
  }

  const { error } = await supabase.from('contrato_itens').insert({
    agencia_id:       profile.agencia_id,
    contrato_id:      resolvedContratoId,
    produto_id:       produtoId,
    oferta_id:        ofertaId,
    valor_negociado:  parseFloat(valorStr),
    data_inicio_item: dataInicio,
    status:           'ativo' as ProdutoStatus,
  })

  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/contratos')
  return { success: true }
}

export async function removerProdutoCliente(itemId: string, clienteId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contrato_itens').delete().eq('id', itemId)
  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/contratos')
  return { success: true }
}

export async function renovarContratoItem(
  itemId: string,
  clienteId: string,
  formData: FormData,
) {
  const supabase = await createClient()

  const novaDataFim = formData.get('data_fim_item') as string
  if (!novaDataFim) return { error: 'Nova data de vencimento é obrigatória' }

  // Busca estado atual para registrar no histórico
  const { data: item } = await supabase
    .from('contrato_itens')
    .select('data_fim_item, valor_negociado, agencia_id')
    .eq('id', itemId)
    .single()

  const { error } = await supabase
    .from('contrato_itens')
    .update({ data_fim_item: novaDataFim })
    .eq('id', itemId)

  if (error) return { error: error.message }

  // Registra no histórico de renovações
  if (item) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('renovacoes').insert({
        contrato_item_id: itemId,
        agencia_id:       item.agencia_id,
        data_anterior:    item.data_fim_item ?? novaDataFim,
        data_nova:        novaDataFim,
        valor_anterior:   item.valor_negociado,
        valor_novo:       item.valor_negociado,
        observacoes:      (formData.get('observacoes') as string) || null,
        renovado_por:     user.id,
      })
    }
  }

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/contratos')
  return { success: true }
}

export async function assinarContrato(clienteId: string, contratoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('contratos')
    .update({
      is_assinado: true,
      assinado_em: new Date().toISOString(),
      assinado_por: user?.id ?? null,
    } as any)
    .eq('id', contratoId)

  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}

export async function atualizarStatusContratoItem(
  itemId: string,
  clienteId: string,
  status: ProdutoStatus | 'em_cancelamento',
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contrato_itens')
    .update({ status: status as ProdutoStatus })
    .eq('id', itemId)
  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}
