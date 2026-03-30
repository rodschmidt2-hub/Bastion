import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/get-profile'
import { Suspense } from 'react'
import { TabsNav } from '@/components/clientes/perfil/tabs-nav'
import { DadosTab } from '@/components/clientes/perfil/dados-tab'
import { ProdutosTab } from '@/components/clientes/perfil/produtos-tab'
import { ContratosTab } from '@/components/clientes/perfil/contratos-tab'
import { FinanceiroTab } from '@/components/clientes/perfil/financeiro-tab'
import { DocumentosTab } from '@/components/clientes/perfil/documentos-tab'
import { NpsTab } from '@/components/clientes/perfil/nps-tab'
import { HealthScoreBadge } from '@/components/clientes/health-score-badge'
import { calcularHealthScore } from '@/lib/health-score'
import type { Cliente, Profile, ProdutoContratadoView, ProdutoAgencia, ProdutoOferta, Contrato, Documento, ContatoCliente, NpsRegistro, Renovacao, UserRole } from '@/types/database'

const statusBadge: Record<string, string> = {
  ativo:        'bg-emerald-50 text-emerald-700',
  inadimplente: 'bg-red-50 text-red-700',
  pausado:      'bg-amber-50 text-amber-700',
  cancelado:    'bg-slate-100 text-slate-500',
  inativo:      'bg-slate-100 text-slate-500',
  suspenso:     'bg-orange-50 text-orange-700',
}

const statusLabel: Record<string, string> = {
  ativo: 'Ativo', inadimplente: 'Inadimplente', pausado: 'Pausado', cancelado: 'Cancelado',
  inativo: 'Inativo', suspenso: 'Suspenso',
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

  const [supabase, profile] = await Promise.all([createClient(), getProfile()])

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
    { data: ofertas },
    { data: contratos },
    { data: faturas },
    { data: documentos },
    { data: historico },
    { data: contatos },
    { data: npsRegistros },
  ] = await Promise.all([
    supabase.from('profiles').select('id, nome, email').eq('ativo', true),
    supabase.from('produtos_contratados').select('*').eq('cliente_id', id).order('data_inicio_item', { ascending: false }),
    supabase.from('produtos_agencia').select('*').eq('ativo', true).order('nome'),
    supabase.from('produto_ofertas').select('*').order('nome'),
    supabase.from('contratos').select('*').eq('cliente_id', id).order('data_ativacao', { ascending: false }),
    supabase
      .from('faturas')
      .select('*, itens:fatura_itens(id, descricao, valor), pagamentos(id, data_pagamento, valor_pago, forma_pagamento)')
      .eq('cliente_id', id)
      .order('data_vencimento', { ascending: false }),
    supabase.from('documentos_cliente').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
    supabase
      .from('historico_responsaveis')
      .select('created_at, responsavel_anterior:responsavel_anterior_id(nome, email), responsavel_novo:responsavel_novo_id(nome, email)')
      .eq('cliente_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contatos_cliente')
      .select('*')
      .eq('cliente_id', id)
      .order('is_principal', { ascending: false })
      .order('created_at'),
    supabase
      .from('nps_registros')
      .select('*, responsavel:profiles(nome)')
      .eq('cliente_id', id)
      .order('data_registro', { ascending: false }),
  ])

  const { data: eventosStatus } = await supabase
    .from('eventos_cliente')
    .select('id, created_at, descricao, dados, usuario:profiles(nome, email)')
    .eq('cliente_id', id)
    .eq('tipo', 'status_change')
    .order('created_at', { ascending: false })

  // Busca renovações para os itens contratados deste cliente
  const itemIds = (produtos ?? []).map((p) => p.id).filter(Boolean) as string[]
  const { data: renovacoesData } = itemIds.length > 0
    ? await supabase
        .from('renovacoes')
        .select('*, renovado_por_perfil:profiles!renovacoes_renovado_por_fkey(nome)')
        .in('contrato_item_id', itemIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const renovacoesMap: Record<string, any[]> = {}
  for (const r of (renovacoesData ?? [])) {
    if (!renovacoesMap[r.contrato_item_id]) renovacoesMap[r.contrato_item_id] = []
    renovacoesMap[r.contrato_item_id].push(r)
  }

  const ofertasMap: Record<string, ProdutoOferta[]> = {}
  for (const o of (ofertas ?? []) as ProdutoOferta[]) {
    if (!ofertasMap[o.produto_id]) ofertasMap[o.produto_id] = []
    ofertasMap[o.produto_id].push(o)
  }

  const contratoAtivo = (contratos ?? []).find((c) => c.status === 'ativo') ?? null

  const mrr = (produtos ?? [] as ProdutoContratadoView[])
    .filter((p: ProdutoContratadoView) => p.item_status === 'ativo')
    .reduce((s: number, p: ProdutoContratadoView) => s + (p.valor_efetivo ?? 0), 0)

  // Calcular pontualidade (Story 5.2)
  const pontualidade = (faturas ?? []).map((f: any) => {
    const pagamentos = f.pagamentos ?? []
    let status: 'pontual' | 'atraso_leve' | 'atraso_grave' | 'pendente' = 'pendente'
    if (f.status === 'pago' || f.status === 'parcial') {
      const pag = pagamentos[0]
      if (pag) {
        const dias = Math.floor(
          (new Date(pag.data_pagamento).getTime() - new Date(f.data_vencimento).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        status = dias <= 0 ? 'pontual' : dias <= 5 ? 'atraso_leve' : 'atraso_grave'
      }
    }
    return { competencia: f.competencia, status }
  })

  // LTV para métricas (Story 5.5)
  const ltv = (faturas ?? [])
    .filter((f: any) => f.status === 'pago')
    .reduce((s: number, f: any) => s + f.valor_total, 0)

  // Tenure em meses
  const c = cliente as Cliente
  const inicio = new Date((c as any).data_inicio_relac ?? c.created_at)
  const tenureMeses = Math.max(0, Math.floor((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  const badge = statusBadge[c.status] ?? statusBadge.cancelado
  const initials = c.razao_social.slice(0, 2).toUpperCase()

  // Calcula health score para o perfil
  const ultimaNps = (npsRegistros ?? []).length > 0 ? (npsRegistros![0] as any).score as number : null
  const healthScore = calcularHealthScore({
    status: c.status,
    data_inicio_relac: (c as any).data_inicio_relac ?? null,
    created_at: c.created_at,
    faturas: (faturas ?? []) as any[],
    ultimaNps,
  })

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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold text-slate-900 truncate">{c.razao_social}</h1>
              <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  c.status === 'ativo' ? 'bg-emerald-500' :
                  c.status === 'inadimplente' ? 'bg-red-500' :
                  c.status === 'pausado' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />
                {statusLabel[c.status] ?? c.status}
              </span>
              <HealthScoreBadge data={healthScore} />
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              {[c.cnpj, c.cidade && `${c.cidade}/${c.uf}`].filter(Boolean).join(' · ') || 'Sem dados adicionais'}
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
              contatos={(contatos ?? []) as ContatoCliente[]}
              eventosStatus={(eventosStatus ?? []) as any[]}
            />
          )}
          {tab === 'produtos' && (
            <ProdutosTab
              clienteId={id}
              contratoAtivo={contratoAtivo as Contrato | null}
              produtos={(produtos ?? []) as ProdutoContratadoView[]}
              catalogo={(catalogo ?? []) as ProdutoAgencia[]}
              ofertasMap={ofertasMap}
              renovacoesMap={renovacoesMap}
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
              faturas={(faturas ?? []) as any[]}
              mrr={mrr}
              notaFinanceira={(c as any).nota_financeira ?? null}
              pontualidade={pontualidade}
              metricas={{
                ltv,
                cac: (c as any).custo_aquisicao ?? null,
                margem: null,
                tenureMeses,
                dataInicioRelac: (c as any).data_inicio_relac ?? null,
                createdAt: c.created_at,
                userRole: profile?.role ?? 'gestor',
              }}
            />
          )}
          {tab === 'documentos' && (
            <DocumentosTab
              clienteId={id}
              documentos={(documentos ?? []) as Documento[]}
            />
          )}
          {tab === 'nps' && (
            <NpsTab
              clienteId={id}
              registros={(npsRegistros ?? []) as any[]}
              userRole={(profile?.role ?? 'gestor') as UserRole}
            />
          )}
        </div>
      </div>
    </div>
  )
}
