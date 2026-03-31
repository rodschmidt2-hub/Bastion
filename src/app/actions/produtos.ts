'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import type { ProdutoStatus } from '@/types/database'

function slugify(nome: string) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export async function createProduto(formData: FormData) {
  const supabase = await createClient()
  const profile = await getProfile()
  if (!profile?.agencia_id) return { error: 'Perfil não encontrado' }

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { error: 'Nome é obrigatório' }

  const tipo = formData.get('tipo') as string
  if (!tipo) return { error: 'Tipo é obrigatório' }

  const periodicidade = (formData.get('periodicidade') as string) || null
  if ((tipo === 'recorrente' || tipo === 'hibrido') && !periodicidade) {
    return { error: 'Periodicidade é obrigatória para produtos recorrentes ou híbridos' }
  }

  const valorStr = formData.get('valor_padrao') as string
  const custoStr = formData.get('custo_base') as string

  const modeloId = (formData.get('modelo_id') as string) || null

  const { error } = await supabase.from('produtos_agencia').insert({
    agencia_id:     profile.agencia_id,
    codigo_produto: `${slugify(nome)}-${Date.now().toString(36)}`,
    nome,
    categoria:    (formData.get('categoria') as string) || null,
    tipo,
    periodicidade: tipo === 'pontual' ? null : periodicidade,
    valor_padrao:  valorStr ? parseFloat(valorStr) : null,
    custo_base:    custoStr ? parseFloat(custoStr) : null,
    modelo_id:     modeloId,
  })

  if (error) return { error: error.message }

  revalidatePath('/produtos')
  return { success: true }
}

export async function updateProduto(id: string, formData: FormData) {
  const supabase = await createClient()

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { error: 'Nome é obrigatório' }

  const tipo = formData.get('tipo') as string
  const periodicidade = (formData.get('periodicidade') as string) || null

  if ((tipo === 'recorrente' || tipo === 'hibrido') && !periodicidade) {
    return { error: 'Periodicidade é obrigatória para produtos recorrentes ou híbridos' }
  }

  const valorStr = formData.get('valor_padrao') as string
  const custoStr = formData.get('custo_base') as string
  const modeloId = (formData.get('modelo_id') as string) || null

  const { error } = await supabase.from('produtos_agencia').update({
    nome,
    categoria:    (formData.get('categoria') as string) || null,
    tipo,
    periodicidade: tipo === 'pontual' ? null : periodicidade,
    valor_padrao:  valorStr ? parseFloat(valorStr) : null,
    custo_base:    custoStr ? parseFloat(custoStr) : null,
    modelo_id:     modeloId,
  }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/produtos')
  return { success: true }
}

export async function toggleProdutoAtivo(id: string, ativo: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('produtos_agencia')
    .update({ ativo })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/produtos')
  return { success: true }
}

// Mantido para compatibilidade — será substituído pela Story 3.1
export async function updateProdutoStatus(clienteId: string, produtoId: string, status: ProdutoStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contrato_itens')
    .update({ status })
    .eq('id', produtoId)
  if (error) return { error: error.message }
  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}
