'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createPagamento(clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('pagamentos').insert({
    cliente_id: clienteId,
    data: formData.get('data') as string,
    valor: parseFloat(formData.get('valor') as string),
    forma: formData.get('forma') as string,
    referencia: (formData.get('referencia') as string) || null,
    status: 'confirmado',
    observacoes: (formData.get('observacoes') as string) || null,
    created_by: user?.id ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}

export async function estornarPagamento(clienteId: string, pagamentoId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('pagamentos')
    .update({ status: 'estornado' })
    .eq('id', pagamentoId)
  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}
