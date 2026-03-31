'use client'

import { useState, useTransition, useRef } from 'react'
import { Upload, Download, Trash2, FileText, Sparkles } from 'lucide-react'
import { uploadDocumento, deleteDocumento, getDocumentoUrl } from '@/app/actions/documentos'
import { TooltipInfo } from '@/components/ui/tooltip-info'
import { GerarDocumentoModal } from './gerar-documento-modal'
import type { Documento, DocumentoTipo } from '@/types/database'
import type { ModeloItem } from '@/app/actions/gerar-documento'

const tipoLabel: Record<DocumentoTipo, string> = {
  contrato:     'Contrato',
  procuracao:   'Procuração',
  autorizacao:  'Autorização',
  nota_fiscal:  'Nota Fiscal',
  outro:        'Outro',
}

const tipoBadge: Record<DocumentoTipo, string> = {
  contrato:    'bg-blue-50 text-blue-700',
  procuracao:  'bg-violet-50 text-violet-700',
  autorizacao: 'bg-amber-50 text-amber-700',
  nota_fiscal: 'bg-emerald-50 text-emerald-700',
  outro:       'bg-slate-100 text-slate-600',
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentosTabProps {
  clienteId: string
  documentos: Documento[]
  modelos:   ModeloItem[]
}

export function DocumentosTab({ clienteId, documentos, modelos }: DocumentosTabProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showGerar, setShowGerar] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleUpload(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await uploadDocumento(clienteId, formData)
      if (result.error) { setError(result.error) } else { setShowForm(false); formRef.current?.reset() }
    })
  }

  function handleDelete(documentoId: string, storagePath: string) {
    if (!confirm('Excluir este documento permanentemente?')) return
    startTransition(async () => { await deleteDocumento(clienteId, documentoId, storagePath) })
  }

  async function handleDownload(storagePath: string, nome: string) {
    const url = await getDocumentoUrl(storagePath)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.target = '_blank'
    a.click()
  }

  return (
    <div className="p-6 space-y-5">
      {showGerar && (
        <GerarDocumentoModal
          clienteId={clienteId}
          modelos={modelos}
          onClose={() => setShowGerar(false)}
          onSuccess={() => setShowGerar(false)}
        />
      )}

      <div className="flex justify-end gap-2">
        {modelos.length > 0 && (
          <button
            onClick={() => setShowGerar(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4 text-blue-500" /> Gerar a partir de modelo
          </button>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" /> Enviar documento
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Upload de documento</h3>
          <form ref={formRef} action={handleUpload} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Arquivo (PDF, PNG, JPG — máx. 10MB) *</label>
              <input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-700" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1">
                <label className="text-xs font-medium text-slate-600">Tipo de documento</label>
                <TooltipInfo text="Contrato: acordo comercial assinado. Procuração: autorização legal para agir em nome do cliente. Autorização: aprovação específica (ex: veicular anúncios). Nota Fiscal: comprovante emitido pela clínica. Outro: demais documentos relevantes." />
              </div>
              <select name="tipo" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
                <option value="contrato">Contrato</option>
                <option value="procuracao">Procuração</option>
                <option value="autorizacao">Autorização</option>
                <option value="nota_fiscal">Nota Fiscal</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {isPending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {documentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 rounded-xl bg-slate-50 p-4"><FileText className="h-6 w-6 text-slate-300" /></div>
          <p className="text-sm text-slate-400">Nenhum documento enviado ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 group">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{doc.nome}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoBadge[doc.tipo as DocumentoTipo] ?? tipoBadge.outro}`}>
                  {tipoLabel[doc.tipo as DocumentoTipo] ?? 'Outro'}
                </span>
                <button
                  onClick={() => handleDownload(doc.arquivo_url, doc.nome)}
                  className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-50 hover:text-blue-600 group-hover:opacity-100"
                  title="Download"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id, doc.arquivo_url)}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
