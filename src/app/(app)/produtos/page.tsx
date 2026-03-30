import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { ProdutosTable } from '@/components/produtos/produtos-table'
import type { ProdutoAgencia, ProdutoOferta } from '@/types/database'

export default async function ProdutosPage() {
  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const [{ data: produtos }, { data: ofertas }] = await Promise.all([
    supabase.from('produtos_agencia').select('*').order('ativo', { ascending: false }).order('nome'),
    supabase.from('produto_ofertas').select('*').order('nome'),
  ])

  const ofertasMap: Record<string, ProdutoOferta[]> = {}
  for (const o of (ofertas ?? []) as ProdutoOferta[]) {
    if (!ofertasMap[o.produto_id]) ofertasMap[o.produto_id] = []
    ofertasMap[o.produto_id].push(o)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Catálogo de Produtos</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {produtos?.filter((p) => p.ativo).length ?? 0} produtos ativos
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <ProdutosTable produtos={(produtos ?? []) as ProdutoAgencia[]} ofertasMap={ofertasMap} />
      </div>
    </div>
  )
}
