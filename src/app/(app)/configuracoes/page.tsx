import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'

export default async function ConfiguracoesPage() {
  const [supabase, profile] = await Promise.all([createClient(), getProfile()])
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-slate-900">Configurações</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">Dados da sua conta</p>
      </div>

      <div className="max-w-lg rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
            {(profile?.nome ?? user?.email ?? '?').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile?.nome ?? '—'}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
            profile?.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {profile?.role === 'admin' ? 'Admin' : 'Gestor'}
          </span>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-800">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Membro desde</dt>
            <dd className="font-medium text-slate-800">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                profile?.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {profile?.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </dd>
          </div>
        </dl>

        <p className="mt-6 text-xs text-slate-400">
          Para alterar senha ou email, entre em contato com o administrador do sistema.
        </p>
      </div>
    </div>
  )
}
