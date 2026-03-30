'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Pencil, Trash2, Star, X, Check } from 'lucide-react'
import { createContato, updateContato, deleteContato, setPrincipal } from '@/app/actions/contatos'
import type { ContatoCliente } from '@/types/database'

interface ContatosSectionProps {
  clienteId: string
  contatos: ContatoCliente[]
}

interface ContatoFormProps {
  clienteId: string
  contato?: ContatoCliente
  onDone: () => void
}

function ContatoForm({ clienteId, contato, onDone }: ContatoFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = contato
        ? await updateContato(clienteId, contato.id, formData)
        : await createContato(clienteId, formData)

      if (result.error) {
        setError(result.error)
      } else {
        onDone()
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {contato ? 'Editar contato' : 'Novo contato'}
        </p>
        <button type="button" onClick={onDone} className="text-slate-400 hover:text-slate-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nome *</label>
          <input
            name="nome"
            required
            defaultValue={contato?.nome ?? ''}
            placeholder="Nome completo"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Cargo</label>
          <input
            name="cargo"
            defaultValue={contato?.cargo ?? ''}
            placeholder="Ex: Financeiro, Sócio..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">WhatsApp</label>
          <input
            name="whatsapp"
            defaultValue={contato?.whatsapp ?? ''}
            placeholder="(11) 99999-9999"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={contato?.email ?? ''}
            placeholder="email@clinica.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <CheckboxField
          name="is_principal"
          label="Principal"
          defaultChecked={contato?.is_principal ?? false}
        />
        <CheckboxField
          name="is_cobranca"
          label="Cobrança"
          defaultChecked={contato?.is_cobranca ?? false}
        />
        <CheckboxField
          name="is_nfe"
          label="NF-e"
          defaultChecked={contato?.is_nfe ?? false}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : contato ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}

function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string
  label: string
  defaultChecked: boolean
}) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600 select-none">
      <input type="hidden" name={name} value={checked ? 'true' : 'false'} />
      <button
        type="button"
        onClick={() => setChecked((v) => !v)}
        className={`flex h-4 w-4 items-center justify-center rounded border transition ${
          checked
            ? 'border-blue-600 bg-blue-600 text-white'
            : 'border-slate-300 bg-white text-transparent'
        }`}
      >
        <Check className="h-2.5 w-2.5" />
      </button>
      {label}
    </label>
  )
}

export function ContatosSection({ clienteId, contatos }: ContatosSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(contatoId: string) {
    if (!confirm('Excluir este contato?')) return
    startTransition(async () => { await deleteContato(clienteId, contatoId) })
  }

  function handleSetPrincipal(contatoId: string) {
    startTransition(async () => { await setPrincipal(clienteId, contatoId) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contatos</h3>
        {!showForm && (
          <button
            onClick={() => { setEditingId(null); setShowForm(true) }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-3 w-3" />
            Adicionar
          </button>
        )}
      </div>

      {showForm && editingId === null && (
        <ContatoForm
          clienteId={clienteId}
          onDone={() => setShowForm(false)}
        />
      )}

      {contatos.length === 0 && !showForm ? (
        <p className="text-sm text-slate-400">Nenhum contato cadastrado</p>
      ) : (
        <div className="space-y-2">
          {contatos.map((c) => (
            <div key={c.id}>
              {editingId === c.id ? (
                <ContatoForm
                  clienteId={clienteId}
                  contato={c}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <div className={`group flex items-center justify-between rounded-xl border p-3 ${
                  c.is_principal
                    ? 'border-blue-100 bg-blue-50/40'
                    : 'border-slate-100 bg-white'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {c.is_principal && (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-blue-500 text-blue-500" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.nome}</p>
                        {c.cargo && (
                          <span className="text-xs text-slate-400 shrink-0">{c.cargo}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {c.whatsapp && (
                          <span className="text-xs text-slate-500">{c.whatsapp}</span>
                        )}
                        {c.email && (
                          <span className="text-xs text-slate-500">{c.email}</span>
                        )}
                        <div className="flex items-center gap-1.5">
                          {c.is_cobranca && <Flag label="Cobrança" />}
                          {c.is_nfe && <Flag label="NF-e" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    {!c.is_principal && (
                      <button
                        onClick={() => handleSetPrincipal(c.id)}
                        disabled={isPending}
                        title="Definir como principal"
                        className="rounded p-1 text-slate-300 hover:text-blue-500"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => { setShowForm(false); setEditingId(c.id) }}
                      className="rounded p-1 text-slate-300 hover:text-slate-500"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={isPending}
                      className="rounded p-1 text-slate-300 hover:text-red-500"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Flag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
      {label}
    </span>
  )
}
