'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function snapshotMrr() {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const agenciaId = profile.agencia_id
  const competencia = new Date().toISOString().slice(0, 7) // YYYY-MM

  // MRR = soma dos valores efetivos de produtos recorrentes ativos
  const { data: itens } = await supabase
    .from('produtos_contratados')
    .select('valor_efetivo, cliente_id')
    .eq('item_status', 'ativo')
    .neq('produto_tipo', 'pontual')

  const mrr = (itens ?? []).reduce((s, i) => s + (i.valor_efetivo ?? 0), 0)
  const arr = mrr * 12

  // Clientes ativos únicos
  const clientesAtivos = new Set((itens ?? []).map((i) => i.cliente_id)).size

  const { error } = await supabase.from('mrr_historico').upsert(
    {
      agencia_id: agenciaId,
      competencia,
      mrr,
      arr,
      clientes_ativos: clientesAtivos,
    },
    { onConflict: 'agencia_id,competencia' }
  )

  if (error) return { error: error.message }

  revalidatePath('/financeiro')
  revalidatePath('/dashboard')
  return { success: true, competencia, mrr, clientes_ativos: clientesAtivos }
}
