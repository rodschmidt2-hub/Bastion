'use client'

import { useRef, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { createCliente, updateCliente } from '@/app/actions/clientes'
import { TooltipInfo } from '@/components/ui/tooltip-info'
import type { Cliente, Profile } from '@/types/database'

const segmentoOptions = [
  { value: 'solo', label: 'Solo (clínica independente)' },
  { value: 'rede', label: 'Rede (multi-unidades)' },
  { value: 'especialidade', label: 'Especialidade' },
]

const porteOptions = [
  { value: 'pequeno', label: 'Pequeno' },
  { value: 'medio', label: 'Médio' },
  { value: 'grande', label: 'Grande' },
]

interface ClienteDrawerProps {
  open: boolean
  onClose: () => void
  cliente?: Cliente | null
  responsaveis: Pick<Profile, 'id' | 'nome' | 'email'>[]
}

export function ClienteDrawer({ open, onClose, cliente, responsaveis }: ClienteDrawerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = cliente
        ? await updateCliente(cliente.id, formData)
        : await createCliente(formData)

      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="flex w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {cliente ? 'Editar cliente' : 'Novo cliente'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {cliente ? 'Atualize os dados da clínica' : 'Preencha os dados da clínica'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Dados da clínica */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Dados da clínica</h3>
              <div className="space-y-3">
                <Field label="Nome da clínica *" name="nome" defaultValue={cliente?.razao_social} placeholder="Clínica Exemplo" />
                <Field label="CNPJ" name="cnpj" defaultValue={cliente?.cnpj ?? ''} placeholder="00.000.000/0001-00" />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Segmento"
                    name="segmento"
                    defaultValue={cliente?.segmento ?? ''}
                    options={segmentoOptions}
                    tooltip="Solo: clínica com um profissional. Rede: múltiplas unidades ou franquias. Especialidade: focada em uma área específica."
                  />
                  <SelectField
                    label="Porte"
                    name="porte"
                    defaultValue={cliente?.porte ?? ''}
                    options={porteOptions}
                    tooltip="Pequeno: até 2 profissionais. Médio: equipe estabelecida. Grande: operação com múltiplos profissionais ou unidades."
                  />
                </div>
              </div>
            </section>

            {/* Endereço */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Endereço</h3>
              <div className="space-y-3">
                <Field label="Logradouro" name="endereco_logradouro" defaultValue={cliente?.logradouro ?? ''} placeholder="Rua, número, bairro" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cidade" name="endereco_cidade" defaultValue={cliente?.cidade ?? ''} placeholder="São Paulo" />
                  <Field label="Estado" name="endereco_estado" defaultValue={cliente?.uf ?? ''} placeholder="SP" />
                </div>
                <Field label="CEP" name="endereco_cep" defaultValue={cliente?.cep ?? ''} placeholder="00000-000" />
              </div>
            </section>

            {/* Responsável financeiro */}
            <section>
              <div className="mb-3 flex items-center gap-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Responsável financeiro</h3>
                <TooltipInfo text="Pessoa que autoriza pagamentos e recebe cobranças e faturas. Pode ser diferente do dono da clínica." />
              </div>
              <div className="space-y-3">
                <Field label="Nome" name="resp_financeiro_nome" defaultValue={cliente?.resp_financeiro_nome ?? ''} placeholder="Nome completo" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email" name="resp_financeiro_email" type="email" defaultValue={cliente?.resp_financeiro_email ?? ''} placeholder="email@clinica.com" />
                  <Field label="Telefone" name="resp_financeiro_telefone" defaultValue={cliente?.resp_financeiro_telefone ?? ''} placeholder="(11) 99999-9999" />
                </div>
              </div>
            </section>

            {/* Decisor */}
            <section>
              <div className="mb-3 flex items-center gap-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Decisor / dono</h3>
                <TooltipInfo text="Proprietário ou sócio com poder de decisão. Contato estratégico para renovações, upsells e decisões importantes." />
              </div>
              <div className="space-y-3">
                <Field label="Nome" name="decisor_nome" defaultValue={cliente?.decisor_nome ?? ''} placeholder="Nome completo" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email" name="decisor_email" type="email" defaultValue={cliente?.decisor_email ?? ''} placeholder="email@clinica.com" />
                  <Field label="Telefone" name="decisor_telefone" defaultValue={cliente?.decisor_telefone ?? ''} placeholder="(11) 99999-9999" />
                </div>
              </div>
            </section>

            {/* Gestão interna */}
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Gestão interna</h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center gap-1">
                    <label className="text-sm font-medium text-slate-700">Responsável interno</label>
                    <TooltipInfo text="Membro da equipe da agência responsável pelo relacionamento com este cliente. Recebe alertas e aparece nos relatórios." />
                  </div>
                  <select
                    name="responsavel_interno_id"
                    defaultValue={cliente?.responsavel_id ?? ''}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Sem responsável</option>
                    {responsaveis.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome ?? r.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Observações</label>
                  <textarea
                    name="observacoes"
                    defaultValue={cliente?.observacoes ?? ''}
                    rows={3}
                    placeholder="Notas internas sobre a conta..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-4">
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? 'Salvando...' : cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label, name, defaultValue = '', placeholder = '', type = 'text',
}: {
  label: string; name: string; defaultValue?: string; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

function SelectField({
  label, name, defaultValue, options, tooltip,
}: {
  label: string; name: string; defaultValue: string; options: { value: string; label: string }[]; tooltip?: string
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {tooltip && <TooltipInfo text={tooltip} />}
      </div>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Selecionar</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
