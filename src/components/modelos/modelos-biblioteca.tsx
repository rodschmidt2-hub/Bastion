'use client'

import { useState, useTransition, useRef } from 'react'
import { Upload, Download, Trash2, FileText } from 'lucide-react'
import { uploadModelo, deleteModelo, getModeloUrl } from '@/app/actions/modelos'

const tipoLabel: Record<string, string> = {
  contrato:    'Contrato',
  proposta:    'Proposta',
  autorizacao: 'Autorização',
  termo:       'Termo',
  outro:       'Outro',
}

const tipoBadge: Record<string, string> = {
  contrato:    'bg-blue-50 text-blue-700',
  proposta:    'bg-violet-50 text-violet-700',
  autorizacao: 'bg-amber-50 text-amber-700',
  termo:       'bg-emerald-50 text-emerald-700',
  outro:       'bg-slate-100 text-slate-600',
}

interface Modelo {
  id: string
  nome: string
  tipo: string
  descricao: string | null
  arquivo_url: string
  created_at: string
}

interface ModelosBibliotecaProps {
  modelos: Modelo[]
  isAdmin: boolean
}

export function ModelosBiblioteca({ modelos, isAdmin }: ModelosBibliotecaProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleUpload(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await uploadModelo(formData)
      if (result.error) { setError(result.error) }
      else { setShowForm(false); formRef.current?.reset() }
    })
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o modelo "${nome}"? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => { await deleteModelo(id) })
  }

  async function handleDownload(storagePath: string, nome: string) {
    const url = await getModeloUrl(storagePath)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.target = '_blank'
    a.click()
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <p className="text-sm text-slate-500">{modelos.length} modelo{modelos.length !== 1 ? 's' : ''} na biblioteca</p>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setError(null) }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Novo modelo
          </button>
        )}
      </div>

      {/* Upload form */}
      {showForm && isAdmin && (
        <div className="border-b border-slate-100 bg-blue-50/40 px-5 py-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Adicionar modelo</h3>
          <form ref={formRef} action={handleUpload} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Nome *</label>
                <input
                  name="nome"
                  required
                  placeholder="Ex: Contrato Redes Sociais v2"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Tipo</label>
                <select
                  name="tipo"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="contrato">Contrato</option>
                  <option value="proposta">Proposta</option>
                  <option value="autorizacao">Autorização</option>
                  <option value="termo">Termo</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Descrição (opcional)</label>
              <input
                name="descricao"
                placeholder="Para qual situação este modelo é usado..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Arquivo (PDF, DOCX — máx. 20MB) *
              </label>
              <input
                name="file"
                type="file"
                required
                accept=".pdf,.doc,.docx"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-700"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null) }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? 'Enviando...' : 'Salvar modelo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {modelos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 rounded-xl bg-slate-50 p-4">
            <FileText className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600">Nenhum modelo cadastrado</p>
          <p className="mt-1 text-xs text-slate-400">
            {isAdmin ? 'Clique em "Novo modelo" para adicionar o primeiro template' : 'Fale com o admin para cadastrar modelos de documento'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {modelos.map((m) => (
            <div key={m.id} className="group flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.nome}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${tipoBadge[m.tipo] ?? tipoBadge.outro}`}>
                      {tipoLabel[m.tipo] ?? 'Outro'}
                    </span>
                  </div>
                  {m.descricao && (
                    <p className="text-xs text-slate-400 truncate">{m.descricao}</p>
                  )}
                  <p className="text-xs text-slate-300">
                    {new Date(m.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100 shrink-0">
                <button
                  onClick={() => handleDownload(m.arquivo_url, m.nome)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(m.id, m.nome)}
                    disabled={isPending}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
