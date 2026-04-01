'use client'

import { useState, useTransition } from 'react'
import { X, FileText, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react'
import { gerarDocumento } from '@/app/actions/gerar-documento'
import type { ModeloItem } from '@/lib/tipos/documento'

interface Props {
  clienteId: string
  modelos:   ModeloItem[]
  onClose:   () => void
  onSuccess: () => void
}

const TIPO_LABEL: Record<string, string> = {
  contrato:    'Contrato',
  proposta:    'Proposta',
  autorizacao: 'Autorização',
  termo:       'Termo',
  outro:       'Outro',
}

export function GerarDocumentoModal({ clienteId, modelos, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string | null>(modelos[0]?.id ?? null)
  const [error,   setError]   = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  function handleGerar() {
    if (!selectedId) return
    setError(null)
    setWarning(null)
    setSignedUrl(null)
    startTransition(async () => {
      const result = await gerarDocumento(clienteId, selectedId)
      if (result.error) {
        setError(result.error)
      } else if ('signedUrl' in result && result.signedUrl) {
        // Modelo sem variáveis ou PDF: baixa diretamente
        setWarning(result.warning ?? null)
        setSignedUrl(result.signedUrl)
      } else {
        // DOCX gerado e salvo nos documentos do cliente
        onSuccess()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Gerar documento</h2>
            <p className="text-xs text-slate-400 mt-0.5">Preenche o template com os dados do cliente</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {modelos.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-3 rounded-xl bg-slate-50 p-4">
                <FileText className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Nenhum modelo disponível</p>
              <p className="text-xs text-slate-400 mt-1">Acesse <strong>Modelos</strong> para cadastrar templates</p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Selecione o modelo *</label>
                <div className="space-y-1.5 rounded-lg border border-slate-200 p-2 max-h-56 overflow-y-auto">
                  {modelos.map((m) => (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition ${selectedId === m.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <input
                        type="radio"
                        name="modelo"
                        value={m.id}
                        checked={selectedId === m.id}
                        onChange={() => setSelectedId(m.id)}
                        className="mt-0.5 accent-blue-600"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700">{m.nome}</p>
                        <p className="text-xs text-slate-400">
                          {TIPO_LABEL[m.tipo] ?? m.tipo}
                          {m.descricao ? ` · ${m.descricao}` : ''}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5">
                <Sparkles className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500">
                  Variáveis como <code className="rounded bg-slate-200 px-1">{'{nome_cliente}'}</code>, <code className="rounded bg-slate-200 px-1">{'{cnpj}'}</code> e <code className="rounded bg-slate-200 px-1">{'{data_hoje}'}</code> serão preenchidas automaticamente com os dados do cliente.
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {warning && signedUrl && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 space-y-2">
              <p className="text-xs text-amber-700">{warning}</p>
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                <ExternalLink className="h-3 w-3" /> Baixar arquivo original
              </a>
            </div>
          )}
        </div>

        {modelos.length > 0 && !signedUrl && (
          <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGerar}
              disabled={isPending || !selectedId}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? 'Gerando...' : 'Gerar documento'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
