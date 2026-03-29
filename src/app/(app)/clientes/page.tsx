import { createClient } from '@/lib/supabase/server'
import { ClientesTable } from '@/components/clientes/clientes-table'
import type { Cliente, Profile } from '@/types/database'

export default async function ClientesPage() {
  const supabase = await createClient()

  const [{ data: clientes }, { data: responsaveis }] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, nome, email')
      .eq('ativo', true)
      .order('nome'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {clientes?.length ?? 0} {(clientes?.length ?? 0) === 1 ? 'cliente' : 'clientes'} cadastrados
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <ClientesTable
          clientes={(clientes ?? []) as Cliente[]}
          responsaveis={(responsaveis ?? []) as Pick<Profile, 'id' | 'nome' | 'email'>[]}
        />
      </div>
    </div>
  )
}
