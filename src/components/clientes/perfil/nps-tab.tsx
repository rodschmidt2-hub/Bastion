'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createNpsRegistro, deleteNpsRegistro } from '@/app/actions/nps'
import type { NpsRegistro, UserRole } from '@/types/database'

type NpsRegistroWithResponsavel = NpsRegistro & {
  responsavel: { nome: string | null } | null
}

function npsZone(score: number) {
  if (score >= 9) return {
    bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200',
    selectedBg: 'bg-emerald-500', selectedText: 'text-white', selectedBorder: 'border-emerald-600',
    unselectedBorder: 'border-emerald-200', label: 'Promotor',
  }
  if (score >= 7) return {
    bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200',
    selectedBg: 'bg-amber-500', selectedText: 'text-white', selectedBorder: 'border-amber-600',
    unselectedBorder: 'border-amber-200', label: 'Neutro',
  }
  return {
    bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200',
    selectedBg: 'bg-red-500', selectedText: 'text-white', selectedBorder: 'border-red-600',
    unselectedBorder: 'border-red-200', label: 'Detrator',
  }
}

interface NpsTabProps {
  clienteId: string
  registros: NpsRegistroWithResponsavel[]
  userRole: UserRole
}

export function NpsTab({ clienteId, registros, userRole }: NpsTabProps) {
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scoreInput, setScoreInput] = useState<number | null>(null)

  const ultimo = registros[0]
  const penultimo = registros[1]
  const variacao = ultimo && penultimo ? ultimo.score - penultimo.score : null

  function handleSubmit(formData: FormData) {
    if (scoreInput === null) { setError('Selecione uma nota'); return }
    setError(null)
    startTransition(async () => {
      const result = await createNpsRegistro(clienteId, formData)
      if (result.error) { setError(result.error) } else { setShowForm(false); setScoreInput(null) }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este registro NPS?')) return
    startTransition(async () => { await deleteNpsRegistro(id, clienteId) })
  }

  return (
    <div className="p-6 space-y-5">
      {/* Score atual */}
      {ultimo ? (
        <div className="flex items-center gap-5 rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ring-4 ${npsZone(ultimo.score).bg} ${npsZone(ultimo.score).ring}`}>
            <span className={`text-3xl font-bold ${npsZone(ultimo.score).text}`}>{ultimo.score}</span>
          </div>
          <div>
            <p className={`text-sm font-semibold ${npsZone(ultimo.score).text}`}>{npsZone(ultimo.score).label}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Score atual · {new Date(ultimo.data_registro).toLocaleDateString('pt-BR')}
            </p>
            {variacao !== null && (
              <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
                variacao > 0 ? 'text-emerald-600' : variacao < 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {variacao > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : variacao < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                {variacao > 0 ? `+${variacao}` : variacao} em relação ao anterior
              </div>
            )}
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Novo registro
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-5">
          <p className="text-sm text-slate-400">Nenhum registro NPS ainda</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Registrar NPS
          </button>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Novo registro NPS</h3>
          <form action={handleSubmit} className="space-y-4">
            {/* Hidden input com o score selecionado */}
            <input type="hidden" name="score" value={scoreInput ?? ''} />

            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">
                Nota de satisfação (0–10)
                {scoreInput !== null && (
                  <span className={`ml-2 font-bold ${npsZone(scoreInput).text}`}>
                    — {npsZone(scoreInput).label}
                  </span>
                )}
              </label>

              {/* Grid de botões 0-10 */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 11 }, (_, n) => {
                  const zone = npsZone(n)
                  const isSelected = scoreInput === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScoreInput(n)}
                      className={`
                        flex h-11 w-11 items-center justify-center rounded-xl border-2 text-sm font-bold
                        transition-all duration-100
                        ${isSelected
                          ? `${zone.selectedBg} ${zone.selectedText} ${zone.selectedBorder} scale-110 shadow-md`
                          : `${zone.bg} ${zone.text} ${zone.unselectedBorder} hover:scale-105 hover:shadow-sm`
                        }
                      `}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>

              {/* Legenda */}
              <div className="mt-2 flex gap-4 text-xs text-slate-400">
                <span>🔴 Detrator (0–6)</span>
                <span>🟡 Neutro (7–8)</span>
                <span>🟢 Promotor (9–10)</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Data da coleta</label>
              <input
                name="data_registro"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Observação</label>
              <textarea
                name="observacao"
                rows={2}
                placeholder="Contexto da avaliação, o que o cliente disse..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); setScoreInput(null) }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || scoreInput === null}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : 'Salvar NPS'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Histórico */}
      {registros.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Histórico</h3>
          {registros.map((r) => {
            const cls = npsZone(r.score)
            return (
              <div key={r.id} className="flex items-start justify-between rounded-xl border border-slate-100 bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold ${cls.bg} ${cls.text} ${cls.unselectedBorder}`}>
                    {r.score}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${cls.text}`}>{cls.label}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.data_registro).toLocaleDateString('pt-BR')}
                      {r.responsavel?.nome && ` · ${r.responsavel.nome}`}
                    </p>
                    {r.observacao && (
                      <p className="mt-1 text-xs text-slate-600">{r.observacao}</p>
                    )}
                  </div>
                </div>
                {userRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    disabled={isPending}
                    className="rounded p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
