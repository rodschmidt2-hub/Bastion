import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { ProdutosTable } from '@/components/produtos/produtos-table'
import { CategoriasManager } from '@/components/produtos/categorias-manager'
import { ProdutosTabsNav } from '@/components/produtos/produtos-tabs-nav'
import type { ProdutoAgencia, ProdutoOferta } from '@/types/database'

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const profile = await getProfile()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { tab } = await searchParams
  const activeTab = tab ?? 'catalogo'

  const supabase = await createClient()
  const [{ data: produtos }, { data: ofertas }, { data: categoriasData }, { data: modelosData }] = await Promise.all([
    supabase.from('produtos_agencia').select('*, modelo_id').order('ativo', { ascending: false }).order('nome'),
    supabase.from('produto_ofertas').select('*').order('nome'),
    supabase.from('categorias_produto').select('id, nome, ativo, ordem').order('ordem').order('nome'),
    supabase.from('modelos_documento').select('id, nome, tipo').eq('ativo', true).order('nome'),
  ])

  const ofertasMap: Record<string, ProdutoOferta[]> = {}
  for (const o of (ofertas ?? []) as ProdutoOferta[]) {
    if (!ofertasMap[o.produto_id]) ofertasMap[o.produto_id] = []
    ofertasMap[o.produto_id].push(o)
  }

  const categoriasAtivas = (categoriasData ?? []).filter((c) => c.ativo).map((c) => c.nome)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold text-slate-900">Produtos</h1>
        <p className="mt-0.5 text-[13px] text-slate-400">
          {produtos?.filter((p) => p.ativo).length ?? 0} produtos ativos · {categoriasAtivas.length} categorias
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <Suspense>
          <ProdutosTabsNav />
        </Suspense>

        {activeTab === 'catalogo' && (
          <ProdutosTable
            produtos={(produtos ?? []) as ProdutoAgencia[]}
            ofertasMap={ofertasMap}
            categorias={categoriasAtivas}
            modelos={modelosData ?? []}
          />
        )}

        {activeTab === 'categorias' && (
          <CategoriasManager categorias={categoriasData ?? []} userRole={profile?.role} />
        )}
      </div>
    </div>
  )
}
