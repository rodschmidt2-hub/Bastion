'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function createOferta(produtoId: string, formData: FormData) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { error: 'Nome é obrigatório' }

  const valorStr = formData.get('valor') as string
  if (!valorStr) return { error: 'Valor é obrigatório' }

  const multaValorStr = formData.get('multa_valor') as string
  const multaTipo     = (formData.get('multa_tipo') as string) || null

  const { error } = await supabase.from('produto_ofertas').insert({
    agencia_id:               profile.agencia_id,
    produto_id:               produtoId,
    nome,
    valor:                    parseFloat(valorStr),
    periodicidade:            (formData.get('periodicidade') as string) || null,
    carencia_meses:           parseInt(formData.get('carencia_meses') as string) || 0,
    prazo_aviso_cancelamento: parseInt(formData.get('prazo_aviso_cancelamento') as string) || 30,
    multa_tipo:               multaTipo,
    multa_valor:              multaValorStr ? parseFloat(multaValorStr) : null,
    indice_reajuste:          (formData.get('indice_reajuste') as string) || null,
    perc_reajuste_fixo:       (formData.get('perc_reajuste_fixo') as string)
                                ? parseFloat(formData.get('perc_reajuste_fixo') as string)
                                : null,
    renovacao_automatica:     formData.get('renovacao_automatica') === 'true',
  })

  if (error) return { error: error.message }

  revalidatePath('/produtos')
  return { success: true }
}

export async function updateOferta(ofertaId: string, produtoId: string, formData: FormData) {
  const supabase = await createClient()

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { error: 'Nome é obrigatório' }

  const valorStr = formData.get('valor') as string
  if (!valorStr) return { error: 'Valor é obrigatório' }

  const multaValorStr = formData.get('multa_valor') as string
  const multaTipo     = (formData.get('multa_tipo') as string) || null

  const { error } = await supabase.from('produto_ofertas').update({
    nome,
    valor:                    parseFloat(valorStr),
    periodicidade:            (formData.get('periodicidade') as string) || null,
    carencia_meses:           parseInt(formData.get('carencia_meses') as string) || 0,
    prazo_aviso_cancelamento: parseInt(formData.get('prazo_aviso_cancelamento') as string) || 30,
    multa_tipo:               multaTipo,
    multa_valor:              multaValorStr ? parseFloat(multaValorStr) : null,
    indice_reajuste:          (formData.get('indice_reajuste') as string) || null,
    perc_reajuste_fixo:       (formData.get('perc_reajuste_fixo') as string)
                                ? parseFloat(formData.get('perc_reajuste_fixo') as string)
                                : null,
    renovacao_automatica:     formData.get('renovacao_automatica') === 'true',
  }).eq('id', ofertaId).eq('produto_id', produtoId)

  if (error) return { error: error.message }

  revalidatePath('/produtos')
  return { success: true }
}

export async function toggleOfertaAtivo(ofertaId: string, ativo: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('produto_ofertas')
    .update({ ativo })
    .eq('id', ofertaId)
  if (error) return { error: error.message }
  revalidatePath('/produtos')
  return { success: true }
}
