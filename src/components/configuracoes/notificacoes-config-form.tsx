'use client'

import { useState, useTransition } from 'react'
import { Mail, AlertCircle } from 'lucide-react'
import { saveNotificacoesConfig } from '@/app/actions/notificacoes'
import type { NotificacaoConfigItem, NotificacaoEvento } from '@/app/actions/notificacoes'

const EVENTO_META: Record<NotificacaoEvento, { label: string; desc: string; temAntecedencia: boolean }> = {
  fatura_vencendo:   { label: 'Fatura vencendo',    desc: 'Avisa o cliente X dias antes do vencimento',       temAntecedencia: true  },
  fatura_vencida:    { label: 'Fatura vencida',      desc: 'Avisa o cliente quando a fatura entra em atraso',  temAntecedencia: false },
  renovacao_proxima: { label: 'Renovação próxima',   desc: 'Avisa o cliente sobre renovação de produto',       temAntecedencia: true  },
  acordo_criado:     { label: 'Acordo criado',        desc: 'Confirma a criação de um acordo ao cliente',       temAntecedencia: false },
}

interface Props {
  config: NotificacaoConfigItem[]
  resendConfigurado: boolean
}

export function NotificacoesConfigForm({ config, resendConfigurado }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error,  setError]  = useState<string | null>(null)
  const [saved,  setSaved]  = useState(false)
  const [items,  setItems]  = useState<NotificacaoConfigItem[]>(config)
  // Estado controlado dos inputs de dias (texto bruto, separado por vírgula)
  const [diasInput, setDiasInput] = useState<Record<string, string>>(
    () => Object.fromEntries(config.map(i => [i.evento, (i.dias_antecedencia ?? []).join(', ')]))
  )

  function toggle(evento: NotificacaoEvento) {
    setItems(prev => prev.map(i => i.evento === evento ? { ...i, ativo: !i.ativo } : i))
  }

  function setDiasRaw(evento: NotificacaoEvento, valor: string) {
    // Armazena o texto bruto para o input controlado
    setDiasInput(prev => ({ ...prev, [evento]: valor }))
    const nums = valor.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n) && n > 0)
    setItems(prev => prev.map(i => i.evento === evento ? { ...i, dias_antecedencia: nums.length > 0 ? nums : null } : i))
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveNotificacoesConfig(items)
      if (result.error) { setError(result.error) }
      else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    })
  }

  return (
    <div className="space-y-5">
      {!resendConfigurado && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Resend não configurado</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Defina <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> e <code className="rounded bg-amber-100 px-1">RESEND_FROM_EMAIL</code> nas variáveis de ambiente para ativar o envio de e-mails.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const meta = EVENTO_META[item.evento]
          return (
            <div
              key={item.evento}
              className={`rounded-lg border px-4 py-3 transition ${item.ativo ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100 bg-slate-50/50'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.ativo ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Mail className={`h-3.5 w-3.5 ${item.ativo ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{meta.label}</p>
                    <p className="text-xs text-slate-400">{meta.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(item.evento)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none ${item.ativo ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${item.ativo ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {item.ativo && meta.temAntecedencia && (
                <div className="mt-3 ml-11 flex items-center gap-2">
                  <label className="text-xs text-slate-500 shrink-0">Dias antes:</label>
                  <input
                    type="text"
                    value={diasInput[item.evento] ?? ''}
                    onChange={e => setDiasRaw(item.evento, e.target.value)}
                    placeholder="ex: 3, 7"
                    className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <span className="text-xs text-slate-400">(separados por vírgula)</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {saved && <p className="text-sm text-emerald-600">Configurações salvas</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? 'Salvando...' : 'Salvar notificações'}
        </button>
      </div>
    </div>
  )
}
