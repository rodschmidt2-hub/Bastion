'use client'

import { useState, useTransition } from 'react'
import { Plus, Power, Trash2, Pencil, Check, X } from 'lucide-react'
import { createCategoria, toggleCategoriaAtivo, deleteCategoria, renameCategoria } from '@/app/actions/categorias'

interface Categoria {
  id: string
  nome: string
  ativo: boolean
  ordem: number
}

interface CategoriasManagerProps {
  categorias: Categoria[]
  userRole?: string
}

export function CategoriasManager({ categorias, userRole }: CategoriasManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNome, setEditingNome] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const canRename = userRole === 'admin' || userRole === 'gestor'

  function handleCreate() {
    if (!novaCategoria.trim()) { setError('Nome é obrigatório'); return }
    setError(null)
    startTransition(async () => {
      const result = await createCategoria(novaCategoria)
      if (result.error) { setError(result.error) }
      else { setNovaCategoria(''); setShowForm(false) }
    })
  }

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => { await toggleCategoriaAtivo(id, !ativo) })
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir categoria "${nome}"? Produtos que usam esta categoria não serão afetados.`)) return
    startTransition(async () => { await deleteCategoria(id) })
  }

  function startEdit(cat: Categoria) {
    setEditingId(cat.id)
    setEditingNome(cat.nome)
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingNome('')
    setEditError(null)
  }

  function handleRename(cat: Categoria) {
    if (!editingNome.trim()) { setEditError('Nome é obrigatório'); return }
    setEditError(null)
    startTransition(async () => {
      const result = await renameCategoria(cat.id, cat.nome, editingNome)
      if (result.error) { setEditError(result.error) }
      else { cancelEdit() }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Categorias de Produto</p>
          <p className="text-xs text-slate-400 mt-0.5">Organize o catálogo com categorias personalizadas</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(null) }}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova categoria
        </button>
      </div>

      {showForm && (
        <div className="border-b border-slate-100 px-5 py-3 bg-blue-50/40">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowForm(false) }}
              placeholder="Nome da categoria..."
              autoFocus
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Adicionar
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); setNovaCategoria('') }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
      )}

      {categorias.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-400">Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {categorias.map((cat) => (
            <div key={cat.id} className="group px-5 py-2.5 hover:bg-slate-50/50">
              {editingId === cat.id ? (
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${cat.ativo ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  <input
                    autoFocus
                    value={editingNome}
                    onChange={(e) => setEditingNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(cat)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 rounded border border-blue-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    onClick={() => handleRename(cat)}
                    disabled={isPending}
                    title="Confirmar"
                    className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    title="Cancelar"
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {editError && <p className="text-xs text-red-500">{editError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${cat.ativo ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    <span className={`text-sm ${cat.ativo ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {cat.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    {canRename && (
                      <button
                        onClick={() => startEdit(cat)}
                        title="Renomear"
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggle(cat.id, cat.ativo)}
                      disabled={isPending}
                      title={cat.ativo ? 'Desativar' : 'Ativar'}
                      className={`rounded p-1.5 transition hover:bg-slate-100 ${cat.ativo ? 'text-slate-400 hover:text-amber-500' : 'text-slate-300 hover:text-emerald-600'}`}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.nome)}
                      disabled={isPending}
                      title="Excluir"
                      className="rounded p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
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
