import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { ModelosBiblioteca } from '@/components/modelos/modelos-biblioteca'

export default async function ModelosPage() {
  const [supabase, profile] = await Promise.all([createClient(), getProfile()])

  const { data: modelos } = await supabase
    .from('modelos_documento')
    .select('id, nome, tipo, descricao, arquivo_url, created_at')
    .eq('ativo', true)
    .order('tipo')
    .order('nome')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-slate-900">Modelos</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">
          Biblioteca de contratos, propostas e documentos padrão da agência
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <ModelosBiblioteca
          modelos={modelos ?? []}
          isAdmin={profile?.role === 'admin'}
        />
      </div>
    </div>
  )
}
