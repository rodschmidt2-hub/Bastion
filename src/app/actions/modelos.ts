'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export type ModeloTipo = 'contrato' | 'proposta' | 'autorizacao' | 'termo' | 'outro'

export async function uploadModelo(formData: FormData) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Sem permissão' }
  if (!profile.agencia_id) return { error: 'Perfil incompleto' }

  const supabase = await createClient()
  const admin = await createAdminClient()

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado' }
  if (file.size > 20 * 1024 * 1024) return { error: 'Arquivo maior que 20MB' }

  const nome = (formData.get('nome') as string)?.trim()
  if (!nome) return { error: 'Nome é obrigatório' }

  const tipo = (formData.get('tipo') as ModeloTipo) || 'outro'
  const descricao = (formData.get('descricao') as string)?.trim() || null

  const ext = file.name.split('.').pop()
  if (!ext || ext === file.name) return { error: 'Tipo de arquivo inválido' }
  const storagePath = `modelos/${profile.agencia_id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from('documentos')
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const { data: { user } } = await supabase.auth.getUser()
  const { error: dbError } = await supabase.from('modelos_documento').insert({
    agencia_id:  profile.agencia_id,
    nome,
    tipo,
    descricao,
    arquivo_url: storagePath,
    criado_por:  user?.id ?? null,
  })

  if (dbError) {
    await admin.storage.from('documentos').remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath('/modelos')
  revalidatePath('/produtos')
  return {}
}

export async function deleteModelo(id: string) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Sem permissão' }

  const supabase = await createClient()
  const admin = await createAdminClient()

  const { data: modelo } = await supabase
    .from('modelos_documento')
    .select('arquivo_url')
    .eq('id', id)
    .single()
  if (!modelo) return { error: 'Modelo não encontrado' }

  await admin.storage.from('documentos').remove([modelo.arquivo_url])
  const { error } = await supabase.from('modelos_documento').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/modelos')
  revalidatePath('/produtos')
  return {}
}

export async function getModeloUrl(storagePath: string) {
  const admin = await createAdminClient()
  const { data } = await admin.storage
    .from('documentos')
    .createSignedUrl(storagePath, 60 * 60)
  return data?.signedUrl ?? null
}

export async function setModeloProduto(produtoId: string, modeloId: string | null) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') return { error: 'Sem permissão' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('produtos_agencia')
    .update({ modelo_id: modeloId || null })
    .eq('id', produtoId)

  if (error) return { error: error.message }
  revalidatePath('/produtos')
  return {}
}
