'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const tabs = [
  { id: 'dados',       label: 'Dados' },
  { id: 'produtos',    label: 'Produtos' },
  { id: 'contratos',   label: 'Contratos' },
  { id: 'financeiro',  label: 'Financeiro' },
  { id: 'nps',         label: 'NPS' },
  { id: 'documentos',  label: 'Documentos' },
]

export function TabsNav({ clienteId }: { clienteId: string }) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'dados'

  return (
    <div className="flex gap-1 border-b border-slate-100 px-6">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/clientes/${clienteId}?tab=${tab.id}`}
          className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
