import Link from 'next/link'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Documento } from '@/types/database'

const tipoLabel: Record<string, string> = {
  contrato: 'Contrato', procuracao: 'Procuração', autorizacao: 'Autorização',
  nota_fiscal: 'Nota Fiscal', outro: 'Outro',
}

const tipoBadge: Record<string, string> = {
  contrato:    'bg-blue-50 text-blue-700',
  procuracao:  'bg-violet-50 text-violet-700',
  autorizacao: 'bg-amber-50 text-amber-700',
  nota_fiscal: 'bg-emerald-50 text-emerald-700',
  outro:       'bg-slate-100 text-slate-600',
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DocumentosPage() {
  const supabase = await createClient()

  const [{ data: documentos }, { data: clientes }] = await Promise.all([
    supabase.from('documentos_cliente').select('*').order('created_at', { ascending: false }),
    supabase.from('clientes').select('id, razao_social'),
  ])

  const clienteMap = Object.fromEntries((clientes ?? []).map((c) => [c.id, c.razao_social]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Documentos</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {(documentos ?? []).length} {(documentos ?? []).length === 1 ? 'documento' : 'documentos'} armazenados
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        {(documentos ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 rounded-xl bg-slate-50 p-4"><FileText className="h-6 w-6 text-slate-300" /></div>
            <p className="text-sm text-slate-400">Nenhum documento ainda</p>
            <p className="mt-1 text-xs text-slate-400">Envie documentos dentro do perfil de cada cliente</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Documento</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Tipo</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Tamanho</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Enviado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(documentos as Documento[]).map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-slate-300" />
                      <span className="font-medium text-slate-700">{doc.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/clientes/${doc.cliente_id}?tab=documentos`} className="text-slate-600 hover:text-blue-600">
                      {clienteMap[doc.cliente_id] ?? '—'}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoBadge[doc.tipo] ?? tipoBadge.outro}`}>
                      {tipoLabel[doc.tipo] ?? 'Outro'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">—</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
