'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export async function getCategorias(): Promise<{ id: string; nome: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categorias_produto')
    .select('id, nome')
    .eq('ativo', true)
    .order('ordem')
    .order('nome')
  return data ?? []
}

export async function getCategoriasAdmin(): Promise<{ id: string; nome: string; ativo: boolean; ordem: number }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categorias_produto')
    .select('id, nome, ativo, ordem')
    .order('ordem')
    .order('nome')
  return data ?? []
}

export async function createCategoria(nome: string) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Sem permissão' }
  if (!profile.agencia_id) return { error: 'Perfil incompleto' }
  if (!nome.trim()) return { error: 'Nome é obrigatório' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('categorias_produto')
    .insert({ nome: nome.trim(), agencia_id: profile.agencia_id })

  if (error) {
    if (error.code === '23505') return { error: 'Já existe uma categoria com este nome' }
    return { error: error.message }
  }
  revalidatePath('/produtos')
  return {}
}

export async function toggleCategoriaAtivo(id: string, ativo: boolean) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Sem permissão' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('categorias_produto')
    .update({ ativo })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/produtos')
  return {}
}

export async function renameCategoria(id: string, nomeAntigo: string, nomeNovo: string) {
  const profile = await getProfile()
  if (profile?.role !== 'admin' && profile?.role !== 'gestor') return { error: 'Sem permissão' }
  if (!nomeNovo.trim()) return { error: 'Nome é obrigatório' }
  if (nomeNovo.trim() === nomeAntigo) return {}

  const supabase = await createClient()

  const { error } = await supabase
    .from('categorias_produto')
    .update({ nome: nomeNovo.trim() })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: 'Já existe uma categoria com este nome' }
    return { error: error.message }
  }

  // Atualiza todos os produtos que usavam o nome antigo
  await supabase
    .from('produtos_agencia')
    .update({ categoria: nomeNovo.trim() })
    .eq('categoria', nomeAntigo)

  revalidatePath('/produtos')
  return {}
}

export async function deleteCategoria(id: string) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Sem permissão' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('categorias_produto')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/produtos')
  return {}
}
