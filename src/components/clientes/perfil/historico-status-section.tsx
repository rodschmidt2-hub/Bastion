import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { TooltipInfo } from '@/components/ui/tooltip-info'

type EventoStatus = {
  id: string
  created_at: string
  descricao: string
  dados: any
  usuario?: { nome: string | null; email: string }
}

const statusIcon: Record<string, React.ReactNode> = {
  ativo: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  inativo: <XCircle className="h-4 w-4 text-slate-400" />,
  suspenso: <AlertCircle className="h-4 w-4 text-red-500" />,
  inadimplente: <AlertCircle className="h-4 w-4 text-amber-500" />,
}

export function HistoricoStatusSection({ eventos }: { eventos: EventoStatus[] }) {
  if (eventos.length === 0) return null

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Histórico de Status</h3>
        <TooltipInfo text="Registro de todas as mudanças de status do cliente. Ativo: em operação normal. Inadimplente: com pagamentos atrasados. Suspenso: serviços pausados. Inativo: sem contrato vigente." />
      </div>
      <ol className="space-y-3">
        {eventos.map((e) => {
          const dados = e.dados as any
          const statusNovo = dados?.status_novo as string | undefined
          return (
            <li key={e.id} className="flex gap-3 text-sm">
              <div className="mt-0.5 shrink-0">
                {statusIcon[statusNovo ?? ''] ?? <AlertCircle className="h-4 w-4 text-slate-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-700">{e.descricao}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(e.created_at).toLocaleString('pt-BR')}
                  {e.usuario && ` · ${e.usuario.nome ?? e.usuario.email}`}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
