'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function createNpsRegistro(clienteId: string, formData: FormData) {
  const supabase = await createClient()

  const scoreStr = formData.get('score') as string
  if (!scoreStr) return { error: 'Score é obrigatório' }
  const score = parseInt(scoreStr)
  if (isNaN(score) || score < 0 || score > 10) return { error: 'Score deve ser entre 0 e 10' }

  const profile = await getProfile()

  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const { error } = await supabase.from('nps_registros').insert({
    agencia_id:    profile.agencia_id,
    cliente_id:    clienteId,
    score,
    data_registro: (formData.get('data_registro') as string) || new Date().toISOString().split('T')[0],
    observacao:    (formData.get('observacao') as string) || null,
    responsavel_id: profile.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/clientes')
  return { success: true }
}

export async function deleteNpsRegistro(id: string, clienteId: string) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Apenas admin pode excluir registros NPS' }

  const supabase = await createClient()
  const { error } = await supabase.from('nps_registros').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/clientes')
  return { success: true }
}
