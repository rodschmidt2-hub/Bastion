import { createClient } from '@/lib/supabase/server'
import { ClientesTable } from '@/components/clientes/clientes-table'
import { calcularHealthScore } from '@/lib/health-score'
import type { Cliente, ContatoCliente, Profile, NpsRegistro } from '@/types/database'

export default async function ClientesPage() {
  const supabase = await createClient()

  const seisM = new Date()
  seisM.setMonth(seisM.getMonth() - 6)
  const seisMAgo = seisM.toISOString().split('T')[0]

  const [
    { data: clientes },
    { data: responsaveis },
    { data: contatosPrincipais },
    { data: npsRecentes },
    { data: faturasRecentes },
  ] = await Promise.all([
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, nome, email').eq('ativo', true).order('nome'),
    supabase.from('contatos_cliente').select('*').eq('is_principal', true),
    supabase.from('nps_registros').select('cliente_id, score, data_registro').order('data_registro', { ascending: false }),
    supabase
      .from('faturas')
      .select('cliente_id, data_vencimento, status, pagamentos(data_pagamento)')
      .gte('data_vencimento', seisMAgo),
  ])

  // Mapa cliente_id → contato principal
  const contatoMap = Object.fromEntries(
    (contatosPrincipais ?? []).map((c) => [c.cliente_id, c as ContatoCliente])
  )

  // Mapa cliente_id → última nota NPS
  const npsMap: Record<string, number> = {}
  for (const r of (npsRecentes ?? []) as Pick<NpsRegistro, 'cliente_id' | 'score' | 'data_registro'>[]) {
    if (!(r.cliente_id in npsMap)) npsMap[r.cliente_id] = r.score
  }

  // Agrupa faturas por cliente
  const faturasPorCliente: Record<string, any[]> = {}
  for (const f of faturasRecentes ?? []) {
    if (!faturasPorCliente[f.cliente_id]) faturasPorCliente[f.cliente_id] = []
    faturasPorCliente[f.cliente_id].push(f)
  }

  // Calcula health score por cliente
  const healthScoreMap: Record<string, { score: number; pontualidade: number; nps: number; longevidade: number; suspenso: boolean }> = {}
  for (const c of (clientes ?? []) as Cliente[]) {
    healthScoreMap[c.id] = calcularHealthScore({
      status: c.status,
      data_inicio_relac: (c as any).data_inicio_relac ?? null,
      created_at: c.created_at,
      faturas: (faturasPorCliente[c.id] ?? []) as any[],
      ultimaNps: npsMap[c.id] ?? null,
    })
  }

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
          contatoMap={contatoMap}
          npsMap={npsMap}
          healthScoreMap={healthScoreMap}
        />
      </div>
    </div>
  )
}
