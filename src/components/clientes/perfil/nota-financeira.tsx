'use client'

import { useState, useEffect, useRef } from 'react'
import { saveNotaFinanceira } from '@/app/actions/clientes'

export function NotaFinanceira({ clienteId, nota }: { clienteId: string; nota: string | null }) {
  const [value, setValue] = useState(nota ?? '')
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (value === (nota ?? '')) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const result = await saveNotaFinanceira(clienteId, value)
      if (!result.error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }, 800)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">Notas Financeiras Internas</h3>
        {saved && <span className="text-xs text-emerald-600">Salvo ✓</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder="Observações financeiras internas sobre este cliente (não visível ao cliente)..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none text-slate-700 placeholder-slate-300"
      />
    </div>
  )
}
