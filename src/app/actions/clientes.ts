'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ClienteStatus, ClienteSegmento, ClientePorte } from '@/types/database'

export async function createCliente(formData: FormData) {
  const supabase = await createClient()

  const data = {
    nome: formData.get('nome') as string,
    cnpj: (formData.get('cnpj') as string) || null,
    segmento: (formData.get('segmento') as ClienteSegmento) || null,
    porte: (formData.get('porte') as ClientePorte) || null,
    endereco_logradouro: (formData.get('endereco_logradouro') as string) || null,
    endereco_cidade: (formData.get('endereco_cidade') as string) || null,
    endereco_estado: (formData.get('endereco_estado') as string) || null,
    endereco_cep: (formData.get('endereco_cep') as string) || null,
    resp_financeiro_nome: (formData.get('resp_financeiro_nome') as string) || null,
    resp_financeiro_email: (formData.get('resp_financeiro_email') as string) || null,
    resp_financeiro_telefone: (formData.get('resp_financeiro_telefone') as string) || null,
    decisor_nome: (formData.get('decisor_nome') as string) || null,
    decisor_email: (formData.get('decisor_email') as string) || null,
    decisor_telefone: (formData.get('decisor_telefone') as string) || null,
    responsavel_interno_id: (formData.get('responsavel_interno_id') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
  }

  if (!data.nome) return { error: 'Nome da clínica é obrigatório' }

  const { error } = await supabase.from('clientes').insert(data)
  if (error) return { error: error.message }

  revalidatePath('/clientes')
  return { success: true }
}

export async function updateCliente(id: string, formData: FormData) {
  const supabase = await createClient()

  // Capturar responsável atual para detectar mudança e registrar histórico
  const { data: clienteAntes } = await supabase
    .from('clientes')
    .select('responsavel_interno_id, agencia_id')
    .eq('id', id)
    .single()

  const data = {
    nome: formData.get('nome') as string,
    cnpj: (formData.get('cnpj') as string) || null,
    segmento: (formData.get('segmento') as ClienteSegmento) || null,
    porte: (formData.get('porte') as ClientePorte) || null,
    endereco_logradouro: (formData.get('endereco_logradouro') as string) || null,
    endereco_cidade: (formData.get('endereco_cidade') as string) || null,
    endereco_estado: (formData.get('endereco_estado') as string) || null,
    endereco_cep: (formData.get('endereco_cep') as string) || null,
    resp_financeiro_nome: (formData.get('resp_financeiro_nome') as string) || null,
    resp_financeiro_email: (formData.get('resp_financeiro_email') as string) || null,
    resp_financeiro_telefone: (formData.get('resp_financeiro_telefone') as string) || null,
    decisor_nome: (formData.get('decisor_nome') as string) || null,
    decisor_email: (formData.get('decisor_email') as string) || null,
    decisor_telefone: (formData.get('decisor_telefone') as string) || null,
    responsavel_interno_id: (formData.get('responsavel_interno_id') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
  }

  if (!data.nome) return { error: 'Nome da clínica é obrigatório' }

  const { error } = await supabase.from('clientes').update(data).eq('id', id)
  if (error) return { error: error.message }

  // Registrar histórico se responsável mudou
  if (clienteAntes && clienteAntes.responsavel_interno_id !== data.responsavel_interno_id) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('historico_responsaveis').insert({
      agencia_id: clienteAntes.agencia_id,
      cliente_id: id,
      responsavel_anterior_id: clienteAntes.responsavel_interno_id,
      responsavel_novo_id: data.responsavel_interno_id,
      alterado_por_id: user?.id ?? null,
    })
  }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

export async function updateResponsavelInterno(
  clienteId: string,
  novoResponsavelId: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: clienteAtual } = await supabase
    .from('clientes')
    .select('responsavel_interno_id, agencia_id')
    .eq('id', clienteId)
    .single()

  if (!clienteAtual) return { error: 'Cliente não encontrado' }

  if (clienteAtual.responsavel_interno_id === novoResponsavelId) {
    return { success: true }
  }

  const { error: updateError } = await supabase
    .from('clientes')
    .update({ responsavel_interno_id: novoResponsavelId })
    .eq('id', clienteId)

  if (updateError) return { error: updateError.message }

  await supabase.from('historico_responsaveis').insert({
    agencia_id: clienteAtual.agencia_id,
    cliente_id: clienteId,
    responsavel_anterior_id: clienteAtual.responsavel_interno_id,
    responsavel_novo_id: novoResponsavelId,
    alterado_por_id: user.id,
  })

  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}

export async function updateClienteStatus(id: string, status: ClienteStatus) {
  const supabase = await createClient()
  const { error } = await supabase.from('clientes').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { success: true }
}
