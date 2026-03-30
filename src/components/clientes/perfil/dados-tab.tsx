'use client'

import { ContatosSection } from '@/components/clientes/perfil/contatos-section'
import { HistoricoStatusSection } from '@/components/clientes/perfil/historico-status-section'
import type { Cliente, ContatoCliente, Profile } from '@/types/database'

const segmentoLabel = { solo: 'Solo', rede: 'Rede', especialidade: 'Especialidade' }
const porteLabel = { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' }

interface DadosTabProps {
  cliente: Cliente
  responsaveis: Pick<Profile, 'id' | 'nome' | 'email'>[]
  historico: { created_at: string; responsavel_anterior?: { nome: string | null; email: string } | null; responsavel_novo?: { nome: string | null; email: string } | null }[]
  contatos: ContatoCliente[]
  eventosStatus?: { id: string; created_at: string; descricao: string; dados: any; usuario?: { nome: string | null; email: string } }[]
}

export function DadosTab({ cliente, responsaveis, historico, contatos, eventosStatus = [] }: DadosTabProps) {
  const responsavel = responsaveis.find((r) => r.id === cliente.responsavel_id)

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Clínica">
          <Row label="CNPJ" value={cliente.cnpj} />
          <Row label="Segmento" value={cliente.segmento ? segmentoLabel[cliente.segmento as keyof typeof segmentoLabel] ?? cliente.segmento : null} />
          <Row label="Porte" value={cliente.porte ? porteLabel[cliente.porte as keyof typeof porteLabel] : null} />
        </Section>

        <Section title="Endereço">
          <Row label="Logradouro" value={cliente.logradouro} />
          <Row label="Cidade / Estado" value={
            [cliente.cidade, cliente.uf].filter(Boolean).join(' / ') || null
          } />
          <Row label="CEP" value={cliente.cep} />
        </Section>

        <Section title="Responsável financeiro">
          <Row label="Nome" value={cliente.resp_financeiro_nome} />
          <Row label="Email" value={cliente.resp_financeiro_email} />
          <Row label="Telefone" value={cliente.resp_financeiro_telefone} />
        </Section>

        <Section title="Decisor / Dono">
          <Row label="Nome" value={cliente.decisor_nome} />
          <Row label="Email" value={cliente.decisor_email} />
          <Row label="Telefone" value={cliente.decisor_telefone} />
        </Section>

        <Section title="Gestão interna">
          <Row label="Responsável" value={responsavel?.nome ?? responsavel?.email ?? null} />
          <Row label="Observações" value={cliente.observacoes} />
        </Section>
      </div>

      <ContatosSection clienteId={cliente.id} contatos={contatos} />

      <HistoricoStatusSection eventos={eventosStatus} />

      {historico.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Histórico de responsáveis</h3>
          <div className="space-y-2">
            {historico.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                <span className="text-xs text-slate-300">{new Date(h.created_at).toLocaleDateString('pt-BR')}</span>
                <span>{h.responsavel_anterior?.nome ?? h.responsavel_anterior?.email ?? 'Sem responsável'}</span>
                <span className="text-slate-300">→</span>
                <span className="font-medium text-slate-700">{h.responsavel_novo?.nome ?? h.responsavel_novo?.email ?? 'Sem responsável'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 text-right">{value || <span className="text-slate-300">—</span>}</dd>
    </div>
  )
}
