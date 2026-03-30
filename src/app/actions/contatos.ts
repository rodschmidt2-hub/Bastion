'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function createContato(clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const nome = formData.get('nome') as string
  if (!nome?.trim()) return { error: 'Nome é obrigatório' }

  const { error } = await supabase.from('contatos_cliente').insert({
    agencia_id:   profile.agencia_id,
    cliente_id:   clienteId,
    nome:         nome.trim(),
    cargo:        (formData.get('cargo') as string) || null,
    email:        (formData.get('email') as string) || null,
    whatsapp:     (formData.get('whatsapp') as string) || null,
    is_principal: formData.get('is_principal') === 'true',
    is_cobranca:  formData.get('is_cobranca') === 'true',
    is_nfe:       formData.get('is_nfe') === 'true',
  })

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/clientes')
  return { success: true }
}

export async function updateContato(
  clienteId: string,
  contatoId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const nome = formData.get('nome') as string
  if (!nome?.trim()) return { error: 'Nome é obrigatório' }

  const { error } = await supabase
    .from('contatos_cliente')
    .update({
      nome:         nome.trim(),
      cargo:        (formData.get('cargo') as string) || null,
      email:        (formData.get('email') as string) || null,
      whatsapp:     (formData.get('whatsapp') as string) || null,
      is_principal: formData.get('is_principal') === 'true',
      is_cobranca:  formData.get('is_cobranca') === 'true',
      is_nfe:       formData.get('is_nfe') === 'true',
    })
    .eq('id', contatoId)
    .eq('cliente_id', clienteId)

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/clientes')
  return { success: true }
}

export async function deleteContato(clienteId: string, contatoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('contatos_cliente')
    .delete()
    .eq('id', contatoId)
    .eq('cliente_id', clienteId)

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/clientes')
  return { success: true }
}

export async function setPrincipal(clienteId: string, contatoId: string) {
  const supabase = await createClient()

  // Remove is_principal de todos os contatos do cliente
  const { error: clearError } = await supabase
    .from('contatos_cliente')
    .update({ is_principal: false })
    .eq('cliente_id', clienteId)

  if (clearError) return { error: clearError.message }

  // Define o novo principal
  const { error } = await supabase
    .from('contatos_cliente')
    .update({ is_principal: true })
    .eq('id', contatoId)
    .eq('cliente_id', clienteId)

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/clientes')
  return { success: true }
}
