'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import type { ClienteStatus, ClienteSegmento, ClientePorte } from '@/types/database'

function parseClienteForm(formData: FormData) {
  return {
    razao_social:              formData.get('nome') as string,
    cnpj:                      (formData.get('cnpj') as string) || null,
    segmento:                  (formData.get('segmento') as ClienteSegmento) || null,
    porte:                     (formData.get('porte') as ClientePorte) || null,
    logradouro:                (formData.get('endereco_logradouro') as string) || null,
    cidade:                    (formData.get('endereco_cidade') as string) || null,
    uf:                        (formData.get('endereco_estado') as string) || null,
    cep:                       (formData.get('endereco_cep') as string) || null,
    resp_financeiro_nome:      (formData.get('resp_financeiro_nome') as string) || null,
    resp_financeiro_email:     (formData.get('resp_financeiro_email') as string) || null,
    resp_financeiro_telefone:  (formData.get('resp_financeiro_telefone') as string) || null,
    decisor_nome:              (formData.get('decisor_nome') as string) || null,
    decisor_email:             (formData.get('decisor_email') as string) || null,
    decisor_telefone:          (formData.get('decisor_telefone') as string) || null,
    responsavel_id:            (formData.get('responsavel_interno_id') as string) || null,
    observacoes:               (formData.get('observacoes') as string) || null,
  }
}

export async function createCliente(formData: FormData) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const data = parseClienteForm(formData)
  if (!data.razao_social) return { error: 'Nome da clínica é obrigatório' }

  const codigo_cliente = `CLI-${Date.now().toString(36).toUpperCase()}`
  const { error } = await supabase.from('clientes').insert({ ...data, agencia_id: profile.agencia_id, codigo_cliente })
  if (error) return { error: error.message }

  revalidatePath('/clientes')
  return { success: true }
}

export async function updateCliente(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: clienteAntes } = await supabase
    .from('clientes')
    .select('responsavel_id, agencia_id')
    .eq('id', id)
    .single()

  const data = parseClienteForm(formData)
  if (!data.razao_social) return { error: 'Nome da clínica é obrigatório' }

  const { error } = await supabase.from('clientes').update(data).eq('id', id)
  if (error) return { error: error.message }

  if (clienteAntes && clienteAntes.responsavel_id !== data.responsavel_id) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('historico_responsaveis').insert({
      agencia_id: clienteAntes.agencia_id,
      cliente_id: id,
      responsavel_anterior_id: clienteAntes.responsavel_id,
      responsavel_novo_id: data.responsavel_id,
      alterado_por_id: user?.id ?? null,
    })
  }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

export async function updateClienteStatus(id: string, status: ClienteStatus) {
  const supabase = await createClient()
  const { error } = await supabase.from('clientes').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { success: true }
}

export async function desativarCliente(id: string, motivo: string) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }
  if (!motivo.trim()) return { error: 'Motivo é obrigatório' }

  const hoje = new Date().toISOString().split('T')[0]

  const { error } = await supabase.from('clientes').update({
    status: 'inativo' as ClienteStatus,
    motivo_inativacao: motivo,
    data_inativacao: hoje,
  }).eq('id', id)

  if (error) return { error: error.message }

  await supabase.from('eventos_cliente').insert({
    agencia_id: profile.agencia_id,
    cliente_id: id,
    tipo: 'status_change',
    descricao: `Cliente desativado. Motivo: ${motivo}`,
    usuario_id: profile.id,
    dados: { status_anterior: 'ativo', status_novo: 'inativo', motivo },
  })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

export async function reativarCliente(id: string) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const { data: cliente } = await supabase.from('clientes').select('status').eq('id', id).single()
  const statusAnterior = cliente?.status ?? 'inativo'

  const { error } = await supabase.from('clientes').update({
    status: 'ativo' as ClienteStatus,
    motivo_inativacao: null,
    data_inativacao: null,
    data_suspensao: null,
  }).eq('id', id)

  if (error) return { error: error.message }

  await supabase.from('eventos_cliente').insert({
    agencia_id: profile.agencia_id,
    cliente_id: id,
    tipo: 'status_change',
    descricao: `Cliente reativado.`,
    usuario_id: profile.id,
    dados: { status_anterior: statusAnterior, status_novo: 'ativo' },
  })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

export async function ativarCliente(id: string) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  // Verifica se existe ao menos um contrato assinado
  const { data: contratos } = await supabase
    .from('contratos')
    .select('id, is_assinado')
    .eq('cliente_id', id)

  const temAssinado = (contratos ?? []).some((c: any) => c.is_assinado === true)
  if (!temAssinado) return { error: 'É necessário um contrato assinado para ativar o cliente' }

  const { error } = await supabase
    .from('clientes')
    .update({ status: 'ativo' as ClienteStatus })
    .eq('id', id)

  if (error) return { error: error.message }

  await supabase.from('eventos_cliente').insert({
    agencia_id: profile.agencia_id,
    cliente_id: id,
    tipo: 'status_change',
    descricao: 'Cliente ativado após assinatura de contrato.',
    usuario_id: profile.id,
    dados: { status_anterior: 'contrato_pendente', status_novo: 'ativo' },
  })

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

export async function saveNotaFinanceira(clienteId: string, conteudo: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clientes').update({ nota_financeira: conteudo }).eq('id', clienteId)
  if (error) return { error: error.message }
  return { success: true }
}
