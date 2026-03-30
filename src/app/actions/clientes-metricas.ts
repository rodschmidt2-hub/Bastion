'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function updateCustoAquisicao(clienteId: string, valor: number | null) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const { error } = await supabase
    .from('clientes')
    .update({ custo_aquisicao: valor } as any)
    .eq('id', clienteId)

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}
