'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function createAcordo(clienteId: string, formData: FormData) {
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }
  if (profile.role !== 'admin' && profile.role !== 'gestor') return { error: 'Sem permissão' }

  const tipo = formData.get('tipo') as string
  if (!tipo) return { error: 'Tipo é obrigatório' }

  const valorAcordadoStr = formData.get('valor_acordado') as string
  if (!valorAcordadoStr) return { error: 'Valor acordado é obrigatório' }

  const numeroParcelas = parseInt(formData.get('numero_parcelas') as string)
  if (!numeroParcelas || numeroParcelas < 1) return { error: 'Número de parcelas inválido' }

  const primeiroVencimentoStr = formData.get('primeiro_vencimento') as string
  if (!primeiroVencimentoStr) return { error: 'Data do primeiro vencimento é obrigatória' }

  const descricao = (formData.get('descricao') as string)?.trim() || null
  const faturaIds = formData.getAll('fatura_ids[]') as string[]

  const supabase = await createClient()

  // Calcula valor original das faturas selecionadas
  let valorOriginal = 0
  if (faturaIds.length > 0) {
    const { data: faturas } = await supabase
      .from('faturas')
      .select('valor_total, valor_pago')
      .in('id', faturaIds)
    valorOriginal = (faturas ?? []).reduce((s, f) => s + ((f.valor_total ?? 0) - (f.valor_pago ?? 0)), 0)
  }

  const valorAcordado = parseFloat(valorAcordadoStr)

  // Cria o acordo
  const { data: { user } } = await supabase.auth.getUser()
  const { data: acordo, error: acordoErr } = await supabase
    .from('acordos')
    .insert({
      agencia_id:     profile.agencia_id,
      cliente_id:     clienteId,
      tipo,
      descricao,
      valor_original: valorOriginal || valorAcordado,
      valor_acordado: valorAcordado,
      status:         'ativo',
      criado_por:     user!.id,
    })
    .select('id')
    .single()

  if (acordoErr || !acordo) return { error: acordoErr?.message ?? 'Erro ao criar acordo' }

  // Vincula faturas originais e muda status para em_acordo
  if (faturaIds.length > 0) {
    await supabase.from('acordo_origens').insert(
      faturaIds.map((fid) => ({
        agencia_id: profile.agencia_id,
        acordo_id:  acordo.id,
        fatura_id:  fid,
      }))
    )
    await supabase
      .from('faturas')
      .update({ status: 'em_acordo' } as any)
      .in('id', faturaIds)
  }

  // Gera parcelas
  const primeiroVenc = new Date(primeiroVencimentoStr + 'T12:00:00')
  const valorParcela = parseFloat((valorAcordado / numeroParcelas).toFixed(2))
  const parcelas = []

  for (let i = 0; i < numeroParcelas; i++) {
    const dataVenc = new Date(primeiroVenc)
    dataVenc.setMonth(dataVenc.getMonth() + i)

    // Gera fatura de parcela
    const numero_fatura = `FAT-AC-${acordo.id.slice(0, 4).toUpperCase()}-${i + 1}`
    const { data: fatParcela } = await supabase
      .from('faturas')
      .insert({
        agencia_id:      profile.agencia_id,
        cliente_id:      clienteId,
        numero_fatura,
        competencia:     dataVenc.toISOString().slice(0, 7),
        tipo:            'acordo',
        data_vencimento: dataVenc.toISOString().split('T')[0],
        valor_total:     valorParcela,
        status:          'pendente',
      })
      .select('id')
      .single()

    if (fatParcela) {
      parcelas.push({
        agencia_id:      profile.agencia_id,
        acordo_id:       acordo.id,
        fatura_id:       fatParcela.id,
        numero:          i + 1,
        valor:           valorParcela,
        data_vencimento: dataVenc.toISOString().split('T')[0],
        status:          'pendente',
      })
    }
  }

  if (parcelas.length > 0) {
    await supabase.from('acordo_parcelas').insert(parcelas)
  }

  // Evento na timeline
  await supabase.from('eventos_cliente').insert({
    agencia_id: profile.agencia_id,
    cliente_id: clienteId,
    tipo:       'acordo',
    descricao:  `Acordo ${tipo === 'inadimplencia' ? 'de inadimplência' : 'de distrato'} criado: ${numeroParcelas}x R$ ${valorParcela.toFixed(2)}`,
    metadata:   { acordo_id: acordo.id, valor_acordado: valorAcordado, parcelas: numeroParcelas },
    criado_por: user!.id,
  })

  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/financeiro')
  return { success: true, acordoId: acordo.id }
}

export async function marcarAcordoQuebrado(acordoId: string, clienteId: string) {
  const profile = await getProfile()
  if (profile?.role !== 'admin' && profile?.role !== 'gestor') return { error: 'Sem permissão' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('acordos')
    .update({ status: 'quebrado' })
    .eq('id', acordoId)

  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}
