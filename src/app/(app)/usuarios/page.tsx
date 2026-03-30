import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { createClient } from '@/lib/supabase/server'
import { UsersTable } from '@/components/usuarios/users-table'
import { InviteUserButton } from '@/components/usuarios/invite-user-button'
import type { Profile } from '@/types/database'

export default async function UsuariosPage() {
  const profile = await getProfile()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gerencie os colaboradores internos</p>
        </div>
        <InviteUserButton />
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <UsersTable users={(users ?? []) as Profile[]} currentUserId={profile.id} />
      </div>
    </div>
  )
}
