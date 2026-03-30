'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface ExportCsvButtonProps {
  clienteId: string
}

export function ExportCsvButton({ clienteId }: ExportCsvButtonProps) {
  const [showFilter, setShowFilter] = useState(false)
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')

  function handleExport() {
    const params = new URLSearchParams()
    if (de) params.set('de', de)
    if (ate) params.set('ate', ate)
    const qs = params.toString()
    window.location.href = `/api/export/financeiro/${clienteId}${qs ? `?${qs}` : ''}`
    setShowFilter(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilter((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        <Download className="h-4 w-4" />
        Exportar CSV
      </button>

      {showFilter && (
        <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-xl border border-slate-200 bg-white shadow-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600">Filtrar por período</p>
          <div>
            <label className="mb-1 block text-xs text-slate-500">De (mês/ano)</label>
            <input
              type="month"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Até (mês/ano)</label>
            <input
              type="month"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilter(false)}
              className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Baixar CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
