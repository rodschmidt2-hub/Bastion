'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Acesso restrito a administradores')
  return user
}

export async function inviteUser(formData: FormData) {
  const currentUser = await requireAdmin()
  const email = formData.get('email') as string
  const role = formData.get('role') as UserRole

  if (!email || !role) return { error: 'Email e perfil são obrigatórios' }

  // Buscar agencia_id do admin para passar ao trigger fn_create_profile_on_signup
  const supabase = await createClient()
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('agencia_id')
    .eq('id', currentUser.id)
    .single()

  if (!adminProfile?.agencia_id) return { error: 'Agência não encontrada' }

  const admin = await createAdminClient()

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role, agencia_id: adminProfile.agencia_id },
  })

  if (inviteError) return { error: inviteError.message }

  revalidatePath('/usuarios')
  return { success: true }
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireAdmin()

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/usuarios')
  return { success: true }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const currentUser = await requireAdmin()

  if (currentUser.id === userId) {
    return { error: 'Você não pode desativar sua própria conta' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ ativo: isActive })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/usuarios')
  return { success: true }
}
