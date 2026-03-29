'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { DocumentoTipo } from '@/types/database'

export async function uploadDocumento(clienteId: string, formData: FormData) {
  const supabase = await createClient()
  const admin = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Nenhum arquivo selecionado' }
  if (file.size > 10 * 1024 * 1024) return { error: 'Arquivo maior que 10MB' }

  const ext = file.name.split('.').pop()
  const storagePath = `${clienteId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from('documentos')
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const { error: dbError } = await supabase.from('documentos_cliente').insert({
    cliente_id: clienteId,
    nome: file.name,
    tipo: (formData.get('tipo') as DocumentoTipo) || 'outro',
    storage_path: storagePath,
    tamanho_bytes: file.size,
    created_by: user.id,
  })

  if (dbError) {
    await admin.storage.from('documentos').remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}

export async function deleteDocumento(clienteId: string, documentoId: string, storagePath: string) {
  const supabase = await createClient()
  const admin = await createAdminClient()

  await admin.storage.from('documentos').remove([storagePath])
  const { error } = await supabase.from('documentos_cliente').delete().eq('id', documentoId)
  if (error) return { error: error.message }

  revalidatePath(`/clientes/${clienteId}`)
  return { success: true }
}

export async function getDocumentoUrl(storagePath: string) {
  const admin = await createAdminClient()
  const { data } = await admin.storage
    .from('documentos')
    .createSignedUrl(storagePath, 60 * 60) // 1 hour
  return data?.signedUrl ?? null
}
