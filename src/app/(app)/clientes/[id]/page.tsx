import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { TabsNav } from '@/components/clientes/perfil/tabs-nav'
import { DadosTab } from '@/components/clientes/perfil/dados-tab'
import { ProdutosTab } from '@/components/clientes/perfil/produtos-tab'
import { ContratosTab } from '@/components/clientes/perfil/contratos-tab'
import { FinanceiroTab } from '@/components/clientes/perfil/financeiro-tab'
import { DocumentosTab } from '@/components/clientes/perfil/documentos-tab'
import type { Cliente, Profile, ProdutoContratado, ProdutoAgencia, Contrato, Pagamento, Documento } from '@/types/database'

const statusBadge = {
  ativo:        'bg-emerald-50 text-emerald-700',
  inadimplente: 'bg-red-50 text-red-700',
  pausado:      'bg-amber-50 text-amber-700',
  cancelado:    'bg-slate-100 text-slate-500',
}

const statusLabel = {
  ativo: 'Ativo', inadimplente: 'Inadimplente', pausado: 'Pausado', cancelado: 'Cancelado',
}

export default async function ClientePerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'dados' } = await searchParams

  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  const [
    { data: responsaveis },
    { data: produtos },
    { data: catalogo },
    { data: contratos },
    { data: pagamentos },
    { data: documentos },
    { data: historico },
  ] = await Promise.all([
    supabase.from('profiles').select('id, nome, email').eq('ativo', true),
    supabase.from('produtos_contratados').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
    supabase.from('produtos_agencia').select('*').eq('ativo', true).order('nome'),
    supabase.from('contratos').select('*').eq('cliente_id', id).order('data_inicio', { ascending: false }),
    // TODO Epic 4: pagamentos ligados a faturas (não cliente_id direto) — stub até lá
    Promise.resolve({ data: [] }),
    supabase.from('documentos_cliente').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
    // TODO Story 2.4: criar tabela historico_responsaveis e restaurar query
    Promise.resolve({ data: [] }),
  ])

  const mrr = (produtos ?? [])
    .filter((p: ProdutoContratado) => p.status === 'ativo')
    .reduce((s: number, p: ProdutoContratado) => s + p.valor_mensal, 0)

  const c = cliente as Cliente
  const badge = statusBadge[c.status]
  const initials = c.nome.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
        <ArrowLeft className="h-3.5 w-3.5" />
        Clientes
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-600">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-900 truncate">{c.nome}</h1>
              <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  c.status === 'ativo' ? 'bg-emerald-500' :
                  c.status === 'inadimplente' ? 'bg-red-500' :
                  c.status === 'pausado' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                {statusLabel[c.status]}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {[c.cnpj, c.endereco_cidade && `${c.endereco_cidade}/${c.endereco_estado}`].filter(Boolean).join(' · ') || 'Sem dados adicionais'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400 uppercase tracking-wide">MRR</p>
            <p className="text-lg font-semibold text-slate-900">
              {mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Suspense>
          <TabsNav clienteId={id} />
        </Suspense>

        {/* Tab content */}
        <div>
          {tab === 'dados' && (
            <DadosTab
              cliente={c}
              responsaveis={(responsaveis ?? []) as Pick<Profile, 'id' | 'nome' | 'email'>[]}
              historico={(historico ?? []) as any[]}
            />
          )}
          {tab === 'produtos' && (
            <ProdutosTab
              clienteId={id}
              produtos={(produtos ?? []) as ProdutoContratado[]}
              catalogo={(catalogo ?? []) as ProdutoAgencia[]}
            />
          )}
          {tab === 'contratos' && (
            <ContratosTab
              clienteId={id}
              contratos={(contratos ?? []) as Contrato[]}
            />
          )}
          {tab === 'financeiro' && (
            <FinanceiroTab
              clienteId={id}
              pagamentos={(pagamentos ?? []) as Pagamento[]}
              mrr={mrr}
            />
          )}
          {tab === 'documentos' && (
            <DocumentosTab
              clienteId={id}
              documentos={(documentos ?? []) as Documento[]}
            />
          )}
        </div>
      </div>
    </div>
  )
}
