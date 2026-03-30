import { createClient } from '@/lib/supabase/server'
import { ClientesTable } from '@/components/clientes/clientes-table'
import type { Cliente, ContatoCliente, Profile } from '@/types/database'

export default async function ClientesPage() {
  const supabase = await createClient()

  const [
    { data: clientes },
    { data: responsaveis },
    { data: contatosPrincipais },
    { data: produtosAtivos },
  ] = await Promise.all([
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, nome, email').eq('ativo', true).order('nome'),
    supabase.from('contatos_cliente').select('*').eq('is_principal', true),
    supabase
      .from('produtos_contratados')
      .select('cliente_id, valor_efetivo, produto_tipo')
      .eq('item_status', 'ativo'),
  ])

  // Mapa cliente_id → contato principal
  const contatoMap = Object.fromEntries(
    (contatosPrincipais ?? []).map((c) => [c.cliente_id, c as ContatoCliente])
  )

  // Mapa cliente_id → MRR (soma valor_efetivo dos produtos ativos recorrentes)
  const mrrMap: Record<string, number> = {}
  for (const p of produtosAtivos ?? []) {
    if (!p.cliente_id) continue
    mrrMap[p.cliente_id] = (mrrMap[p.cliente_id] ?? 0) + (p.valor_efetivo ?? 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-slate-900">Clientes</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">
          {clientes?.length ?? 0} {(clientes?.length ?? 0) === 1 ? 'cliente' : 'clientes'} cadastrados
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <ClientesTable
          clientes={(clientes ?? []) as Cliente[]}
          responsaveis={(responsaveis ?? []) as Pick<Profile, 'id' | 'nome' | 'email'>[]}
          contatoMap={contatoMap}
          mrrMap={mrrMap}
        />
      </div>
    </div>
  )
}
